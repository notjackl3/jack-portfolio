import React, { useEffect, useMemo, useRef, useState } from 'react';
import { workProjects } from '../data/work';
import initialData from '../data/workNodes.json';
import laptopImg from '../assets/laptop.png';

// Calibrated screen rectangle inside laptop.png (as % of the laptop container).
const SCREEN = {
  leftPct: 19.6,
  topPct: 12.0,
  widthPct: 60.8,
  heightPct: 73.3,
};

const TRANSITION_STORAGE_KEY = 'work-transition-mode-v1';
const TRANSITION_OPTIONS = [
  { id: 'slide', label: 'slide' },
  { id: 'flip', label: 'flip' },
  { id: 'crt', label: 'crt' },
  { id: 'fade', label: 'fade' },
];
const DEFAULT_TRANSITION = 'slide';

const loadTransition = () => {
  if (typeof window === 'undefined') return DEFAULT_TRANSITION;
  try {
    const v = localStorage.getItem(TRANSITION_STORAGE_KEY);
    return TRANSITION_OPTIONS.some((o) => o.id === v) ? v : DEFAULT_TRANSITION;
  } catch {
    return DEFAULT_TRANSITION;
  }
};

const isAdminHost = () => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
};

const newNode = () => ({
  id: `n_${Math.random().toString(36).slice(2, 9)}`,
  x: 50,
  y: 50,
  cx: 115,
  cy: 30,
  text: 'New note',
});

// Normalize the persisted state so each project has the shape we expect.
const normalizeProjectState = (raw) => ({
  screens: Array.isArray(raw?.screens) ? raw.screens : [],
  nodes: typeof raw?.nodes === 'object' && raw.nodes !== null ? raw.nodes : {},
});

const Laptop = ({ image, alt, transition, direction }) => {
  const [current, setCurrent] = useState(image);
  const [prev, setPrev] = useState(null);
  const [tk, setTk] = useState(0);

  useEffect(() => {
    if (image === current) return;
    setPrev(current);
    setCurrent(image);
    setTk((k) => k + 1);
    // Long enough to outlast the slowest animation (CRT ~ 800ms).
    const t = setTimeout(() => setPrev(null), 900);
    return () => clearTimeout(t);
  }, [image, current]);

  return (
    <>
      <div
        className={`work-laptop-screen transition-${transition} direction-${direction}`}
        style={{
          left: `${SCREEN.leftPct}%`,
          top: `${SCREEN.topPct}%`,
          width: `${SCREEN.widthPct}%`,
          height: `${SCREEN.heightPct}%`,
        }}
      >
        {prev ? (
          <img
            key={`prev-${tk}`}
            src={prev}
            alt=""
            aria-hidden="true"
            className="work-screen-img is-leaving"
            draggable={false}
          />
        ) : null}
        {current ? (
          <img
            key={`curr-${tk}`}
            src={current}
            alt={alt}
            className="work-screen-img is-entering"
            draggable={false}
          />
        ) : null}
      </div>
      <img src={laptopImg} alt="Laptop frame" className="work-laptop-img" draggable={false} />
    </>
  );
};

const screenPctToContainerPct = (xPct, yPct) => ({
  x: SCREEN.leftPct + (xPct / 100) * SCREEN.widthPct,
  y: SCREEN.topPct + (yPct / 100) * SCREEN.heightPct,
});

const ProjectStage = ({ image, alt, nodes, isAdmin, onChange, transition, direction }) => {
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  const beginDrag = (e, mode, nodeId) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = stageRef.current.getBoundingClientRect();
    const node = nodes.find((n) => n.id === nodeId);
    dragRef.current = {
      mode,
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      rect,
      start: { ...node },
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPctContainer = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dyPctContainer = ((e.clientY - d.startY) / d.rect.height) * 100;

    const next = nodes.map((n) => {
      if (n.id !== d.nodeId) return n;
      if (d.mode === 'node') {
        const dxScreen = (dxPctContainer / SCREEN.widthPct) * 100;
        const dyScreen = (dyPctContainer / SCREEN.heightPct) * 100;
        return {
          ...n,
          x: Math.max(0, Math.min(100, d.start.x + dxScreen)),
          y: Math.max(0, Math.min(100, d.start.y + dyScreen)),
        };
      }
      if (d.mode === 'card') {
        return {
          ...n,
          cx: d.start.cx + dxPctContainer,
          cy: d.start.cy + dyPctContainer,
        };
      }
      return n;
    });
    onChange(next);
  };

  const endDrag = (e) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const deleteNode = (id) => onChange(nodes.filter((n) => n.id !== id));
  const setText = (id, text) =>
    onChange(nodes.map((n) => (n.id === id ? { ...n, text } : n)));

  return (
    <div className="work-laptop" ref={stageRef}>
      <Laptop image={image} alt={alt} transition={transition} direction={direction} />

      <svg className="work-nodes-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((n) => {
          const nodePos = screenPctToContainerPct(n.x, n.y);
          return (
            <line
              key={n.id}
              x1={nodePos.x}
              y1={nodePos.y}
              x2={n.cx}
              y2={n.cy}
              stroke="var(--primary-accent)"
              strokeWidth="0.15"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {nodes.map((n) => {
        const pos = screenPctToContainerPct(n.x, n.y);
        return (
          <button
            key={`dot-${n.id}`}
            type="button"
            className={`work-node-dot ${isAdmin ? 'is-admin' : ''}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onPointerDown={(e) => beginDrag(e, 'node', n.id)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            aria-label="Drag node"
          />
        );
      })}

      {nodes.map((n) => (
        <div
          key={`card-${n.id}`}
          className={`work-node-card ${isAdmin ? 'is-admin' : ''}`}
          style={{ left: `${n.cx}%`, top: `${n.cy}%` }}
        >
          <div
            className="work-node-card-handle"
            onPointerDown={(e) => beginDrag(e, 'card', n.id)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            aria-label="Drag card"
          >
            ⋮⋮
          </div>
          {isAdmin ? (
            <textarea
              className="work-node-card-text"
              value={n.text}
              onChange={(e) => setText(n.id, e.target.value)}
              rows={3}
              placeholder="Write a note…"
            />
          ) : (
            <p className="work-node-card-text">{n.text}</p>
          )}
          {isAdmin && (
            <button
              type="button"
              className="work-node-card-delete"
              onClick={() => deleteNode(n.id)}
              aria-label="Delete node"
            >
              ×
            </button>
          )}
        </div>
      ))}

    </div>
  );
};

const ScreenTabs = ({
  screens,
  activeId,
  onSelect,
  isAdmin,
  onAdd,
  onRename,
  onDelete,
  onAddNode,
}) => {
  const fileInputRef = useRef(null);
  return (
    <div className="work-screen-tabs" role="tablist" aria-label="Project screens">
      {screens.map((s) => (
        <div key={s.id} className={`work-screen-tab ${s.id === activeId ? 'active' : ''}`}>
          <button
            type="button"
            role="tab"
            aria-selected={s.id === activeId}
            className="work-screen-tab-btn"
            onClick={() => onSelect(s.id)}
          >
            {s.label || 'Screen'}
          </button>
          {isAdmin && s.id !== 'main' && s.id === activeId && (
            <>
              <button
                type="button"
                className="work-screen-tab-action"
                onClick={() => {
                  const next = window.prompt('Screen label', s.label || '');
                  if (next != null) onRename(s.id, next.trim() || 'Screen');
                }}
                title="Rename screen"
                aria-label="Rename screen"
              >
                ✎
              </button>
              <button
                type="button"
                className="work-screen-tab-action"
                onClick={() => {
                  if (window.confirm(`Delete screen "${s.label}"? Its notes will be lost.`)) {
                    onDelete(s.id);
                  }
                }}
                title="Delete screen"
                aria-label="Delete screen"
              >
                ×
              </button>
            </>
          )}
        </div>
      ))}
      {isAdmin && (
        <>
          <button
            type="button"
            className="work-screen-tab-add"
            onClick={() => fileInputRef.current?.click()}
          >
            + screen
          </button>
          <button
            type="button"
            className="work-screen-tab-add"
            onClick={onAddNode}
          >
            + node
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onAdd(file);
            }}
          />
        </>
      )}
    </div>
  );
};

const WorkSection = () => {
  const count = workProjects.length;
  // Active project comes from one of two sources:
  //   scrollActive  — derived from window scroll within the stage
  //   manualActive  — set by clicking the prev/next/dot switcher (no scroll)
  // Display uses manualActive when set; it auto-clears the moment scroll
  // crosses into a new project's range, so the two modes never fight.
  const [scrollActive, setScrollActive] = useState(0);
  const [manualActive, setManualActive] = useState(null);
  const active = manualActive ?? scrollActive;
  const [data, setData] = useState(() => initialData || {});
  // Which screen is active per project (by screen id).
  const [activeScreenByProject, setActiveScreenByProject] = useState({});
  const stageScrollRef = useRef(null);
  const saveTimerRef = useRef(null);
  const isAdmin = useMemo(isAdminHost, []);
  const [transition, setTransition] = useState(loadTransition);
  // Track project-change direction so the slide animation knows which way to swipe.
  const [direction, setDirection] = useState('forward');
  const prevActiveRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(TRANSITION_STORAGE_KEY, transition);
    } catch {
      /* ignore */
    }
  }, [transition]);

  // Scroll-driven active project.
  useEffect(() => {
    const stage = stageScrollRef.current;
    if (!stage) return;
    const update = () => {
      const rect = stage.getBoundingClientRect();
      const stageHeight = stage.clientHeight;
      const viewport = window.innerHeight;
      const scrolled = -rect.top;
      const scrollable = Math.max(1, stageHeight - viewport);
      const progress = Math.max(0, Math.min(0.999, scrolled / scrollable));
      const idx = Math.min(count - 1, Math.floor(progress * count));
      setScrollActive((prev) => (prev === idx ? prev : idx));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [count]);

  // Whenever real scroll moves us into a new project range, drop the manual
  // override so the scroll position becomes the source of truth again.
  useEffect(() => {
    setManualActive(null);
  }, [scrollActive]);

  // Update slide direction whenever the active project changes.
  useEffect(() => {
    if (active === prevActiveRef.current) return;
    setDirection(active > prevActiveRef.current ? 'forward' : 'backward');
    prevActiveRef.current = active;
  }, [active]);

  const persist = (next) => {
    if (!isAdmin) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch('/__work-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
    }, 400);
  };

  const updateProject = (projectId, mutator) => {
    setData((prev) => {
      const current = normalizeProjectState(prev[projectId]);
      const updated = mutator(current);
      const next = { ...prev, [projectId]: updated };
      persist(next);
      return next;
    });
  };

  const activeProject = workProjects[active] ?? workProjects[0];
  const projectState = normalizeProjectState(data[activeProject?.id]);

  // Build the full list of screens: project's main screen + extras from JSON.
  const screens = useMemo(() => {
    const mainScreen = activeProject?.mainScreen;
    const main = mainScreen ? [mainScreen] : [];
    return [...main, ...(projectState.screens || [])];
  }, [activeProject, projectState.screens]);

  const activeScreenId =
    activeScreenByProject[activeProject?.id] || screens[0]?.id || 'main';
  const activeScreen =
    screens.find((s) => s.id === activeScreenId) || screens[0];
  const activeScreenNodes = projectState.nodes[activeScreenId] ?? [];

  const setScreenNodes = (nextNodes) => {
    updateProject(activeProject.id, (state) => ({
      ...state,
      nodes: { ...state.nodes, [activeScreenId]: nextNodes },
    }));
  };

  const selectScreen = (screenId) => {
    setActiveScreenByProject((prev) => ({ ...prev, [activeProject.id]: screenId }));
  };

  const addScreen = async (file) => {
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = String(dataUrl).split(',')[1];
      const res = await fetch('/__work-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, data: base64 }),
      });
      const json = await res.json();
      if (!json?.src) throw new Error('upload failed');
      const id = `s_${Math.random().toString(36).slice(2, 9)}`;
      const label = `Screen ${screens.length + 1}`;
      const newScreen = { id, label, src: json.src };
      updateProject(activeProject.id, (state) => ({
        ...state,
        screens: [...(state.screens || []), newScreen],
        nodes: { ...state.nodes, [id]: [] },
      }));
      selectScreen(id);
    } catch (err) {
      window.alert(`Upload failed: ${err.message}`);
    }
  };

  const renameScreen = (screenId, label) => {
    updateProject(activeProject.id, (state) => ({
      ...state,
      screens: (state.screens || []).map((s) => (s.id === screenId ? { ...s, label } : s)),
    }));
  };

  const deleteScreen = (screenId) => {
    updateProject(activeProject.id, (state) => {
      const remainingNodes = { ...state.nodes };
      delete remainingNodes[screenId];
      return {
        ...state,
        screens: (state.screens || []).filter((s) => s.id !== screenId),
        nodes: remainingNodes,
      };
    });
    // Fall back to 'main' if we just removed the active screen.
    setActiveScreenByProject((prev) =>
      prev[activeProject.id] === screenId
        ? { ...prev, [activeProject.id]: 'main' }
        : prev
    );
  };

  const goToProject = (idx) => {
    if (idx < 0 || idx >= count) return;
    // Just swap the active project — don't scroll the page. The page can
    // still drive switching when the user actually scrolls; this button
    // path is independent so the navbar stays where it is.
    setManualActive(idx);
  };

  const stageStyle = useMemo(
    () => ({ height: `calc(${count} * 100vh)` }),
    [count]
  );

  // Resolve the actual image URL for the active screen.
  const activeImage = activeScreen?.image || activeScreen?.src || null;

  return (
    <section id="work" className="section tab-content work-section">
      <div className="work-stage" ref={stageScrollRef} style={stageStyle}>
        <div className="work-stage-sticky">
          <ProjectStage
            image={activeImage}
            alt={`${activeProject?.title} — ${activeScreen?.label || ''}`}
            nodes={activeScreenNodes}
            isAdmin={isAdmin}
            onChange={setScreenNodes}
            transition={transition}
            direction={direction}
          />
          <div className="work-info">
            <ScreenTabs
              screens={screens}
              activeId={activeScreenId}
              onSelect={selectScreen}
              isAdmin={isAdmin}
              onAdd={addScreen}
              onRename={renameScreen}
              onDelete={deleteScreen}
              onAddNode={() => setScreenNodes([...activeScreenNodes, newNode()])}
            />
            {isAdmin && (
              <div className="work-transition-picker" role="radiogroup" aria-label="Screen transition">
                <span className="work-transition-picker-label">transition</span>
                {TRANSITION_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={transition === t.id}
                    className={`work-transition-picker-btn ${transition === t.id ? 'active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setTransition(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <h3 className="work-info-title">{activeProject?.title}</h3>
            {(activeProject?.company || activeProject?.duration) && (
              <span className="work-info-company">
                {activeProject?.company}
                {activeProject?.company && activeProject?.duration ? ' · ' : ''}
                {activeProject?.duration}
              </span>
            )}
            <div className="work-switcher" role="tablist" aria-label="Work projects">
              <button
                type="button"
                className="work-switcher-arrow"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToProject(active - 1)}
                disabled={active === 0}
                aria-label="Previous project"
              >
                ‹
              </button>
              <div className="work-switcher-dots">
                {workProjects.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`Go to ${p.company || p.title}`}
                    className={`work-switcher-dot ${i === active ? 'active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToProject(i)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="work-switcher-arrow"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToProject(active + 1)}
                disabled={active === count - 1}
                aria-label="Next project"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkSection;
