import React, { useEffect, useMemo, useRef, useState } from 'react';
import { projects } from '../data/projects';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

const ProjectCard = ({ project }) => {
  // Check if this is a hackathon project and parse the title
  const isHackathonProject = project.title.includes('|') || project.title.includes('~');
  let appName = project.title;
  let hackathonName = '';
  
  if (isHackathonProject) {
    const separator = project.title.includes('|') ? '|' : '~';
    const parts = project.title.split(separator);
    appName = parts[0].trim();
    hackathonName = parts[1].trim();
  }

  return (
    <div className="project-card">
      {project.image && (
        <div className="project-image">
          <img src={project.image} alt={`${project.title} screenshot`} />
        </div>
      )}

      <div className="project-content">
        {isHackathonProject ? (
          <div className="project-title-container">
            <h3 className="project-title">{appName}</h3>
            <span className="project-subtitle">{hackathonName}</span>
          </div>
        ) : (
          <h3 className="project-title">{project.title}</h3>
        )}

        <p className="project-description">{project.description}</p>
        
        {project.technologies && (
          <div className="project-tech">
            {project.technologies.map((tech, index) => (
              <span key={index} className="tech-tag">{tech}</span>
            ))}
          </div>
        )}

        <div className="project-links">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="project-link-icon" aria-label="source code">
              <FaGithub size={20} />
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link-icon" aria-label="live preview">
              <FaExternalLinkAlt size={18} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectsSection = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!isFilterMenuOpen) return;
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setIsFilterMenuOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (!isFilterMenuOpen) return;
      if (e.key === 'Escape') setIsFilterMenuOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFilterMenuOpen]);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects;
    return projects.filter((p) => (p.category || 'personal') === activeFilter);
  }, [activeFilter]);

  const filterOptions = useMemo(
    () => ([
      { value: 'all', label: 'all' },
      { value: 'personal', label: 'personal' },
      { value: 'school', label: 'school' },
      { value: 'hackathon', label: 'hackathon' },
    ]),
    []
  );

  const activeFilterLabel =
    filterOptions.find((o) => o.value === activeFilter)?.label ?? 'all';

  return (
    <section id="projects" className="section tab-content projects-section">
      <div className="projects-filter-row">
        <div className="projects-filter" ref={filterMenuRef}>
          <button
            type="button"
            className="projects-filter-trigger"
            aria-haspopup="menu"
            aria-expanded={isFilterMenuOpen}
            onClick={() => setIsFilterMenuOpen((v) => !v)}
          >
            {activeFilterLabel}
            <span className="projects-filter-caret" aria-hidden="true">▾</span>
          </button>

          {isFilterMenuOpen && (
            <div className="projects-filter-menu" role="menu" aria-label="Project type">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeFilter === opt.value}
                  className={`projects-filter-option ${activeFilter === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFilter(opt.value);
                    setIsFilterMenuOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="projects-grid">
        {filteredProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;
