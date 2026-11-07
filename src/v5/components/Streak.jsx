import React, { useMemo } from 'react';
import { hackathons } from '../../data/hackathons';
import { hackathonPosts } from '../hackathonPosts';
import Posts from './Posts';
import { lowerLabel, plain } from '../text';

// The hackathons tab: the streak first, in the order it happened, then
// every other hackathon Jack wrote up, newest first. Both read as a list of
// names that open one at a time — the whole page expanded is about twelve
// thousand words, and nobody scrolls that.

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const parts = (iso) => {
  const [y, m, d] = iso.split('-');
  return { y, m: MONTHS[Number(m) - 1], d: String(Number(d)) };
};

// "january 10–11, 2026" within a month, "february 27 – march 1, 2026"
// across one, and just the day for the one-day events.
const when = (from, to) => {
  if (!from) return null;
  const a = parts(from);
  if (!to) return `${a.m} ${a.d}, ${a.y}`;
  const b = parts(to);
  if (a.m === b.m && a.y === b.y) return `${a.m} ${a.d}–${b.d}, ${a.y}`;
  if (a.y === b.y) return `${a.m} ${a.d} – ${b.m} ${b.d}, ${a.y}`;
  return `${a.m} ${a.d}, ${a.y} – ${b.m} ${b.d}, ${b.y}`;
};

// A win is a mark, not a sentence: which track it was is in the write-up a
// click away, and spelling it out in the row made every winning weekend
// shout over the ones that were just good. A placement gets its medal; any
// other prize — a track, a sponsor award — gets the trophy. An entry that
// won both carries both, once each.
const MEDALS = [
  [/\b(1st|first)\b/i, '\u{1F947}'],
  [/\b(2nd|second)\b/i, '\u{1F948}'],
  [/\b(3rd|third)\b/i, '\u{1F949}'],
];

const badge = (award) => {
  if (!award) return null;
  const marks = award.split('+').map((part) => {
    const medal = MEDALS.find(([re]) => re.test(part));
    return medal ? medal[1] : '\u{1F3C6}';
  });
  return [...new Set(marks)].join(' ');
};

const Streak = () => {
  const streak = useMemo(
    () =>
      hackathons.map((h) => ({
        key: `h-${h.id}`,
        id: `h-${h.id}`,
        title: h.name,
        aside: badge(h.award),
        // The wording itself, for the tooltip and for a screen reader —
        // an emoji on its own doesn't say what was won.
        asideLabel: h.award ? lowerLabel(plain(h.award)) : undefined,
        meta: when(h.date, h.dateEnd),
        // `highlight` has a stray empty slot in the source data — drop blanks.
        body: (h.highlight || []).filter(Boolean),
        images: h.images || [],
      })),
    []
  );

  const rest = useMemo(
    () =>
      hackathonPosts.map((entry) => ({
        key: entry.slug,
        id: `b-${entry.slug}`,
        title: entry.name,
        aside: badge(entry.award),
        asideLabel: entry.award ? lowerLabel(plain(entry.award)) : undefined,
        meta: when(entry.date, entry.dateEnd),
        body: entry.body,
        images: entry.images,
      })),
    []
  );

  return (
    <div className="wrap">
      <section className="hack-lede rise">
        <p>
          fifteen hackathons, twelve weekends straight. i competed in 12 and won 7,
          organized 1, judged 1, and founded 1. over 14 side projects in 3 months. the
          craziest and busiest school semester of my life.
        </p>
        <p>all fifteen are below, in order. open one for the weekend and the photos i kept.</p>
      </section>

      <section className="rise" style={{ '--d': '120ms' }}>
        <Posts entries={streak} variant="hack" />
      </section>

      {/* The hackathons either side of the streak. Same list, a line of
          prose and a gap apart, so the twelve weekends stay one block. */}
      <section className="hack-rest rise" style={{ '--d': '160ms' }}>
        <p className="hack-rest-note">
          the ones either side of the streak, before it started, and everything since.
        </p>
        <Posts entries={rest} variant="hack" />
      </section>
    </div>
  );
};

export default Streak;
