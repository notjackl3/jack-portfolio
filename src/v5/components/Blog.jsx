import React, { useMemo, useState } from 'react';
import { blog } from '../blog';
import { lowerProse, plain } from '../text';
import Posts from './Posts';
import FilterSentence from './FilterSentence';

// Jack's LinkedIn write-ups of the events he went to or ran. Hackathons are
// not here: they all live on the hackathons tab, which is the one place on
// the site that is about them. See hackathonPosts.js.

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const when = (iso) => {
  const [y, m] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

// The data tags every entry with what Jack was doing there, and the
// sentence at the top of the page names each one.
const matches = (entry, filter) => (filter === 'all' ? true : entry.category === filter);

const Blog = () => {
  const [filter, setFilter] = useState(null);

  const shown = useMemo(
    () =>
      (filter ? blog.filter((entry) => matches(entry, filter)) : [])
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
        <FilterSentence value={filter} onChange={setFilter}>
          {(w) => (
            <>
              read {w('all', 'everything')}, or just the times i was {w('organizing', 'organizing')},{' '}
              visiting {w('office', 'offices')} or out at {w('event', 'events')}.
            </>
          )}
        </FilterSentence>
      </section>

      {/* Re-keying restarts the stagger, so a filter change reads as a new
          list rather than a reshuffle of the old one — and it closes
          whatever was open, which would otherwise be filtered out from
          under the reader. */}
      {/* Just the sentence until a word in it is chosen. */}
      {filter ? (
        <section className="rise" key={filter} style={{ '--d': '120ms' }}>
          <Posts entries={shown} />
        </section>
      ) : null}
    </div>
  );
};

export default Blog;
