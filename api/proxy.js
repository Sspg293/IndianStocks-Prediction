// Runs on Vercel's servers, not in the browser — so there's no CORS
// restriction to work around at all (CORS is a browser-only rule).
// The website calls this same-domain endpoint instead of a third-party
// proxy, so nothing here can be blocked by a network-level proxy filter.
export default async function handler(req, res) {
  const target = req.query.url;
  if (!target || typeof target !== 'string') {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        // Some upstream APIs (Yahoo Finance) reject requests with no
        // browser-like User-Agent.
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
      }
    });
    const text = await upstream.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    // A short cache is a deliberate tradeoff: without it, every page load
    // re-hits Yahoo for the same handful of symbols and quickly trips their
    // rate limiter (this is what caused the 429 errors). 20 seconds keeps
    // data feeling live while cutting request volume drastically.
    res.setHeader('Cache-Control', 'public, s-maxage=45, stale-while-revalidate=90');
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(502).json({ error: 'Upstream fetch failed', detail: String(err) });
  }
}
