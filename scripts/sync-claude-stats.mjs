#!/usr/bin/env node
/**
 * Sync Claude Code usage stats to the portfolio.
 *
 * Reads ~/.claude/stats-cache.json (the data behind Claude Code's `/usage`
 * Stats tab), slims it to a render-ready shape, and either:
 *   --local   writes <repo>/public/claude-stats.json (committed fallback)
 *   (default) POSTs it to the deployed /api/claude-stats endpoint, which
 *             stores it in Vercel Blob — no git commit, no redeploy.
 *
 * Intended to be run from a Claude Code SessionEnd hook. It NEVER throws on
 * failure (always exits 0) so it can't break the hook, and it throttles
 * network pushes so frequent sessions don't hammer the endpoint.
 *
 * Config for the network push lives in ~/.claude/portfolio-stats-config.json:
 *   { "endpoint": "https://YOUR-SITE/api/claude-stats", "secret": "…",
 *     "minIntervalMinutes": 30 }
 * If that file is missing, the push is skipped silently.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOME = homedir();
const STATS_CACHE = join(HOME, '.claude', 'stats-cache.json');
const CONFIG_PATH = join(HOME, '.claude', 'portfolio-stats-config.json');
const THROTTLE_MARKER = join(HOME, '.claude', '.portfolio-stats-pushed');
const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const args = new Set(process.argv.slice(2));
const LOCAL = args.has('--local');
const FORCE = args.has('--force');

const log = (...a) => process.stderr.write(`[claude-stats] ${a.join(' ')}\n`);

function prettyModel(id) {
  const s = String(id).replace(/^claude-/, '').replace(/-\d{8}$/, '');
  const parts = s.split('-');
  const tier = parts.shift() || s;
  const name = tier.charAt(0).toUpperCase() + tier.slice(1);
  return parts.length ? `${name} ${parts.join('.')}` : name;
}

// Consecutive-calendar-day streaks over the set of active dates.
function computeStreaks(dates) {
  const set = new Set(dates);
  const sorted = [...set].sort();
  if (!sorted.length) return { current: 0, longest: 0, activeDays: 0 };
  const dayMs = 86400000;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = Date.parse(sorted[i - 1] + 'T00:00:00Z');
    const cur = Date.parse(sorted[i] + 'T00:00:00Z');
    run = cur - prev === dayMs ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  // Current streak = run ending on the most recent active day.
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const prev = Date.parse(sorted[i - 1] + 'T00:00:00Z');
    const cur = Date.parse(sorted[i] + 'T00:00:00Z');
    if (cur - prev === dayMs) current++;
    else break;
  }
  return { current, longest, activeDays: sorted.length };
}

function transform(cache) {
  const daily = Array.isArray(cache.dailyActivity) ? cache.dailyActivity : [];

  // Per-day token totals (sum across models) for the hover tooltip.
  const dailyTokens = new Map();
  for (const d of Array.isArray(cache.dailyModelTokens) ? cache.dailyModelTokens : []) {
    const total = Object.values(d.tokensByModel || {}).reduce((s, n) => s + (n || 0), 0);
    dailyTokens.set(d.date, total);
  }

  const maxCount = daily.reduce((m, d) => Math.max(m, d.messageCount || 0), 0) || 1;
  const heatmap = daily
    .map((d) => {
      const count = d.messageCount || 0;
      const ratio = count / maxCount;
      const level = count === 0 ? 0 : ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      return {
        date: d.date,
        count,
        sessions: d.sessionCount || 0,
        tokens: dailyTokens.get(d.date) || 0,
        level,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Headline token total = input + output across models (excludes cache tokens,
  // matching the figure Claude Code shows on the Stats tab).
  const models = cache.modelUsage || {};
  let totalTokens = 0;
  let favoriteModel = null;
  let favoriteTokens = -1;
  for (const [id, u] of Object.entries(models)) {
    const t = (u.inputTokens || 0) + (u.outputTokens || 0);
    totalTokens += t;
    if (t > favoriteTokens) {
      favoriteTokens = t;
      favoriteModel = id;
    }
  }

  const streaks = computeStreaks(heatmap.map((h) => h.date));
  const dates = heatmap.map((h) => h.date);

  return {
    updatedAt: new Date().toISOString(),
    sourceDate: cache.lastComputedDate || null,
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
    totalTokens,
    totalSessions: cache.totalSessions || 0,
    totalMessages: cache.totalMessages || 0,
    favoriteModel: favoriteModel ? prettyModel(favoriteModel) : null,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    activeDays: streaks.activeDays,
    heatmap,
  };
}

function main() {
  if (!existsSync(STATS_CACHE)) {
    log('no stats-cache.json found; nothing to sync');
    return;
  }

  let slim;
  try {
    const cache = JSON.parse(readFileSync(STATS_CACHE, 'utf8'));
    slim = transform(cache);
  } catch (e) {
    log('failed to read/transform stats cache:', e.message);
    return;
  }

  const payload = JSON.stringify(slim);

  if (LOCAL) {
    const out = join(REPO_ROOT, 'public', 'claude-stats.json');
    writeFileSync(out, payload + '\n');
    log(
      `wrote ${out}`,
      `(${slim.totalTokens} tokens, ${slim.totalSessions} sessions,`,
      `${slim.currentStreak}d streak, fav ${slim.favoriteModel})`
    );
    return;
  }

  // Network push path — config-gated and throttled.
  if (!existsSync(CONFIG_PATH)) {
    log('no portfolio-stats-config.json; skipping push (run with --local to write the static fallback)');
    return;
  }

  let config;
  try {
    config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    log('bad config json:', e.message);
    return;
  }
  if (!config.endpoint || !config.secret) {
    log('config missing endpoint or secret; skipping');
    return;
  }

  const minMs = (config.minIntervalMinutes ?? 30) * 60000;
  if (!FORCE && existsSync(THROTTLE_MARKER)) {
    try {
      const last = Number(readFileSync(THROTTLE_MARKER, 'utf8').trim());
      if (Number.isFinite(last) && Date.now() - last < minMs) {
        log('throttled; last push was recent');
        return;
      }
    } catch {
      /* ignore */
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  fetch(config.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-stats-secret': config.secret },
    body: payload,
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        log(`push failed: HTTP ${res.status}`);
        return;
      }
      try {
        writeFileSync(THROTTLE_MARKER, String(Date.now()));
      } catch {
        /* ignore */
      }
      log(`pushed (${slim.totalTokens} tokens, ${slim.currentStreak}d streak)`);
    })
    .catch((e) => log('push error:', e.message))
    .finally(() => clearTimeout(timer));
}

main();
