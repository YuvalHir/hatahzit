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
const t0 = Date.now();
const mc = runMc({ sectorDeltas, sims: 100000 });
console.error('sim time ms:', Date.now() - t0);
console.log(JSON.stringify({ updated_at: new Date().toISOString(), sectorsAt: withSectors ? withSectors.at : null, sectors, mc }, null, 0));
