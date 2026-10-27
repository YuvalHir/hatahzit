// התחזית × כנסת 26 — seat-level Monte Carlo (documented in MODEL.md)
// Prior: 6 final TV polls (seats -> vote shares). Update: live CEC sectoral turnout
// deltas applied mechanically via a judgment sector->party matrix, then renormalized.
// Noise: bloc-level correlated swing + party-level noise. 3.25% threshold, Bader-Ofer
// with the verified 2026 surplus agreements, double-envelope right shift (judgment).

export const POLLS = [
  { id: "ch12",  seats: { yashar:23, likud:21, beyahad:15, democratim:10, meshutefet:9, shas:8, yahadut:7, tziyonut:6, otzma:8, beiteinu:8, raam:5 } },
  { id: "ch13",  seats: { yashar:22, likud:19, beyahad:14, democratim:10, meshutefet:9, shas:7, yahadut:8, tziyonut:8, otzma:8, beiteinu:8, raam:7 } },
  { id: "ch14",  seats: { yashar:20, likud:30, beyahad:11, democratim:8, meshutefet:8, shas:9, yahadut:8, tziyonut:7, otzma:8, beiteinu:5, raam:6 } },
  { id: "kan",   seats: { yashar:22, likud:20, beyahad:14, democratim:8, meshutefet:9, shas:7, yahadut:8, tziyonut:7, otzma:8, beiteinu:8, raam:5, miluim:4 } },
  { id: "i24",   seats: { yashar:21, likud:26, beyahad:12, democratim:8, meshutefet:9, shas:8, yahadut:7, tziyonut:6, otzma:8, beiteinu:6, raam:5, winter:4 } },
  { id: "walla", seats: { yashar:23, likud:19, beyahad:14, democratim:9, meshutefet:8, shas:8, yahadut:7, tziyonut:6, otzma:8, beiteinu:8, raam:6, miluim:4 } },
];

export const BLOCS = {
  right:  ["likud", "shas", "yahadut", "tziyonut", "otzma", "noam", "winter"],
  center: ["yashar", "beyahad", "democratim", "beiteinu"],
  arab:   ["meshutefet", "raam"],
  miluim: ["miluim"],
  haredi2: ["haredi"],
};

// Verified surplus agreements for Knesset 26 (ynet "מפת העודפים" + c14):
export const SURPLUS_PAIRS = [
  ["likud", "tziyonut"], ["shas", "yahadut"], ["yashar", "democratim"],
  ["beyahad", "beiteinu"], ["raam", "meshutefet"],
];

// Judgment: assumed vote share for lists at/near the 3.25% threshold (polls show 0-4 seats).
export const SUBTHRESHOLD_SHARES = { winter: 0.026, miluim: 0.028, noam: 0.018, haredi: 0.018 };

// Judgment matrix: fraction of each party's votes by sector (grounded in historical
// voting patterns, NOT a live source). Rows are normalized in code.
const SECTOR_OF = {
  likud:      { general: .88, haredi: .02, judea_samaria: .055, arab: .005, christian: .01, druze: .03 },
  shas:       { general: .74, haredi: .20, judea_samaria: .02, druze: .04 },
  yahadut:    { general: .05, haredi: .93, judea_samaria: .02 },
  tziyonut:   { general: .70, haredi: .05, judea_samaria: .22, druze: .02, christian: .01 },
  otzma:      { general: .72, haredi: .05, judea_samaria: .20, druze: .02, christian: .01 },
  noam:       { general: .65, haredi: .10, judea_samaria: .23, druze: .01, christian: .01 },
  winter:     { general: .80, haredi: .04, judea_samaria: .14, druze: .01, christian: .01 },
  yashar:     { general: .895, haredi: .005, judea_samaria: .04, arab: .015, christian: .015, druze: .03 },
  beyahad:    { general: .90, haredi: .01, judea_samaria: .05, arab: .01, christian: .01, druze: .02 },
  democratim: { general: .87, haredi: .005, judea_samaria: .015, arab: .045, christian: .03, druze: .035 },
  beiteinu:   { general: .92, haredi: .01, judea_samaria: .03, arab: .01, christian: .015, druze: .015 },
  meshutefet: { general: .06, arab: .78, christian: .13, druze: .03 },
  raam:       { general: .05, arab: .88, christian: .05, druze: .02 },
  miluim:     { general: .95, judea_samaria: .03, arab: .01, christian: .005, druze: .005 },
  haredi:     { general: .15, haredi: .85 },
};

const PARTIES = Object.keys(SECTOR_OF);
const norm = (o) => { const t = Object.values(o).reduce((a, b) => a + b, 0); const r = {}; for (const k in o) r[k] = o[k] / t; return r; };
const SECTOR_NORM = Object.fromEntries(PARTIES.map(p => [p, norm(SECTOR_OF[p])]));

// gaussian
let spare = null;
function randn() {
  if (spare !== null) { const v = spare; spare = null; return v; }
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const m = Math.sqrt(-2 * Math.log(u)), t = 2 * Math.PI * v;
  spare = m * Math.sin(t);
  return m * Math.cos(t);
}

function baderOfer(votes, pairs) {
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  const thresh = 0.0325 * total;
  const passed = PARTIES.filter(p => votes[p] >= thresh);
  // combined entities for pairs where BOTH parties passed
  const inPair = {};
  const entities = [];
  for (const [a, b] of pairs) {
    if (passed.includes(a) && passed.includes(b)) {
      entities.push({ members: [a, b], votes: votes[a] + votes[b] });
      inPair[a] = inPair[b] = true;
    }
  }
  for (const p of passed) if (!inPair[p]) entities.push({ members: [p], votes: votes[p] });
  // allocate 120 seats by largest quotient
  const entSeats = entities.map(() => 0);
  for (let s = 0; s < 120; s++) {
    let best = -1, bestQ = -1;
    for (let i = 0; i < entities.length; i++) {
      const q = entities[i].votes / (entSeats[i] + 1);
      if (q > bestQ) { bestQ = q; best = i; }
    }
    entSeats[best]++;
  }
  const seats = Object.fromEntries(PARTIES.map(p => [p, 0]));
  entities.forEach((e, i) => {
    let n = entSeats[i];
    if (e.members.length === 1) { seats[e.members[0]] = n; return; }
    const [a, b] = e.members; let sa = 0, sb = 0;
    for (let s = 0; s < n; s++) {
      if (votes[a] / (sa + 1) >= votes[b] / (sb + 1)) sa++; else sb++;
    }
    seats[a] = sa; seats[b] = sb;
  });
  return seats;
}

export function runMc({ sectorDeltas = {}, sims = 100000, swingSd = 0.020, partySd = 0.06, doubleEnvelopeRightBoost = 1.008, polls = POLLS, rng = Math.random } = {}) {
  // turnout multipliers per party (fixed across sims — they are the live-data update)
  const turnoutMult = {};
  for (const p of PARTIES) {
    let m = 1;
    for (const s in SECTOR_NORM[p]) if (sectorDeltas[s] != null) m += SECTOR_NORM[p][s] * sectorDeltas[s];
    turnoutMult[p] = m;
  }
  const blocSum = (seats, bloc) => BLOCS[bloc].reduce((a, p) => a + seats[p], 0);
  let right61 = 0, center61 = 0, either = 0;
  let rightTotal = 0, centerTotal = 0, arabTotal = 0;
  const rightHist = new Map(), centerHist = new Map();
  const passCount = { winter: 0, miluim: 0, noam: 0, haredi: 0 };
  const seatsTotal = Object.fromEntries(PARTIES.map(p => [p, 0]));

  for (let sim = 0; sim < sims; sim++) {
    const poll = polls[(rng() * polls.length) | 0];
    // seats -> vote shares
    const votes = {};
    let seatSum = 0;
    for (const p in poll.seats) seatSum += poll.seats[p];
    for (const p of PARTIES) {
      const st = SUBTHRESHOLD_SHARES[p];
      if (poll.seats[p] != null && poll.seats[p] > 0) votes[p] = poll.seats[p] / seatSum;
      else votes[p] = st != null ? st : 0;
    }
    // correlated bloc swing: +right / -center together
    const swing = randn() * swingSd;
    // per-party noise + swing + turnout + double-envelope
    for (const p of PARTIES) {
      let v = votes[p] * turnoutMult[p] * (1 + randn() * partySd);
      if (BLOCS.right.includes(p)) v *= (1 + swing) * doubleEnvelopeRightBoost;
      else if (BLOCS.center.includes(p)) v *= (1 - swing);
      votes[p] = Math.max(v, 0);
    }
    const seats = baderOfer(votes, SURPLUS_PAIRS);
    const r = blocSum(seats, 'right'), c = blocSum(seats, 'center'), a = blocSum(seats, 'arab');
    rightTotal += r; centerTotal += c; arabTotal += a;
    rightHist.set(r, (rightHist.get(r) || 0) + 1);
    centerHist.set(c, (centerHist.get(c) || 0) + 1);
    if (r >= 61) right61++;
    if (c >= 61) center61++;
    if (r >= 61 || c >= 61) either++;
    for (const p of PARTIES) seatsTotal[p] += seats[p];
    for (const p in passCount) if (seats[p] > 0) passCount[p]++;
  }
  const hist = (m) => [...m.entries()].sort((x, y) => x[0] - y[0]).map(([s, n]) => ({ seats: s, p: +(n / sims).toFixed(4) }));
  return {
    sims,
    p_right_61: +(right61 / sims).toFixed(4),
    p_center_61: +(center61 / sims).toFixed(4),
    p_any_61: +(either / sims).toFixed(4),
    exp_seats: { right: +(rightTotal / sims).toFixed(1), center: +(centerTotal / sims).toFixed(1), arab: +(arabTotal / sims).toFixed(1) },
    party_exp_seats: Object.fromEntries(PARTIES.map(p => [p, +(seatsTotal[p] / sims).toFixed(1)])),
    threshold_pass: Object.fromEntries(Object.entries(passCount).map(([p, n]) => [p, +(n / sims).toFixed(3)])),
    right_hist: hist(rightHist), center_hist: hist(centerHist),
    params: { swingSd, partySd, doubleEnvelopeRightBoost, sectorDeltas, turnoutMult: Object.fromEntries(PARTIES.map(p => [p, +turnoutMult[p].toFixed(3)])) },
  };
}
