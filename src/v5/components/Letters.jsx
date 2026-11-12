import React, { useEffect, useMemo, useRef, useState } from 'react';
import { blog } from '../blog';
import { lowerProse, plain } from '../text';
import { when } from './Blog';
import { ContactBody } from './Contact';
import Posts from './Posts';

// The `others` tab: how to reach me up top, and the blogs under it.
//
// `toContact` is for the old #/contact link. Contact is the top of the page
// now, so it only matters if the page was already scrolled.

const FILTERS = [
  { id: 'all', label: 'all' },
  { id: 'organizing', label: 'organizing' },
  { id: 'office', label: 'offices' },
  { id: 'event', label: 'events' },
];

const inFilter = (entry, f) => f === 'all' || entry.category === f;

// How many posts each filter holds, worked out once — the data is static.
const COUNTS = Object.fromEntries(
  FILTERS.map((f) => [f.id, blog.filter((entry) => inFilter(entry, f.id)).length])
);

const Letters = ({ toContact = false }) => {
  const [filter, setFilter] = useState('all');
  const contactRef = useRef(null);

  useEffect(() => {
    if (toContact) contactRef.current?.scrollIntoView({ block: 'start' });
  }, [toContact]);

  const posts = useMemo(
    () =>
      blog
        .filter((entry) => inFilter(entry, filter))
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
      <div ref={contactRef}>
        <ContactBody className="contact rise" />
      </div>

      <section className="block blogs rise" style={{ '--d': '120ms' }}>
        <h2>blogs</h2>
        <div className="filters counted">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="filter"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <sup className="filter-count">{COUNTS[f.id]}</sup>
            </button>
          ))}
        </div>

        {/* Re-keying restarts the stagger and closes whatever was open. */}
        <div className="rise" key={filter}>
          <Posts entries={posts} />
        </div>
      </section>
    </div>
  );
};

export default Letters;
