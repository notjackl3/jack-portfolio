// Vercel serverless function backing the Claude Code usage chart.
//
//   GET  /api/claude-stats   → returns the latest stats JSON from Vercel Blob
//   POST /api/claude-stats   → stores new stats in Blob (guarded by a secret)
//
// The POST path is called by scripts/sync-claude-stats.mjs from a local
// Claude Code hook. Because the data lives in Blob (not git), updates never
// create a commit or trigger a redeploy.
//
// Required env vars (set in Vercel project settings):
//   BLOB_READ_WRITE_TOKEN  — auto-added when you create a Blob store
//   CLAUDE_STATS_SECRET    — shared secret; must match the local config

import { put, list } from '@vercel/blob';

const BLOB_PATH = 'claude-stats.json';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
      if (!blobs.length) {
        return res.status(404).json({ error: 'no stats yet' });
      }
      const r = await fetch(blobs[0].url, { cache: 'no-store' });
      if (!r.ok) return res.status(502).json({ error: 'blob fetch failed' });
      const json = await r.json();
      // Cache at the edge for 5 min; serve stale while revalidating.
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json(json);
    } catch (e) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }

  if (req.method === 'POST') {
    const expected = process.env.CLAUDE_STATS_SECRET;
    if (!expected || req.headers['x-stats-secret'] !== expected) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    try {
      const body =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      const blob = await put(BLOB_PATH, body, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return res.status(200).json({ ok: true, url: blob.url });
    } catch (e) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
