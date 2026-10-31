# jack-portfolio

Jack Le's personal portfolio. React + Vite, deployed on Vercel to **www.jack-le.com**.
One repo, one Vercel project, one domain — there is no second anything. Do not create one.

## Current state (as of 2026-10-31)

The live site is **v4**. A **v5 revamp** is planned but not started.
Portfolios v1–v4 are archived and served from this same deploy at `/archive/v1/` … `/archive/v4/`.

## Invariants — do not break these

1. **`public/archive/**` is frozen.** Four previous portfolios, 23 MB, already built and
   compressed. Never regenerate, reformat or "clean up" these files. They are the only
   rendered copy of v1–v3 that exists anywhere.
2. **`vercel.json` must keep the `archive/` exclusion:**
   ```json
   { "source": "/((?!api/|archive/).*)", "destination": "/index.html" }
   ```
   Without `|archive/`, the SPA catch-all swallows every archive URL and serves
   `index.html` instead of the archived sites.
3. **Keep `api/claude-stats.js` and `api/github-commits.js`.** Archived v4 still calls both
   (`/api/claude-stats`, `/api/github-commits`). Deleting them freezes v4's stat graphs —
   it falls back to the bundled `claude-stats.json` / `github-commits.json`, so it degrades
   rather than breaks, but don't do it casually.
4. **Content lives in `src/data/*.js`** (`projects`, `hackathons`, `experiences`, `work`).
   Add entries there, not in components.

## Deploying

Push to `main` → Vercel auto-deploys to www.jack-le.com. Branches get preview URLs.
Build v5 on a branch; merging to `main` *is* the migration. No config, DNS or domain work.

**Pushing requires the `notjackl3` GitHub account**, not `notjackl3-aucctus` (the usual
active one). Scope it to the single command rather than switching the user's global account:

```bash
export GH_TOK=$(gh auth token --user notjackl3)
git -c credential.helper= \
    -c credential.helper='!f(){ echo username=notjackl3; echo password=$GH_TOK; };f' \
    push origin main
unset GH_TOK
```

The empty `credential.helper=` first is required — it clears the global `osxkeychain`
helper, which otherwise wins and re-asserts the wrong account.

## Known issues (ranked)

1. **`src/assets` is ~30 MB** of JPEGs, ~60 files at 500 KB–1 MB each. `dist/assets` is
   31 MB. WebP at q78/1600px takes this to roughly 7 MB. Highest-value cleanup; do it
   early in the revamp so every later build is faster.
2. **`.env` is tracked in git** and has been since the first commit. Contains
   `VITE_MAPBOX_ACCESS_TOKEN`. Worth untracking.
3. **The Mapbox token is a public `pk.`** token, inlined in the prod bundle by design
   (4 occurrences) — but it is **not URL-restricted**. User has been told; restricting it
   to jack-le.com in the Mapbox dashboard is on them.
4. **GitHub push protection** will block any commit containing a new build artifact with
   that token in it. It is a false positive (public token, already in `.env` and in prod).
   Resolving it requires the user to click the unblock URL — you cannot do it for them.

## Gotchas

- **Never build with `--outDir` pointing inside `public/`.** Vite copies `public/` into the
  output, so the archive would nest into itself recursively. Build to a temp dir, then move.
- **Snapshot v4 before touching `src/`** if you ever need to re-freeze it:
  `npx vite build --base=/archive/v4/ --outDir <tmp>`, then compress and move.
- **`/archive/v3/` is a patched CRA bundle.** Its original `homepage` was wrong, so it never
  rendered on GitHub Pages. The baked `/static/` paths, the `PUBLIC_URL`-derived
  `/images/` paths and the image filenames were rewritten by hand inside the minified
  bundle. Do not re-run its build; you will undo the fix.
- **Don't inline-iframe archived v4.** It loads `mapbox-gl.js` and opens a WebGL context,
  on a page that already has one. It also calls `history.replaceState` with absolute paths
  (`/projects`), which rewrites the parent URL from inside an iframe. Poster + open-in-new-tab.
- `v4-final` tag → `cf41505` marks the last v4 source commit.

## v5 plan (agreed, not started)

1. Asset pass: 30 MB → ~7 MB WebP. **Do this first.**
2. Build the new design. Content already lives in `src/data/`, so this is mostly presentation.
3. Add an Archive section/tab linking the four `/archive/vN/` URLs.
   Lazy-mount: static WebP posters by default, **max one iframe alive at a time**,
   unmount on tab change. v4 gets a poster + external link only (see gotcha above).
4. Backfill content still missing from old portfolios:
   - "Organiser" — a Unity productivity app, only in v1, absent from `projects.js`
   - From v1's experience strip: Prefect student, solo rap performance to 2,000 people,
     pencil portraits
   - Long-form stories from v2 (TRG internship, WallyHacks, UTMSAM) — currently compressed
     to one-liners in `experiences.js`; the full narratives exist only in
     `public/archive/v2/index.html`
   - Photos in `public/archive/v2/assets/highlights/`

## Idea backlog

Replace the manual screenshot → Canva → export → commit workflow with a script: clone/pull
each project, boot it locally, drive Playwright to screenshot, convert to WebP, write into
`src/assets` and update `projects.js`. Realistically ~60–70% of projects boot unattended;
API keys, seeded databases and dead toolchains are the blockers. Pairs with moving the
device frame out of baked PNGs and into CSS, which makes screenshots raw viewport grabs
(~10× smaller) and fully automatable.
