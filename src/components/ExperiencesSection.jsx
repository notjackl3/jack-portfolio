import React, { useEffect, useMemo, useRef, useState } from 'react';
import { experiences } from '../data/experiences';

const ExperienceCard = ({ experience }) => {
  return (
    <div className={`experience-card experience-card--reveal ${experience.type || 'work'}`}>
      <div className="experience-header">
        <div className="experience-role">
          <h3 className="position">{experience.position}</h3>
          <h4 className="company">{experience.company}</h4>
        </div>
        <div className="experience-meta">
          <span className="duration">{experience.duration}</span>
        </div>
      </div>
      <p className="experience-description">{experience.description}</p>
    </div>
  );
};

const ExperiencesSection = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const timelineRef = useRef(null);
  const toggleFilter = (nextFilter) => {
    setActiveFilter((prev) => (prev === nextFilter ? 'all' : nextFilter));
  };

  const filteredExperiences = useMemo(() => {
    const base =
      activeFilter === 'all'
        ? experiences
        : activeFilter === 'work'
          ? experiences.filter((e) => e.type === 'work' || e.type === 'swe')
          : experiences.filter((e) => (e.type || 'work') === activeFilter);

    const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
      january:0, february:1, march:2, april:3, june:5, july:6, august:7, september:8, october:9, november:10, december:11 };
    const parseStart = (duration = '') => {
      const part = duration.split('-')[0].trim().toLowerCase().split(/\s+/);
      const m = months[part[0]] ?? 0;
      const y = parseInt(part[1], 10) || 0;
      return y * 12 + m;
    };
    const isPresent = (duration = '') => duration.toLowerCase().includes('present');

    return [...base].sort((a, b) => {
      const aPresent = isPresent(a.duration);
      const bPresent = isPresent(b.duration);
      if (aPresent !== bPresent) return aPresent ? -1 : 1;
      return parseStart(b.duration) - parseStart(a.duration);
    });
  }, [activeFilter]);

  useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll('.experience-card--reveal'));
    if (cards.length === 0) return;

    // If observer isn't supported, just show everything.
    if (typeof IntersectionObserver === 'undefined') {
      cards.forEach((el) => el.classList.add('is-inview'));
      return;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduceMotion) {
      cards.forEach((el) => el.classList.add('is-inview'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-inview');
          else entry.target.classList.remove('is-inview');
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    cards.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [filteredExperiences]);

  return (
    <section id="experiences" className="section tab-content">
      <div className="experiences-type-legend" aria-label="Experience type filter">
        <button
          type="button"
          className={`experiences-type-pill all ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          all
        </button>
        <button
          type="button"
          className={`experiences-type-pill work ${activeFilter === 'work' ? 'active' : ''}`}
          onClick={() => toggleFilter('work')}
        >
          work
        </button>
        <button
          type="button"
          className={`experiences-type-pill swe ${activeFilter === 'swe' ? 'active' : ''}`}
          onClick={() => toggleFilter('swe')}
        >
          swe
        </button>
        <button
          type="button"
          className={`experiences-type-pill volunteer ${activeFilter === 'volunteer' ? 'active' : ''}`}
          onClick={() => toggleFilter('volunteer')}
        >
          volunteer
        </button>
      </div>
      <div ref={timelineRef} className="experiences-timeline">
        {filteredExperiences.map(experience => (
          <ExperienceCard key={experience.id} experience={experience} />
        ))}
      </div>
    </section>
  );
};

export default ExperiencesSection;
