import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Claude Code token usage + GitHub commits, as two flat heatmaps.
// Sources are tried in order and fall back to the committed snapshots in
// public/, so the panel renders something even with the APIs down.
const GITHUB_USER = 'notjackl3';

const formatTokens = (n) => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')}b`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
};

// Flat day list → Sun→Sat week columns, with nulls padding the edges.
const buildWeeks = (heatmap) => {
  if (!heatmap?.length) return [];
  const byDate = new Map(heatmap.map((c) => [c.date, c]));
  const parse = (d) => new Date(`${d}T00:00:00Z`);
  const first = parse(heatmap[0].date);
  const last = parse(heatmap[heatmap.length - 1].date);

  const cur = new Date(first);
  cur.setUTCDate(cur.getUTCDate() - cur.getUTCDay());

  const weeks = [];
  while (cur <= last) {
    const week = [];
    for (let d = 0; d < 7; d += 1) {
      const iso = cur.toISOString().slice(0, 10);
      const inRange = cur >= first && cur <= last;
      week.push(inRange ? byDate.get(iso) || { date: iso, count: 0, tokens: 0, level: 0 } : null);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const padTo = (heatmap, from, to) => {
  if (!heatmap?.length) return heatmap;
  const byDate = new Map(heatmap.map((c) => [c.date, c]));
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    out.push(byDate.get(d) || { date: d, count: 0, tokens: 0, level: 0 });
  }
  return out;
};

const loadFirst = async (urls, normalize) => {
  for (const url of urls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      // eslint-disable-next-line no-await-in-loop
      const norm = normalize(await res.json());
      if (norm) return norm;
    } catch {
      /* try the next source */
    }
  }
  return null;
};

// The grid, rendered twice: a grey layer you interact with, and a coloured
// layer on top that is only visible through a circle around the pointer.
//
// Memoised, and given a callback that never changes identity: a year of
// days is ~370 cells, drawn twice, and nothing about them depends on what
// the pointer is doing. Only the caption and the mask change on a hover,
// and both are written straight to their own element.
const Weeks = React.memo(({ weeks, onCell, layer }) => (
  <div className={`heat-layer heat-layer--${layer}`}>
    {weeks.map((week, wi) => (
      // eslint-disable-next-line react/no-array-index-key
      <div className="heat-week" key={wi}>
        {week.map((cell, di) =>
          cell ? (
            <span
              key={cell.date}
              className="heat-cell"
              data-lvl={cell.level || 0}
              onMouseEnter={onCell ? () => onCell(cell) : undefined}
            />
          ) : (
            // eslint-disable-next-line react/no-array-index-key
            <span key={`pad-${di}`} className="heat-cell heat-cell--pad" />
          )
        )}
      </div>
    ))}
  </div>
));

Weeks.displayName = 'Weeks';

const Heatmap = ({ title, kind, heatmap, describe, foot }) => {
  const stackRef = useRef(null);
  const capRef = useRef(null);
  const weeks = useMemo(() => buildWeeks(heatmap), [heatmap]);

  // Written to the element rather than held in state. The caption is the
  // only thing a hovered cell changes, and putting it through React
  // re-rendered both grids for every cell the pointer crossed.
  const say = useRef(null);
  say.current = (cell) => {
    const el = capRef.current;
    if (!el) return;
    el.textContent = cell ? describe(cell) : foot;
    el.dataset.hot = cell ? 'true' : 'false';
  };
  const onCell = useCallback((cell) => say.current(cell), []);

  // Follow the pointer with a CSS variable; the colour layer is masked to a
  // circle at that point, so only what you're near comes up in colour.
  // Moving the mask repaints that whole layer, so it happens once a frame
  // however many moves the mouse reports in between.
  const at = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  const onMove = (e) => {
    at.current.x = e.clientX;
    at.current.y = e.clientY;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const el = stackRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${at.current.x - box.left}px`);
      el.style.setProperty('--my', `${at.current.y - box.top}px`);
      el.dataset.lit = 'true';
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    say.current(null);
    if (stackRef.current) stackRef.current.dataset.lit = 'false';
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div className="heat" data-kind={kind}>
      <div className="heat-head">
        <span>{title}</span>
        <span className="heat-caption" ref={capRef} data-hot="false">
          {foot}
        </span>
      </div>

      <div
        className="heat-stack"
        ref={stackRef}
        data-lit="false"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <Weeks weeks={weeks} layer="grey" onCell={onCell} />
        <Weeks weeks={weeks} layer="colour" />
      </div>
    </div>
  );
};

const Activity = () => {
  // One piece of state, not two: see the fetch below.
  const [data, setData] = useState(null);
  const { ai, gh } = data || {};

  // Total the cells actually rendered so the headline can't drift from the grid.
  const aiTokens = useMemo(
    () => (ai ? ai.heatmap.reduce((s, c) => s + (c.tokens || 0), 0) : 0),
    [ai]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Both at once, and committed in a single setState. Fetching them in
      // sequence meant Claude's map was drawn on its own first — and since
      // the weeks share the column width, a map covering a shorter span is
      // drawn with much bigger cells. It then visibly shrank when GitHub's
      // range arrived and widened the shared span.
      const aiReq = loadFirst(['/api/claude-stats', '/claude-stats.json'], (j) =>
        j && Array.isArray(j.heatmap) ? j : null
      );

      const ghReq = loadFirst(
        [
          '/api/github-commits',
          `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`,
          '/github-commits.json',
        ],
        (j) => {
          if (j && Array.isArray(j.heatmap)) return j;
          if (j && Array.isArray(j.contributions)) {
            const heatmap = j.contributions.map((c) => ({
              date: c.date,
              count: c.count,
              level: c.level,
            }));
            const total = j.total
              ? Object.values(j.total).reduce((s, n) => s + n, 0)
              : heatmap.reduce((s, c) => s + c.count, 0);
            return { heatmap, total };
          }
          return null;
        }
      );

      const [aiData, ghData] = await Promise.all([aiReq, ghReq]);
      if (!cancelled && (aiData || ghData)) setData({ ai: aiData, gh: ghData });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Line the two maps up on one date range.
  const span = useMemo(() => {
    const maps = [ai?.heatmap, gh?.heatmap].filter(Boolean);
    if (!maps.length) return null;
    const from = maps.map((m) => m[0].date).sort()[0];
    const to = maps.map((m) => m[m.length - 1].date).sort().slice(-1)[0];
    return { from, to };
  }, [ai, gh]);

  // Padded once per data change, not once per render: the grids are
  // memoised on this array, so handing them a fresh copy would undo it.
  const aiMap = useMemo(
    () => (ai ? (span ? padTo(ai.heatmap, span.from, span.to) : ai.heatmap) : null),
    [ai, span]
  );
  const ghMap = useMemo(
    () => (gh ? (span ? padTo(gh.heatmap, span.from, span.to) : gh.heatmap) : null),
    [gh, span]
  );

  if (!ai && !gh) return null;

  return (
    <>
      <h2>activity</h2>
      <div>
        {ai ? (
          <Heatmap
            title="Claude Code"
            kind="ai"
            heatmap={aiMap}
            describe={(c) => `${c.date} · ${formatTokens(c.tokens || 0)} tokens`}
            foot={`${formatTokens(aiTokens)} tokens · ${ai.totalSessions} sessions`}
          />
        ) : null}

        {gh ? (
          <Heatmap
            title="GitHub"
            kind="gh"
            heatmap={ghMap}
            describe={(c) => `${c.date} · ${c.count} commits`}
            foot={`${gh.total} contributions`}
          />
        ) : null}
      </div>
    </>
  );
};

export default Activity;
