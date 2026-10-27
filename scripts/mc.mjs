// Run the MC against live sectoral turnout deltas and print the result JSON.
import { runMc } from '../src/mc.mjs';

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
// Turnout discount (Claude r4 #2 + Grok r4 #2): the poll-pricing discount is ~constant
// (~0.5-0.6); what firms up is measurement precision, keyed to the DATA timestamp, not
// wall clock. Back-loaded: 0.50 until 15:00 IST data time, linear to 0.75 by 19:30
// (0.85-0.90 judged too high - polls permanently priced the surge).
const dataMins = withSectors && withSectors.at
  ? (new Date(withSectors.at).getTime() / 60000 + 120) % 1440
  : (Date.now() / 60000 + 120) % 1440; // UTC+2 (IST, winter time)
const progress = Math.max(0, Math.min(1, (dataMins - 15 * 60) / (4.5 * 60)));
const turnoutDiscount = 0.5 + 0.25 * progress;
const t0 = Date.now();
const mc = runMc({ sectorDeltas, nationalDelta, sims: 100000, turnoutDiscount });
// Second precomputed run without Channel 14 (site toggle; headline default keeps Ch14 ON per owner ruling)
import { POLLS } from '../src/mc.mjs';
const exCh14 = runMc({ sectorDeltas, nationalDelta, sims: 100000, turnoutDiscount, polls: POLLS.filter(p => p.id !== 'ch14') });
const exCh14I24 = runMc({ sectorDeltas, nationalDelta, sims: 100000, turnoutDiscount, polls: POLLS.filter(p => p.id !== 'ch14' && p.id !== 'i24') });
console.error('sim time ms:', Date.now() - t0);
console.log(JSON.stringify({ updated_at: new Date().toISOString(), sectorsAt: withSectors ? withSectors.at : null, sectors, mc, exCh14, exCh14I24 }, null, 0));
