import React from 'react';

const SkillsSection = () => {
  const skillCategories = [
    {
      title: "Frontend",
      skills: ["React", "TypeScript", "JavaScript", "HTML/CSS", "Next.js", "Tailwind"]
    },
    {
      title: "Backend",
      skills: ["Node.js", "Python", "Django", "SpringBoot", "Java", "PostgreSQL", "MongoDB"]
    },
    {
      title: "Tools & Others",
      skills: ["Git", "Docker", "AWS", "Vite", "Mapbox", "Figma"]
    }
  ];

  return (
    <section id="skills" className="section tab-content">
      <div className="skills-section">
        {skillCategories.map((category, idx) => (
          <div key={idx} style={{ marginBottom: '2rem', width: '100%' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>{category.title}</h3>
            <div className="skills-grid">
              {category.skills.map((skill, sIdx) => (
                <span key={sIdx} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SkillsSection;

