// Run the MC against live sectoral turnout deltas and print the result JSON.
// v3.6: also computes model-derived "flashes" (with/without sensitivity reruns on the
// headline all-7 mix) and appends this run to the on-site sim history.
import { runMc, POLLS } from '../src/mc.mjs';

const r = await fetch('https://votes26.com/api/v1/elections/26/turnout', { headers: { 'user-agent': 'hatahzit-forecast/1.0' } });
const data = await r.json();
const withSectors = [...data.reports].reverse().find(x => (x.sectors || []).length);
const sectorDeltas = {};
let sectors = [];
if (withSectors) {
  sectors = withSectors.sectors.map(s => ({ id: s.id, now: +(s.now*100).toFixed(1), est: +(s.est*100).toFixed(1), prev2022: +(s.prev*100).toFixed(1) }));
  for (const s of withSectors.sectors) sectorDeltas[s.id] = +(s.est / s.prev - 1).toFixed(4);
}
const latest = data.reports[data.reports.length - 1];
const nationalDelta = +(latest.national.est / latest.national.prev - 1).toFixed(4);
// Turnout discount: ~constant poll-pricing discount (~0.5-0.6); measurement precision
// firms up keyed to the DATA timestamp, not wall clock (Claude r4 #2). 0.50 -> 0.75.
const dataMins = withSectors && withSectors.at
  ? (new Date(withSectors.at).getTime() / 60000 + 120) % 1440
  : (Date.now() / 60000 + 120) % 1440; // UTC+2 (IST, winter time)
const progress = Math.max(0, Math.min(1, (dataMins - 15 * 60) / (4.5 * 60)));
const turnoutDiscount = 0.5 + 0.25 * progress;
const t0 = Date.now();
const baseArgs = { sectorDeltas, nationalDelta, sims: 100000, turnoutDiscount };
const mc = runMc(baseArgs);
const exCh14 = runMc({ ...baseArgs, polls: POLLS.filter(p => p.id !== 'ch14') });
const exCh14I24 = runMc({ ...baseArgs, polls: POLLS.filter(p => p.id !== 'ch14' && p.id !== 'i24') });

// --- Flashes: each factor's effect on the headline p_any, computed by the model itself
// (rerun with the factor neutralized). |pp| < 0.3 is within MC noise -> direction only.
const noTurn = runMc({ ...baseArgs, sectorDeltas: {}, nationalDelta: null });
const eff = c => +((mc.p_any_61 - c.p_any_61) * 100).toFixed(2);
const dirOf = pp => pp > 0.05 ? 'up' : pp < -0.05 ? 'down' : 'flat';
const pct = x => (x * 100).toFixed(1);
const ilHM = iso => { const d = new Date(iso); return String((d.getUTCHours() + 2) % 24).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const flashes = [];
flashes.push({ id: 'turnout', dir: dirOf(eff(noTurn)), pp: eff(noTurn),
  title: 'אחוזי ההצבעה הארצי', detail: `אומדן סוף־יום ${pct(latest.national.est)}% מול ${pct(latest.national.prev)}% ב־2022`, dataAt: ilHM(latest.at) });
const SEC = { arab: 'המגזר הערבי', haredi: 'המגזר החרדי', judea_samaria: 'יהודה ושומרון' };
for (const [sid, name] of Object.entries(SEC)) {
  if (sectorDeltas[sid] == null) continue;
  const sd = { ...sectorDeltas }; delete sd[sid];
  const cmp = runMc({ ...baseArgs, sectorDeltas: sd });
  const s = sectors.find(x => x.id === sid);
  flashes.push({ id: 'sec-' + sid, dir: dirOf(eff(cmp)), pp: eff(cmp),
    title: name, detail: `אומדן ${s.est}% מול ${s.prev2022}% ב־2022`, dataAt: withSectors ? ilHM(withSectors.at) : null });
}

// --- Sim history for the on-site timeline (read back from the live API)
let history = [];
try { const cur = await (await fetch('https://hatahzit.hyuval1511.workers.dev/api/data')).json(); history = (cur.mc && cur.mc.history) || []; } catch {}
history.unshift({ at: new Date().toISOString(), p_any: +mc.p_any_61.toFixed(4) });
history = history.slice(0, 12);

console.error('sim time ms:', Date.now() - t0);
console.log(JSON.stringify({ updated_at: new Date().toISOString(), sectorsAt: withSectors ? withSectors.at : null, sectors, mc, exCh14, exCh14I24, flashes, history }, null, 0));
