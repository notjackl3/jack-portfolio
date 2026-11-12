import React, { useEffect, useMemo, useState } from 'react';
import { experiences } from '../../data/experiences';
import { lowerDuration, lowerProse, lowerTitle, plain } from '../text';
import CompanyMark from './CompanyMark';
import Projects from './Projects';

// Roles where the job was putting a room together — hackathons, keynotes,
// a mansion full of builders. The data has no "events" type (it predates
// this page and is shared with archived v4), so the split is kept here.
const EVENT_IDS = new Set([28, 18, 25, 15, 11, 9, 14, 12]);

const isEngineering = (e) => e.type === 'swe';
const isEvent = (e) => EVENT_IDS.has(e.id);

// `phrase` is how the option reads inside the sentence; `heading` is what
// the list below it is called once it is open.
const AREAS = [
  {
    id: 'engineering',
    phrase: 'engineering',
    heading: 'roles',
    roles: experiences.filter(isEngineering),
  },
  {
    id: 'events',
    phrase: 'planning events',
    heading: 'events planning',
    roles: experiences.filter(isEvent),
  },
  {
    id: 'others',
    phrase: 'everything else',
    heading: 'everything else',
    roles: experiences.filter((e) => !isEngineering(e) && !isEvent(e)),
  },
];

const AREA_IDS = AREAS.map((a) => a.id);

// #/work          → just the sentence
// #/work/events   → that option chosen, its list underneath
const readArea = () => {
  const [, sub] = window.location.hash.replace(/^#\/?/, '').toLowerCase().split('/');
  return AREA_IDS.includes(sub) ? sub : null;
};

// The choice is a sentence and the three options are words in it — no
// boxes.
const Word = ({ area, index, open, onChoose }) => (
  <button
    type="button"
    className="wx-word"
    aria-pressed={open === area.id}
    onClick={() => onChoose(area.id)}
  >
    <span className="wx-word-text">{area.phrase}</span>
    <sup className="wx-word-num">{String(index + 1).padStart(2, '0')}</sup>
  </button>
);

const Roles = ({ roles }) => (
  <div>
    {roles.map((e, i) => (
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
);

const Work = () => {
  const [open, setOpen] = useState(readArea);

  useEffect(() => {
    const onHash = () => setOpen(readArea());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Choosing the open option again closes it and gives the sentence back.
  const choose = (id) => {
    const next = open === id ? null : id;
    setOpen(next);
    const hash = next ? `#/work/${next}` : '#/work';
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  };

  const area = useMemo(() => AREAS.find((a) => a.id === open), [open]);
  const w = (i) => <Word area={AREAS[i]} index={i} open={open} onChoose={choose} />;

  return (
    <>
      <div className="wrap">
        <p className="wx-sentence rise" data-open={open ? 'true' : 'false'}>
          most of my time goes to {w(0)}, a lot of it to {w(1)}, and the rest to {w(2)}.
        </p>
      </div>

      {area ? (
        // Keyed on the option so switching plays the entrance again.
        <div key={area.id}>
          <div className="wrap">
            <section className="block work-roles rise">
              <h2>{area.heading}</h2>
              <Roles roles={area.roles} />
            </section>
          </div>
          {area.id === 'engineering' ? (
            <div className="block">
              <div className="wrap">
                <h2>projects</h2>
              </div>
              <Projects />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
};

export default Work;
