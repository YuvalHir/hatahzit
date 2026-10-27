import { scrape } from './scraper.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/data') {
      const [data, mc] = await Promise.all([
        env.HATAHZIT_KV.get('latest', 'text'),
        env.HATAHZIT_KV.get('mc', 'text'),
      ]);
      if (!data) return new Response(JSON.stringify({ error: 'warming up, first scrape pending' }), {
        status: 503, headers: { 'content-type': 'application/json; charset=utf-8' } });
      const merged = mc ? data.trimEnd().replace(/}$/, ',"mc":' + mc.trim() + '}') : data;
      return new Response(merged, { headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=60',
      } });
    }
    if (url.pathname === '/api/scrape-now' && env.SCRAPE_KEY && url.searchParams.get('key') === env.SCRAPE_KEY) {
      const prev = await env.HATAHZIT_KV.get('latest', 'json') || {};
      const data = await scrape(prev);
      await env.HATAHZIT_KV.put('latest', JSON.stringify(data));
      return new Response(JSON.stringify({ ok: true, updated_at: data.updated_at, errors: data.errors }), {
        headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const prev = await env.HATAHZIT_KV.get('latest', 'json') || {};
      const data = await scrape(prev);
      await env.HATAHZIT_KV.put('latest', JSON.stringify(data));
    })());
  },
};
