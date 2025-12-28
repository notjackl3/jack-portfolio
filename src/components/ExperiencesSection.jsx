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
        : experiences.filter((e) => (e.type || 'work') === activeFilter);

    return [...base].sort((a, b) => {
      // Primary: newest -> oldest (highest id -> lowest id)
      const byTime = (b.id || 0) - (a.id || 0);
      if (byTime !== 0) return byTime;

      // Tiebreaker only (rare): stable-ish grouping
      const ta = (a.type || 'work').toString();
      const tb = (b.type || 'work').toString();
      return ta.localeCompare(tb);
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
