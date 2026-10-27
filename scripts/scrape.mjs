// Local/manual run of the scraper: node scripts/scrape.mjs
// Prints the JSON payload; pipe into `wrangler kv key put` for a manual seed.
import { scrape } from '../src/scraper.js';
const data = await scrape({});
console.log(JSON.stringify(data, null, 2));
