import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { projects } from '../data/projects';
import { FaGithub, FaGlobe } from 'react-icons/fa';

const ProjectCard = ({ project, onImageLoaded, registerImageEl }) => {
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
          <img
            src={project.image}
            alt={`${project.title} screenshot`}
            ref={(el) => registerImageEl?.(project.id, el)}
            onLoad={() => onImageLoaded?.(project.id)}
            onError={() => onImageLoaded?.(project.id)}
          />
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
              <FaGlobe size={18} />
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
  const filterTriggerRef = useRef(null);
  const filterMenuElRef = useRef(null);
  const [filterMenuPos, setFilterMenuPos] = useState(null);
  const [loadedImageIds, setLoadedImageIds] = useState(() => new Set());
  const imageElsRef = useRef(new Map());

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
    const filtered =
      activeFilter === 'all'
        ? projects
        : projects.filter((p) => (p.category || 'personal') === activeFilter);

    return [...filtered].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [activeFilter]);

  const projectsWithImages = useMemo(
    () => filteredProjects.filter((p) => Boolean(p.image)),
    [filteredProjects]
  );

  const areProjectImagesLoaded = useMemo(() => {
    if (projectsWithImages.length === 0) return true;
    return projectsWithImages.every((p) => loadedImageIds.has(p.id));
  }, [projectsWithImages, loadedImageIds]);

  const applyFilter = (nextFilter) => {
    // Reset synchronously during the click/change event so we don't "flash" into a hidden state
    // after render (which can happen with cached images and missing onLoad events).
    setLoadedImageIds(new Set());
    setActiveFilter(nextFilter);
  };

  const handleImageLoaded = (projectId) => {
    setLoadedImageIds((prev) => {
      if (prev.has(projectId)) return prev;
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
  };

  const registerImageEl = (projectId, el) => {
    if (!projectId) return;
    if (el) imageElsRef.current.set(projectId, el);
    else imageElsRef.current.delete(projectId);
  };

  useLayoutEffect(() => {
    // Important: when switching filters, many images are already in cache, so onLoad may not fire.
    // This ensures we still mark them as loaded and the grid becomes flip-ready.
    for (const p of projectsWithImages) {
      const el = imageElsRef.current.get(p.id);
      if (!el) continue;

      // If already fully loaded from cache, mark immediately.
      if (el.complete && el.naturalWidth > 0) {
        handleImageLoaded(p.id);
        continue;
      }

      // Try decode() when available to get a deterministic "ready" signal.
      if (typeof el.decode === 'function') {
        el.decode()
          .then(() => handleImageLoaded(p.id))
          .catch(() => handleImageLoaded(p.id));
      }
    }
  }, [projectsWithImages]);

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

  useLayoutEffect(() => {
    if (!isFilterMenuOpen) return;

    const placeMenu = () => {
      const triggerEl = filterTriggerRef.current;
      const menuEl = filterMenuElRef.current;
      if (!triggerEl || !menuEl) return;

      const isMobile = window.matchMedia('(max-width: 480px)').matches;
      if (!isMobile) {
        setFilterMenuPos(null);
        return;
      }

      const rect = triggerEl.getBoundingClientRect();
      const menuWidth = menuEl.offsetWidth || 0;
      const viewportW = window.innerWidth;
      const margin = 15;
      const gap = 10;

      const desiredLeft = rect.right + gap;
      const clampedLeft = Math.max(
        margin,
        Math.min(desiredLeft, viewportW - margin - menuWidth)
      );

      setFilterMenuPos({
        left: clampedLeft,
        top: rect.top + rect.height / 2,
      });
    };

    // Wait a frame so offsetWidth is correct after render.
    const raf = requestAnimationFrame(placeMenu);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu);
    };
  }, [isFilterMenuOpen, activeFilterLabel]);

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
            ref={filterTriggerRef}
          >
            {activeFilterLabel}
            <span className="projects-filter-caret" aria-hidden="true">▾</span>
          </button>

          {isFilterMenuOpen && (
            <div
              className="projects-filter-menu"
              role="menu"
              aria-label="Project type"
              ref={filterMenuElRef}
              style={filterMenuPos ? { left: filterMenuPos.left, top: filterMenuPos.top } : undefined}
            >
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeFilter === opt.value}
                  className={`projects-filter-option ${activeFilter === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    applyFilter(opt.value);
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
      <div className={`projects-grid ${areProjectImagesLoaded ? 'is-flip-ready' : ''}`}>
        {filteredProjects.map((project, index) => (
          <div
            key={project.id}
            className="project-card-anim-wrap"
            style={{ '--card-index': index }}
          >
            <ProjectCard
              project={project}
              onImageLoaded={handleImageLoaded}
              registerImageEl={registerImageEl}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProjectsSection;
