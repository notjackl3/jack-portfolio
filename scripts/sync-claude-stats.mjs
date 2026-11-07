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
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
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

// ── Transcript fallback ────────────────────────────────────────────────
// Claude Code only recomputes stats-cache.json when you open the Stats tab,
// so it is usually days behind. Session transcripts are written as you go,
// so anything after the cache's last computed date is read from those.
const PROJECTS_DIR = join(HOME, '.claude', 'projects');

const localDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function walkJsonl(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walkJsonl(full, out);
    else if (e.name.endsWith('.jsonl')) out.push(full);
  }
  return out;
}

function extendWithTranscripts(cache) {
  if (!existsSync(PROJECTS_DIR)) return cache;

  const since = cache.lastComputedDate || '0000-00-00';
  const sinceMs = Date.parse(`${since}T00:00:00Z`) || 0;

  const byDate = new Map(); // date -> { messages, tokensByModel, sessions:Set }
  let scanned = 0;

  for (const file of walkJsonl(PROJECTS_DIR)) {
    // Skip files untouched since the cache was computed.
    try {
      if (statSync(file).mtimeMs < sinceMs) continue;
    } catch {
      continue;
    }

    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    for (const line of text.split('\n')) {
      if (!line) continue;
      let row;
      try {
        row = JSON.parse(line);
      } catch {
        continue;
      }
      const usage = row?.message?.usage;
      if (!usage || !row.timestamp) continue;

      const date = localDate(row.timestamp);
      if (!date || date <= since) continue;

      const tokens =
        (usage.input_tokens || 0) +
        (usage.output_tokens || 0) +
        (usage.cache_creation_input_tokens || 0) +
        (usage.cache_read_input_tokens || 0);

      let day = byDate.get(date);
      if (!day) {
        day = { messages: 0, tokensByModel: {}, sessions: new Set() };
        byDate.set(date, day);
      }
      day.messages += 1;
      const model = row.message.model || 'unknown';
      day.tokensByModel[model] = (day.tokensByModel[model] || 0) + tokens;
      if (row.sessionId) day.sessions.add(row.sessionId);
      scanned += 1;
    }
  }

  if (!byDate.size) return cache;

  const dates = [...byDate.keys()].sort();
  const dailyActivity = [...(cache.dailyActivity || [])];
  const dailyModelTokens = [...(cache.dailyModelTokens || [])];
  let addedSessions = 0;
  let addedMessages = 0;

  for (const date of dates) {
    const day = byDate.get(date);
    dailyActivity.push({ date, messageCount: day.messages, sessionCount: day.sessions.size });
    dailyModelTokens.push({ date, tokensByModel: day.tokensByModel });
    addedSessions += day.sessions.size;
    addedMessages += day.messages;
  }

  log(
    `extended with ${dates.length} day(s) from transcripts`,
    `(${dates[0]} → ${dates[dates.length - 1]}, ${scanned} messages)`
  );

  return {
    ...cache,
    dailyActivity,
    dailyModelTokens,
    totalSessions: (cache.totalSessions || 0) + addedSessions,
    totalMessages: (cache.totalMessages || 0) + addedMessages,
    lastComputedDate: dates[dates.length - 1],
  };
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

  // Headline token total = the sum of the per-day totals the heatmap shows, so
  // the number under the graph is always exactly the graph's own total. (These
  // per-day figures include cache read/creation tokens, so this runs well ahead
  // of the input+output figure on Claude Code's Stats tab.)
  const totalTokens = heatmap.reduce((s, d) => s + d.tokens, 0);

  const models = cache.modelUsage || {};
  let favoriteModel = null;
  let favoriteTokens = -1;
  for (const [id, u] of Object.entries(models)) {
    const t = (u.inputTokens || 0) + (u.outputTokens || 0);
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
    const cache = extendWithTranscripts(JSON.parse(readFileSync(STATS_CACHE, 'utf8')));
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
