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
// Gemini r3 #3: intraday pacing deltas firm up toward EOD. Discount ramps 0.50 -> 0.85
// between 07:00 and 19:00 IST (polls already priced the surge; early-day ratios are noisy).
const istMins = (Date.now() / 60000 + 120) % 1440; // UTC+2 (IST, winter time)
const progress = Math.max(0, Math.min(1, (istMins - 7 * 60) / (12 * 60)));
const turnoutDiscount = Math.min(0.85, 0.5 + 0.35 * progress);
const t0 = Date.now();
const mc = runMc({ sectorDeltas, nationalDelta, sims: 100000, turnoutDiscount });
console.error('sim time ms:', Date.now() - t0);
console.log(JSON.stringify({ updated_at: new Date().toISOString(), sectorsAt: withSectors ? withSectors.at : null, sectors, mc }, null, 0));
