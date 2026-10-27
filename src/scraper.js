// התחזית × כנסת 26 — scraper core (shared by the Worker cron and scripts/scrape.mjs)
// Sources: all public, no logins. Turnout source is ONLY the votes26 turnout endpoint
// (/api/v1/elections/26/turnout, kind TURNOUT_DAY, is_official_result=false).
// NEVER touches exit-poll/results endpoints (e.g. /exit-polls, /official/*, /live beyond state).

const PM_SLUGS = {
  pm: 'who-will-be-the-next-prime-minister-of-israel-after-the-next-election',
  winner: 'israeli-legislative-election-winner',
  likudSeats: 'israel-election-likud-of-seats',
  blocMore: 'israel-election-which-bloc-wins-more-seats',
  hung: 'israeli-election-results-in-a-hung-parliament',
  coalition: 'israel-election-any-coalition-wins-a-majority',
  turnoutMkt: 'israeli-legislative-election-turnout',
};

async function j(url, ms = 9000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { 'user-agent': 'hatahzit-forecast/1.0 (+github.com/YuvalHir/hatahzit)' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}
async function txt(url, ms = 9000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { 'user-agent': 'hatahzit-forecast/1.0' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(t); }
}

function pmEvent(e) {
  const rows = (e.markets || []).map(m => {
    let price = null;
    try { price = JSON.parse(m.outcomePrices || '[]')[0]; } catch {}
    return { label: m.groupItemTitle || m.question, price: price == null ? null : +(+price * 100).toFixed(1),
             vol24h: m.volume24hr || 0, change1d: m.oneDayPriceChange != null ? +(m.oneDayPriceChange * 100).toFixed(1) : null };
  }).filter(r => r.price != null);
  rows.sort((a, b) => b.price - a.price);
  return rows;
}

export async function scrape(prev = {}) {
  const first = (v) => Array.isArray(v) ? v[0] : v;
  const errors = [];
  const grab = async (key, fn) => { try { return await fn(); } catch (e) { errors.push(key + ': ' + e.message); return undefined; } };

  const [pmPm, pmWinner, pmLikud, pmBloc, pmHung, pmCoal, pmTurn, kalshi, turnout, fx, fx2, trends] = await Promise.all([
    grab('pm', () => j('https://gamma-api.polymarket.com/events?slug=' + PM_SLUGS.pm)),
    grab('winner', () => j('https://gamma-api.polymarket.com/events?slug=' + PM_SLUGS.winner)),
    grab('likud', () => j('https://gamma-api.polymarket.com/events?slug=' + PM_SLUGS.likudSeats)),
    grab('bloc', () => j('https://gamma-api.polymarket.com/events?slug=' + PM_SLUGS.blocMore)),
    grab('hung', () => j('https://gamma-api.polymarket.com/events?slug=' + PM_SLUGS.hung)),
    grab('coalition', () => j('https://gamma-api.polymarket.com/events?slug=' + PM_SLUGS.coalition)),
    grab('turnoutMkt', () => j('https://gamma-api.polymarket.com/events?slug=' + PM_SLUGS.turnoutMkt)),
    grab('kalshi', () => j('https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXISRAELPM&status=open&limit=100')),
    grab('turnout', () => j('https://votes26.com/api/v1/elections/26/turnout')),
    grab('fx', () => j('https://query1.finance.yahoo.com/v8/finance/chart/ILS=X?interval=1d&range=1d')),
    grab('fx2', () => j('https://api.frankfurter.dev/v1/latest?base=USD&symbols=ILS')),
    grab('trends', () => txt('https://trends.google.com/trending/rss?geo=IL')),
  ]);

  const out = { updated_at: new Date().toISOString(), errors, markets: {}, kalshi: null, turnout: null, fx: null, trends: [] };

  if (pmPm) out.markets.pm = pmEvent(first(pmPm));
  if (pmWinner) out.markets.winner = pmEvent(first(pmWinner));
  if (pmLikud) out.markets.likudSeats = pmEvent(first(pmLikud));
  if (pmBloc) out.markets.blocMoreSeats = pmEvent(first(pmBloc));
  if (pmHung) out.markets.hungParliament = pmEvent(first(pmHung));
  if (pmCoal) out.markets.coalitionMajority = pmEvent(first(pmCoal));
  if (pmTurn) out.markets.turnoutMarket = pmEvent(first(pmTurn));

  if (kalshi && kalshi.markets) {
    out.kalshi = kalshi.markets.map(m => ({
      label: m.yes_sub_title || m.subtitle || m.ticker,
      price: m.last_price_dollars != null ? +(parseFloat(m.last_price_dollars) * 100).toFixed(1) : null,
    })).filter(r => r.price != null && r.price > 0).sort((a, b) => b.price - a.price).slice(0, 8);
  }

  if (turnout && turnout.reports && turnout.reports.length) {
    const latest = turnout.reports[turnout.reports.length - 1];
    const withSectors = [...turnout.reports].reverse().find(r => (r.sectors || []).length);
    out.turnout = {
      at: latest.at, hour: latest.hour,
      national: { now: +(latest.national.now * 100).toFixed(2), est: +(latest.national.est * 100).toFixed(1),
                  lo: +(latest.national.lo * 100).toFixed(1), hi: +(latest.national.hi * 100).toFixed(1),
                  prevFinal2022: +(latest.national.prev * 100).toFixed(1) },
      series: turnout.reports.filter(r => r.national && r.national.now).map(r => ({ hour: r.hour, now: +(r.national.now * 100).toFixed(2) })),
      sectors: withSectors ? withSectors.sectors.map(s => ({ id: s.id, now: +(s.now * 100).toFixed(1), est: +(s.est * 100).toFixed(1), prev2022: +(s.prev * 100).toFixed(1) })) : [],
      sectorsAt: withSectors ? withSectors.at : null,
      source: 'votes26.com/api/v1/elections/26/turnout (turnout only, is_official_result=false)',
    };
  }

  // Arab sector as a first-class tracked input (latest sector-rich report only)
  if (out.turnout && out.turnout.sectors.length) {
    const a = out.turnout.sectors.find(s => s.id === 'arab');
    if (a) out.turnout.arab = { now: a.now, est: a.est, prev2022: a.prev2022, deltaEstVs2022: +(a.est - a.prev2022).toFixed(1), at: out.turnout.sectorsAt };
  }

  try { out.fx = { usdIls: +fx.chart.result[0].meta.regularMarketPrice.toFixed(3), source: 'yahoo' }; } catch {}
  if (!out.fx && fx2 && fx2.rates && fx2.rates.ILS) out.fx = { usdIls: +fx2.rates.ILS.toFixed(3), source: 'frankfurter' };

  if (trends) {
    out.trends = [...trends.matchAll(/<title>([^<]+)<\/title>/g)].map(m => m[1]).slice(1, 12);
  }

  // ---- benchmark only (NOT blended into the forecast): the forecast is the seat-level
  // Monte Carlo in src/mc.mjs, computed off-worker and pushed to KV key "mc". ----
  const coalRow = (out.markets.coalitionMajority || [])[0];
  const hungRow = (out.markets.hungParliament || [])[0];
  out.benchmark = {
    coalitionMajority: coalRow ? coalRow.price : null,
    hungParliament: hungRow ? hungRow.price : null,
    note: 'markets are a sanity benchmark only; the headline comes from the seat-level Monte Carlo (see MODEL.md)',
  };

  // ---- on-site timeline: append newly detected events, persist via prev (KV "latest") ----
  const tl = Array.isArray(prev.timeline) ? [...prev.timeline] : [];
  const wasEmpty = tl.length === 0;
  const seenIds = new Set(tl.map(e => e.id));
  const addEv = (id, text) => { if (!seenIds.has(id)) { tl.unshift({ id, at: out.updated_at, text }); seenIds.add(id); } };
  const hmIL = iso => { const d = new Date(iso); return String((d.getUTCHours() + 2) % 24).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
  if (out.turnout) {
    const s = out.turnout.series || [];
    const last = s.length ? s[s.length - 1] : null;
    const prevS = (prev.turnout && prev.turnout.series) || [];
    const prevLast = prevS.length ? prevS[prevS.length - 1] : null;
    const hIL = h => { h = +h; const H = Math.floor(h), M = Math.round((h - H) * 60); return String(H).padStart(2, '0') + ':' + String(M).padStart(2, '0'); };
    if (last && (!prevLast || last.hour !== prevLast.hour || wasEmpty)) {
      addEv('tr-' + String(last.hour), `דיווח הצבעה מוועדת הבחירות: ${(+last.now).toFixed(1)}% נכון ל־${hIL(last.hour)} (אומדן סוף־יום ${out.turnout.national.est.toFixed(1)}%)`);
    }
    if (out.turnout.sectorsAt && (out.turnout.sectorsAt !== (prev.turnout && prev.turnout.sectorsAt) || wasEmpty)) {
      const g = id => { const x = (out.turnout.sectors || []).find(y => y.id === id); return x ? x.est.toFixed(1) : '—'; };
      addEv('sec-' + out.turnout.sectorsAt, `פילוח מגזרי חדש (נתוני ${hmIL(out.turnout.sectorsAt)}): ערבים ${g('arab')}%, חרדים ${g('haredi')}%, יו״ש ${g('judea_samaria')}% — אומדני סוף־יום`);
    }
  }
  const pc = prev.benchmark && prev.benchmark.coalitionMajority;
  const nc = out.benchmark && out.benchmark.coalitionMajority;
  if (pc != null && nc != null && Math.abs(nc - pc) >= 2) {
    addEv('pm-' + out.updated_at.slice(0, 13), `Polymarket: שוק ״רוב קואליציוני״ ${nc}% (היה ${pc}%) — הקשר בלבד, לא קלט למודל`);
  }
  if (wasEmpty && nc != null) {
    addEv('pm-open', `מעקב שווקים: ״רוב קואליציוני״ ${nc}%, כנסת תקועה ${out.benchmark.hungParliament != null ? out.benchmark.hungParliament : '—'}% — הקשר בלבד, לא קלט למודל`);
  }
  out.timeline = tl.slice(0, 12);
  return out;
}
