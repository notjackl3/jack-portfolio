# Claude Code usage chart

Shows a GitHub-style heatmap of my Claude Code activity in the hero section
(between the resume and the map). Data comes from `~/.claude/stats-cache.json`
— the same data behind Claude Code's `/usage` Stats tab.

## How it flows

```
local machine                          Vercel
─────────────                          ──────
~/.claude/stats-cache.json
        │  (SessionEnd hook)
        ▼
scripts/sync-claude-stats.mjs ──POST──▶ /api/claude-stats ──▶ Vercel Blob
                                                                   │
   browser ◀────────────── GET /api/claude-stats ◀────────────────┘
```

Data lives in **Vercel Blob**, not git — so updates never create a commit or
trigger a redeploy. The chart fetches `/api/claude-stats` first and falls back
to the committed `public/claude-stats.json` snapshot if the endpoint isn't live
yet (or in local dev).

## One-time setup

1. **Deploy** the repo (the `api/claude-stats.js` function and the new
   `@vercel/blob` dependency ship with it).

2. **Create a Blob store**: Vercel dashboard → your project → **Storage** →
   **Create** → **Blob**. This auto-adds `BLOB_READ_WRITE_TOKEN` to the project.

3. **Add a secret**: Vercel project → **Settings → Environment Variables** →
   add `CLAUDE_STATS_SECRET` = any long random string (Production + Preview).
   Redeploy so the function picks it up.

4. **Local config** — create `~/.claude/portfolio-stats-config.json`:

   ```json
   {
     "endpoint": "https://YOUR-DOMAIN/api/claude-stats",
     "secret": "SAME-VALUE-AS-CLAUDE_STATS_SECRET",
     "minIntervalMinutes": 30
   }
   ```

5. **Register the hook** — add this to the `SessionEnd` hook list in
   `~/.claude/settings.json` (alongside any existing commands):

   ```json
   {
     "type": "command",
     "command": "node \"/Users/notjackl3/Programming/jack-portfolio/scripts/sync-claude-stats.mjs\"",
     "timeout": 10
   }
   ```

6. **Test the push**:

   ```bash
   node scripts/sync-claude-stats.mjs --force      # POST now, ignoring throttle
   curl https://YOUR-DOMAIN/api/claude-stats        # should return the JSON
   ```

## Updating the committed fallback

```bash
npm run sync-stats        # regenerates public/claude-stats.json from local cache
```

Commit that occasionally if you want the static fallback to stay roughly current.
The live chart doesn't depend on it once Blob is wired up.

## Notes

- The hook is **throttled** (`minIntervalMinutes`, default 30) so frequent
  sessions don't spam the endpoint. Throttle state: `~/.claude/.portfolio-stats-pushed`.
- The script **never throws** — if config is missing or the network fails it
  exits 0 so it can't break Claude Code.
- After the subscription ends, the local cache files persist, so the last
  pushed snapshot keeps showing; the chart keeps working with no live updates.
