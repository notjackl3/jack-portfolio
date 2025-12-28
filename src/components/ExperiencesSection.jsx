import React from 'react';
import { experiences } from '../data/experiences';

const ExperienceCard = ({ experience }) => {
  return (
    <div className="experience-card">
      <div className="experience-header">
        <div className="experience-role">
          <h3 className="position">{experience.position}</h3>
          <h4 className="company">{experience.company}</h4>
        </div>
        <div className="experience-meta">
          <span className="duration">{experience.duration}</span>
          <span className="location">{experience.location}</span>
        </div>
      </div>
      <p className="experience-description">{experience.description}</p>
      <div className="experience-achievements">
        <h5>Achievements:</h5>
        <ul>
          {experience.achievements.map((achievement, index) => (
            <li key={index}>{achievement}</li>
          ))}
        </ul>
      </div>
      <div className="experience-tech">
        {experience.technologies.map((tech, index) => (
          <span key={index} className="tech-tag">{tech}</span>
        ))}
      </div>
    </div>
  );
};

const ExperiencesSection = () => {
  return (
    <section id="experiences" className="section tab-content">
      <div className="experiences-timeline">
        {experiences.map(experience => (
          <ExperienceCard key={experience.id} experience={experience} />
        ))}
      </div>
    </section>
  );
};

export default ExperiencesSection;
