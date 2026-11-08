// Vercel serverless function backing the napkin note.
//
//   GET  /api/goals  → { body, at }
//   POST /api/goals  → { body }  replaces what the napkin says
//
// The napkin is one shared sheet of writing, and anyone can write on it —
// anonymously, which means the guard rails are the only guard rails: a cap
// on length, a rate limit per visitor, and a log. What shipped with the
// build is in src/v5/notes.js, so nothing here is ever lost:
// `npm run goals -- revert` puts the original back, and the last HISTORY
// saves are kept whole, so a particular version can be restored too.
//
// Required env vars (Vercel project settings):
//   BLOB_READ_WRITE_TOKEN — comes with the Blob store; already set, this
//                           shares the store with api/claude-stats.js
//   GOALS_ADMIN_SECRET    — lets scripts/goals.mjs revert and read the log

import { createHash } from 'node:crypto';
import { put, list } from '@vercel/blob';

const BLOB_PATH = 'v5-goals.json';

// Must match LIMITS in src/v5/notes.js.
export const LIMITS = { body: 760, line: 64, lines: 16 };

const HISTORY = 40;
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 5; // saves per visitor per window

// Control characters, the bidi overrides and the zero-width run. Newline is
// deliberately not in here — on a free-form sheet it is content.
const CONTROL =
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\u2028\u2029\uFEFF]/g;

// Lines survive; everything else that could break the sheet's layout does
// not. Runs of blank lines collapse to one, so nobody can push the signature
// off the bottom with forty returns.
export const cleanBody = (value) =>
  String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL, ' ')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim().slice(0, LIMITS.line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .slice(0, LIMITS.lines)
    .join('\n')
    .trim()
    .slice(0, LIMITS.body);

// Stored instead of the address itself: enough to rate-limit a visitor,
// not enough to identify one.
const visitorHash = (req) => {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = fwd || req.socket?.remoteAddress || 'unknown';
  const salt = process.env.GOALS_ADMIN_SECRET || 'v5-goals';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16);
};

const EMPTY = { body: null, at: null, history: [], recent: [] };

const read = async () => {
  const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
  if (!blobs.length) return { ...EMPTY };
  // Blob serves its public URLs with `s-maxage=300`, and because the path
  // never changes (addRandomSuffix: false) every write lands back on the
  // same cached URL. `cache: 'no-store'` only governs this runtime's own
  // fetch cache, not that CDN, so a read here could be served a copy up to
  // five minutes old — a save would stick in the store and then appear to
  // undo itself on the next load. A unique query string misses the cache.
  const r = await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) return { ...EMPTY };
  const j = await r.json();
  return {
    body: typeof j?.body === 'string' ? j.body : null,
    at: Number.isFinite(j?.at) ? j.at : null,
    history: Array.isArray(j?.history) ? j.history : [],
    recent: Array.isArray(j?.recent) ? j.recent : [],
  };
};

const write = (state) =>
  put(BLOB_PATH, JSON.stringify(state), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    // Default is a year. The read above busts the cache anyway, but the blob
    // URL is public and guessable, so this keeps anyone who finds it from
    // being told the napkin says something it stopped saying months ago.
    cacheControlMaxAge: 60,
  });

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const s = await read();
      // Reading the log is a read, not a write: scripts/goals.mjs asks for
      // it with the secret rather than having to POST to see it.
      const admin =
        !!process.env.GOALS_ADMIN_SECRET &&
        req.headers['x-goals-secret'] === process.env.GOALS_ADMIN_SECRET;
      if (admin) res.setHeader('Cache-Control', 'no-store');
      // Short edge cache otherwise: a save should reach everyone quickly,
      // but the napkin is not worth an origin hit per visitor.
      else res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=60');
      return res.status(200).json({
        body: s.body,
        at: s.at,
        ...(admin ? { history: s.history } : null),
      });
    } catch (e) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }

  if (req.method === 'POST') {
    const admin =
      !!process.env.GOALS_ADMIN_SECRET &&
      req.headers['x-goals-secret'] === process.env.GOALS_ADMIN_SECRET;

    let input = req.body;
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input);
      } catch {
        return res.status(400).json({ error: 'bad json' });
      }
    }

    // Only the moderator may wipe the napkin back to what shipped.
    const clearing = input?.clear === true;
    if (clearing && !admin) return res.status(401).json({ error: 'unauthorized' });

    const body = cleanBody(input?.body);
    if (!clearing && !body) return res.status(400).json({ error: 'nothing written' });

    try {
      const state = await read();
      const now = Date.now();

      if (!admin) {
        const who = visitorHash(req);
        const recent = state.recent.filter((r) => now - r.at < WINDOW_MS);
        if (recent.filter((r) => r.h === who).length >= PER_WINDOW) {
          res.setHeader('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
          return res.status(429).json({ error: 'slow down — try again later' });
        }
        recent.push({ h: who, at: now });
        state.recent = recent.slice(-200);
      }

      if (!clearing && body === state.body) {
        return res.status(200).json({ ok: true, body: state.body, at: state.at });
      }

      // The version being replaced goes into history before it is, so the
      // log always holds the sheet as it stood, not only the change.
      state.history = [
        { body: clearing ? null : body, at: now },
        ...state.history,
      ].slice(0, HISTORY);

      state.body = clearing ? null : body;
      state.at = clearing ? null : now;

      await write(state);
      return res.status(200).json({ ok: true, body: state.body, at: state.at });
    } catch (e) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
