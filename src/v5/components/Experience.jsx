import React, { useMemo, useState } from 'react';
import { experiences } from '../../data/experiences';
import { lowerDuration, lowerProse, lowerTitle, plain } from '../text';
import CompanyMark from './CompanyMark';

// The data tags every role as engineering, work or volunteer.
const FILTERS = [
  { id: 'all', label: 'all' },
  { id: 'swe', label: 'engineering' },
  { id: 'work', label: 'work' },
  { id: 'volunteer', label: 'volunteer' },
];

const matches = (e, filter) => (filter === 'all' ? true : e.type === filter);

const Experience = () => {
  const [filter, setFilter] = useState('all');

  const shown = useMemo(() => experiences.filter((e) => matches(e, filter)), [filter]);

  return (
    <div className="wrap">
      <section className="rise">
        <div className="filters" style={{ marginTop: 14 }}>
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

        {/* Re-keying restarts the stagger, so a filter change reads as a new
            list rather than a silent swap. */}
        <div key={filter}>
          {shown.map((e, i) => (
            <div
              className="row rise"
              id={`e-${e.id}`}
              key={e.id}
              style={{ '--d': `${Math.min(i, 14) * 20}ms` }}
            >
              <CompanyMark company={e.company} />
              <div className="row-main">
                <div className="row-title">{lowerTitle(e.position)}</div>
                <div className="row-sub">{e.company}</div>
                <div className="exp-note">{lowerProse(plain(e.description))}</div>
              </div>
              <div className="row-date">{lowerDuration(e.duration)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Experience;
