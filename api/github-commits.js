// Returns GitHub contribution activity for the portfolio's commit heatmap.
//
//   GET /api/github-commits  → { heatmap: [{date,count,level}], total }
//
// Pulls the public contribution calendar from the jogruber proxy (no GitHub
// token needed) and caches it at the edge. The client falls back to calling
// the proxy directly, then to the committed /github-commits.json snapshot.

const USER = 'notjackl3';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    const r = await fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`, {
      headers: { accept: 'application/json' },
    });
    if (!r.ok) return res.status(502).json({ error: `upstream ${r.status}` });
    const data = await r.json();
    const heatmap = (data.contributions || []).map((c) => ({
      date: c.date,
      count: c.count,
      level: c.level,
    }));
    const total = data.total
      ? Object.values(data.total).reduce((s, n) => s + n, 0)
      : heatmap.reduce((s, c) => s + c.count, 0);

    // Commit data changes slowly — cache 1h at the edge, serve stale for a day.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ total, heatmap });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
