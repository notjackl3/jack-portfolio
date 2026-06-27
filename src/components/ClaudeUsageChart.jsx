import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

// Two GitHub-style activity heatmaps side by side: Claude Code usage (left) and
// GitHub commits (right). AI data is synced from ~/.claude/stats-cache.json via
// scripts/sync-claude-stats.mjs; GitHub data comes from /api/github-commits.
// Each side falls back to a committed static snapshot, so the panel always
// renders something (and renders nothing only if both sources fail).

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']; // rows Sun..Sat
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GITHUB_USER = 'notjackl3';

function formatTokens(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'b';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

// Arrange a flat list of day-cells into GitHub-style week columns (each column
// is one Sun→Sat week). Out-of-range padding cells are null.
function buildWeeks(heatmap) {
  if (!heatmap || !heatmap.length) return [];
  const byDate = new Map(heatmap.map((c) => [c.date, c]));
  const parse = (d) => new Date(d + 'T00:00:00Z');
  const first = parse(heatmap[0].date);
  const last = parse(heatmap[heatmap.length - 1].date);

  const cur = new Date(first);
  cur.setUTCDate(cur.getUTCDate() - cur.getUTCDay()); // back up to Sunday

  const weeks = [];
  while (cur <= last) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const iso = cur.toISOString().slice(0, 10);
      const inRange = cur >= first && cur <= last;
      week.push(inRange ? byDate.get(iso) || { date: iso, count: 0, tokens: 0, level: 0 } : null);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// A single heatmap. With `scroll`, it shows ALL weeks and scrolls horizontally
// (defaulting to the most recent). Otherwise it trims/pads to fill the width.
// `showDays` toggles the Mon/Wed/Fri labels. Glass tooltip on hover.
function Heatmap({ heatmap, formatTip, variant, scroll = false, showDays = false }) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const [fitCols, setFitCols] = useState(0);
  const [tip, setTip] = useState(null);

  const weeks = useMemo(() => buildWeeks(heatmap), [heatmap]);

  // Non-scroll mode: measure how many columns fit so we can pad/trim to fill.
  useEffect(() => {
    if (scroll) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;
    const compute = () => {
      const cell = el.querySelector('.claude-usage-cell');
      if (!cell) return;
      const cellW = cell.getBoundingClientRect().width;
      if (!cellW) return;
      const GAP = 2;
      setFitCols(Math.max(1, Math.floor((el.clientWidth + GAP) / (cellW + GAP))));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeks.length, scroll]);

  // Scroll mode: start scrolled to the most recent (right) week.
  useLayoutEffect(() => {
    if (!scroll) return;
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [scroll, weeks.length]);

  const visibleWeeks =
    !scroll && fitCols > 0 && weeks.length > fitCols ? weeks.slice(weeks.length - fitCols) : weeks;
  const padCount = !scroll && fitCols > 0 ? Math.max(0, fitCols - visibleWeeks.length) : 0;

  const monthLabels = useMemo(() => {
    let prev = null;
    return visibleWeeks.map((week) => {
      const cell = week.find(Boolean);
      if (!cell) return '';
      const m = new Date(cell.date + 'T00:00:00Z').getUTCMonth();
      const label = m !== prev ? MONTHS[m] : '';
      prev = m;
      return label;
    });
  }, [visibleWeeks]);

  const showTip = (e, cell) => {
    const root = rootRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    setTip({
      text: formatTip(cell),
      left: cellRect.left - rootRect.left + cellRect.width / 2,
      top: cellRect.top - rootRect.top,
    });
  };
  const hideTip = () => setTip(null);

  return (
    <div className={`claude-usage-panel${variant ? ` claude-usage-panel--${variant}` : ''}`} ref={rootRef}>
      <div className="claude-usage-graph">
        {showDays ? (
          <div className="claude-usage-days" aria-hidden="true">
            <span className="claude-usage-monthspacer" />
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="claude-usage-daylabel">
                {label}
              </span>
            ))}
          </div>
        ) : null}
        <div className={`claude-usage-scroll${scroll ? ' is-scroll' : ''}`} ref={scrollRef}>
          <div className="claude-usage-track">
            <div className="claude-usage-months" aria-hidden="true">
              {monthLabels.map((label, i) => (
                <span key={i} className="claude-usage-month">
                  {label}
                </span>
              ))}
            </div>
            <div className="claude-usage-weeks">
              {visibleWeeks.map((week, wi) => (
                <div className="claude-usage-week" key={wi}>
                  {week.map((cell, di) => (
                    <span
                      key={di}
                      className={`claude-usage-cell ${cell ? `lvl-${cell.level}` : 'empty'}`}
                      onMouseEnter={cell ? (e) => showTip(e, cell) : undefined}
                      onMouseLeave={cell ? hideTip : undefined}
                    />
                  ))}
                </div>
              ))}
              {Array.from({ length: padCount }).map((_, wi) => (
                <div className="claude-usage-week" key={`pad-${wi}`}>
                  {Array.from({ length: 7 }).map((_, di) => (
                    <span key={di} className="claude-usage-cell lvl-0" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {tip ? (
        <div className="claude-usage-tip" style={{ left: tip.left, top: tip.top }}>
          {tip.text}
        </div>
      ) : null}
    </div>
  );
}

// Fetch from a prioritized list of URLs, returning the first that normalizes.
async function loadFirst(urls, normalize) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const norm = normalize(await res.json());
        if (norm) return norm;
      }
    } catch {
      /* try next source */
    }
  }
  return null;
}

const ClaudeUsageChart = () => {
  const [ai, setAi] = useState(null);
  const [gh, setGh] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const aiData = await loadFirst(['/api/claude-stats', '/claude-stats.json'], (j) =>
        j && Array.isArray(j.heatmap) ? j : null
      );
      if (!cancelled && aiData) setAi(aiData);

      const ghData = await loadFirst(
        [
          '/api/github-commits',
          `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`,
          '/github-commits.json',
        ],
        (j) => {
          if (j && Array.isArray(j.heatmap)) return j;
          // Raw jogruber shape: { total: {...}, contributions: [{date,count,level}] }
          if (j && Array.isArray(j.contributions)) {
            const heatmap = j.contributions.map((c) => ({ date: c.date, count: c.count, level: c.level }));
            const total = j.total
              ? Object.values(j.total).reduce((s, n) => s + n, 0)
              : heatmap.reduce((s, c) => s + c.count, 0);
            return { heatmap, total };
          }
          return null;
        }
      );
      if (!cancelled && ghData) setGh(ghData);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ai && !gh) return null;

  return (
    <div className="claude-usage">
      <div className="claude-usage-card">
        <div className="claude-usage-split">
          <div className="claude-usage-side">
            {ai ? (
              <Heatmap
                heatmap={ai.heatmap}
                showDays
                formatTip={(c) => `${c.date} · ${formatTokens(c.tokens)} tokens`}
              />
            ) : null}
            <div className="claude-usage-stats">
              <span>
                <strong>{ai ? formatTokens(ai.totalTokens) : '—'}</strong> tokens
              </span>
              <span className="claude-usage-dot">·</span>
              <span>
                <strong>{ai ? ai.totalSessions : '—'}</strong> sessions
              </span>
            </div>
          </div>

          <div className="claude-usage-divider" aria-hidden="true" />

          <div className="claude-usage-side">
            {gh ? (
              <Heatmap
                heatmap={gh.heatmap}
                variant="gh"
                scroll
                showDays
                formatTip={(c) => `${c.date} · ${c.count} commits`}
              />
            ) : null}
            <div className="claude-usage-stats">
              <span>
                <strong>{gh ? gh.total : '—'}</strong> contributions
              </span>
              <span className="claude-usage-dot">·</span>
              <a
                className="claude-usage-tag claude-usage-link"
                href={`https://github.com/${GITHUB_USER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{GITHUB_USER}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaudeUsageChart;
