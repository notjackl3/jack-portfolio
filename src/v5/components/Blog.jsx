import React, { useMemo, useState } from 'react';
import { blog } from '../blog';
import { lowerProse, plain } from '../text';
import Posts from './Posts';

// Jack's LinkedIn write-ups of the events he went to or ran. Hackathons are
// not here: they all live on the hackathons tab, which is the one place on
// the site that is about them. See hackathonPosts.js.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const when = (iso) => {
  const [y, m] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

// The data tags every entry with what Jack was doing there.
const FILTERS = [
  { id: 'all', label: 'all' },
  { id: 'organizing', label: 'organizing' },
  { id: 'office', label: 'offices' },
  { id: 'event', label: 'events' },
];

const matches = (entry, filter) => (filter === 'all' ? true : entry.category === filter);

const Blog = () => {
  const [filter, setFilter] = useState('all');

  const shown = useMemo(
    () =>
      blog
        .filter((entry) => matches(entry, filter))
        .map((entry) => ({
          key: entry.slug,
          id: `b-${entry.slug}`,
          title: lowerProse(plain(entry.title)),
          meta: when(entry.date),
          body: entry.body,
          images: entry.images,
        })),
    [filter]
  );

  return (
    <div className="wrap">
      <section className="blog-lede rise">
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="filter"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Re-keying restarts the stagger, so a filter change reads as a new
          list rather than a reshuffle of the old one — and it closes
          whatever was open, which would otherwise be filtered out from
          under the reader. */}
      <section className="rise" key={filter} style={{ '--d': '120ms' }}>
        <Posts entries={shown} />
      </section>
    </div>
  );
};

export default Blog;
