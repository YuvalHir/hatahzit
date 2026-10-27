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
  // Maariv / Lazar Research 23.10 (verified via skarim.org + madad120): right 48, center 54, arab 14, reservists 4, winter below threshold
  { id: "maariv", seats: { yashar:21, likud:19, beyahad:15, democratim:10, meshutefet:9, shas:8, yahadut:7, tziyonut:7, otzma:7, beiteinu:8, raam:5, miluim:4 } },
];
// Pollster map (verified via TheMarker 11.6.25 + data24): ch14 = NEXT DATA (Shlomo Filber);
// i24 = Direct Polls (Tzuriel Sharon) — Direct Polls LEFT ch14 in June 2025, so these are
// TWO separate houses, both historically Likud-friendly. Not merged; documented instead.

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
// winter ~3.0% (Maariv: just below threshold; i24: 4 seats), miluim 3.3% (4 seats in 3/7 polls),
// noam 0.5%, haredi 0.9% (per Maariv-reported vote shares; tagged judgment)
export const SUBTHRESHOLD_SHARES = { winter: 0.030, miluim: 0.033, noam: 0.005, haredi: 0.009 };

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

export function runMc({ sectorDeltas = {}, nationalDelta = null, sims = 100000,
                        marginSdSeats = 3.0, partySd = 0.05, withinBlocRenorm = 0.5,
                        turnoutDiscount = 0.5, turnoutShockSd = 0.3,
                        sectorPopWeights = { general: 0.66, haredi: 0.14, arab: 0.11, judea_samaria: 0.07, christian: 0.01, druze: 0.01 },
                        polls = POLLS, rng = Math.random } = {}) {
  // Turnout update (Claude r2 #2): rescale sector deltas so their population-weighted mean
  // matches the national delta (sector weights are judgment, ~2022 CEC composition), then
  // discount by turnoutDiscount because final polls already priced a turnout surge
  // (Maariv: 81% certain to vote vs ~71% in 2022 - verified). Per-draw shock below.
  const d = { ...sectorDeltas };
  if (nationalDelta != null) {
    const wMean = Object.keys(sectorPopWeights).reduce((a, s) => a + (sectorPopWeights[s] || 0) * (d[s] || 0), 0);
    const k = wMean !== 0 ? nationalDelta / wMean : 1;
    for (const s in d) d[s] *= k;
  }
  for (const s in d) d[s] *= turnoutDiscount;
  const baseMult = {};
  for (const p of PARTIES) {
    let m = 1;
    for (const s in SECTOR_NORM[p]) if (d[s] != null) m += SECTOR_NORM[p][s] * d[s];
    baseMult[p] = m;
  }

  const blocSum = (seats, bloc) => BLOCS[bloc].reduce((a, p) => a + seats[p], 0);
  let right61 = 0, center61 = 0, either = 0;
  let rightTotal = 0, centerTotal = 0, arabTotal = 0;
  const rightHist = new Map(), centerHist = new Map();
  const passCount = { winter: 0, miluim: 0, noam: 0, haredi: 0 };
  const seatsTotal = Object.fromEntries(PARTIES.map(p => [p, 0]));

  for (let sim = 0; sim < sims; sim++) {
    const poll = polls[(rng() * polls.length) | 0];
    const votes = {};
    let seatSum = 0;
    for (const p in poll.seats) seatSum += poll.seats[p];
    for (const p of PARTIES) {
      const st = SUBTHRESHOLD_SHARES[p];
      if (poll.seats[p] != null && poll.seats[p] > 0) votes[p] = poll.seats[p] / seatSum;
      else votes[p] = st != null ? st : 0;
    }
    // turnout shock (uncertainty in the update itself)
    const kappa = 1 + randn() * turnoutShockSd;
    // correlated margin swing (Claude r2 #3): ~3 seats SD on the right-minus-center margin,
    // replacing the too-tight 2% relative swing. Converted to multipliers on each bloc.
    const rightSeats0 = BLOCS.right.reduce((a, p) => a + (poll.seats[p] || 0), 0);
    const centerSeats0 = BLOCS.center.reduce((a, p) => a + (poll.seats[p] || 0), 0);
    const shift = randn() * marginSdSeats;
    const rightMult = Math.max(0.7, 1 + shift / Math.max(rightSeats0, 1));
    const centerMult = Math.max(0.7, 1 - shift / Math.max(centerSeats0, 1));
    // party noise with partial within-bloc renormalization (late consolidation within blocs)
    const eps = {};
    for (const p of PARTIES) eps[p] = randn() * partySd;
    for (const bloc of ['right', 'center']) {
      const ps = BLOCS[bloc];
      let wsum = 0, esum = 0;
      for (const p of ps) { wsum += votes[p]; esum += votes[p] * eps[p]; }
      const m = wsum > 0 ? esum / wsum : 0;
      for (const p of ps) eps[p] -= withinBlocRenorm * m;
    }
    for (const p of PARTIES) {
      let v = votes[p] * (1 + (baseMult[p] - 1) * kappa) * (1 + eps[p]);
      if (BLOCS.right.includes(p)) v *= rightMult;
      else if (BLOCS.center.includes(p)) v *= centerMult;
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
  const hist = (m) => [...m.entries()].sort((x, y) => x[0] - y[0]).map(([st, n]) => ({ seats: st, p: +(n / sims).toFixed(4) }));
  return {
    sims,
    p_right_61: +(right61 / sims).toFixed(4),
    p_center_61: +(center61 / sims).toFixed(4),
    p_any_61: +(either / sims).toFixed(4),
    exp_seats: { right: +(rightTotal / sims).toFixed(1), center: +(centerTotal / sims).toFixed(1), arab: +(arabTotal / sims).toFixed(1) },
    party_exp_seats: Object.fromEntries(PARTIES.map(p => [p, +(seatsTotal[p] / sims).toFixed(1)])),
    threshold_pass: Object.fromEntries(Object.entries(passCount).map(([p, n]) => [p, +(n / sims).toFixed(3)])),
    right_hist: hist(rightHist), center_hist: hist(centerHist),
    params: { marginSdSeats, partySd, withinBlocRenorm, turnoutDiscount, turnoutShockSd, sectorDeltasRaw: sectorDeltas, sectorDeltasScaled: Object.fromEntries(Object.entries(d).map(([k, v]) => [k, +v.toFixed(4)])), nationalDelta, turnoutMult: Object.fromEntries(PARTIES.map(p => [p, +baseMult[p].toFixed(3)])) },
  };
}
