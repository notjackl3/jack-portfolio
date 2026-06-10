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
  // Optional URL that overrides the main screen image defined in work.js.
  mainSrc: typeof raw?.mainSrc === 'string' ? raw.mainSrc : null,
  // Optional label override for the main screen tab.
  mainLabel: typeof raw?.mainLabel === 'string' ? raw.mainLabel : null,
  // Optional title / company / duration overrides applied to the work.js defaults.
  meta: typeof raw?.meta === 'object' && raw.meta !== null ? raw.meta : {},
  // Optional display-order override (used to reorder projects in admin mode).
  // null = use the project's natural position in workProjects.
  order: typeof raw?.order === 'number' ? raw.order : null,
});

const Laptop = ({ image, alt }) => {
  const [current, setCurrent] = useState(image);
  const [prev, setPrev] = useState(null);
  const [tk, setTk] = useState(0);

  useEffect(() => {
    if (image === current) return;
    setPrev(current);
    setCurrent(image);
    setTk((k) => k + 1);
    // Outlast the CRT animation (~800ms) before clearing the previous frame.
    const t = setTimeout(() => setPrev(null), 900);
    return () => clearTimeout(t);
  }, [image, current]);

  return (
    <>
      <div
        className="work-laptop-screen"
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

const ProjectStage = ({ image, alt, nodes, isAdmin, onChange, animKey }) => {
  const stageRef = useRef(null);
  const dragRef = useRef(null);

  // Persist textarea height when the admin drags its resize handle. Otherwise
  // the new height lives only in the DOM and snaps back the next time the
  // layer remounts (project switch, screen switch, etc.).
  const observerRef = useRef(null);
  const observedRef = useRef(new Map()); // textarea element → node id
  const nodesRef = useRef(nodes);
  const onChangeRef = useRef(onChange);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nodeId = observedRef.current.get(entry.target);
        if (!nodeId) continue;
        const h = Math.round(entry.target.offsetHeight);
        if (!h) continue;
        const current = nodesRef.current.find((n) => n.id === nodeId);
        if (!current || current.h === h) continue;
        onChangeRef.current(
          nodesRef.current.map((n) => (n.id === nodeId ? { ...n, h } : n))
        );
      }
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, []);

  const registerTextarea = (nodeId, el) => {
    const observer = observerRef.current;
    if (!observer) return;
    // Unobserve any previous element associated with this node id.
    for (const [prevEl, id] of observedRef.current) {
      if (id === nodeId && prevEl !== el) {
        observer.unobserve(prevEl);
        observedRef.current.delete(prevEl);
      }
    }
    if (el) {
      observedRef.current.set(el, nodeId);
      observer.observe(el);
    }
  };

  const beginDrag = (e, mode, nodeId) => {
    // Visitors can reposition cards (in-memory only — persist is admin-gated)
    // so crowded layouts can be untangled. The on-screen node anchor is
    // admin-only because moving it would change the intent of the note.
    if (!isAdmin && mode === 'node') return;
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
      <Laptop image={image} alt={alt} />

      {/* Re-mounts on project/screen change (via animKey) so the line-draw
          + node-pop + card-pop animations replay every transition. */}
      <div className="work-nodes-layer" key={animKey}>
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
              strokeWidth="1.5"
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

      {nodes.map((n) => {
        // Visitors drag by the whole card body; admins drag by the ⋮⋮ handle
        // so the textarea inside the card stays interactive.
        const cardDragHandlers = !isAdmin
          ? {
              onPointerDown: (e) => beginDrag(e, 'card', n.id),
              onPointerMove,
              onPointerUp: endDrag,
              onPointerCancel: endDrag,
            }
          : {};
        return (
        <div
          key={`card-${n.id}`}
          className={`work-node-card ${isAdmin ? 'is-admin' : ''}`}
          style={{ left: `${n.cx}%`, top: `${n.cy}%` }}
          {...cardDragHandlers}
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
              ref={(el) => registerTextarea(n.id, el)}
              style={n.h ? { height: `${n.h}px` } : undefined}
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
        );
      })}
      </div>
    </div>
  );
};

const ScreenTabs = ({
  screens,
  activeId,
  onSelect,
  isAdmin,
  onAdd,
  onChangeImage,
  onRename,
  onDelete,
  onAddNode,
}) => {
  const addFileInputRef = useRef(null);
  const changeFileInputRef = useRef(null);
  const pendingChangeIdRef = useRef(null);

  const triggerChange = (screenId) => {
    pendingChangeIdRef.current = screenId;
    changeFileInputRef.current?.click();
  };

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
          {isAdmin && s.id === activeId && (
            <>
              <button
                type="button"
                className="work-screen-tab-action"
                onClick={() => triggerChange(s.id)}
                title="Change image"
                aria-label="Change image"
              >
                ↻
              </button>
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
              {s.id !== 'main' && (
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
              )}
            </>
          )}
        </div>
      ))}
      {isAdmin && (
        <>
          <button
            type="button"
            className="work-screen-tab-add"
            onClick={() => addFileInputRef.current?.click()}
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
            ref={addFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onAdd(file);
            }}
          />
          <input
            ref={changeFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              const id = pendingChangeIdRef.current;
              pendingChangeIdRef.current = null;
              if (file && id) onChangeImage(id, file);
            }}
          />
        </>
      )}
    </div>
  );
};

const WorkSection = ({ initialSlug = null }) => {
  const count = workProjects.length;
  // Single-viewport stage: the only way to change the active project is the
  // prev / next arrows and the switcher dots. No scroll-driven progression.
  const [active, setActive] = useState(0);
  const [data, setData] = useState(() => initialData || {});
  // Which screen is active per project (by screen id).
  const [activeScreenByProject, setActiveScreenByProject] = useState({});
  const saveTimerRef = useRef(null);
  const isAdmin = useMemo(isAdminHost, []);

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

  // Stable display order: each project's persisted `order` (when admin has
  // moved it) overrides its natural index in workProjects. Ties fall back to
  // the original index, so adding a new project lands at the bottom by
  // default.
  const orderedProjects = useMemo(() => {
    const indexed = workProjects.map((p, i) => ({ project: p, idx: i }));
    indexed.sort((a, b) => {
      const oa = data[a.project.id]?.order;
      const ob = data[b.project.id]?.order;
      const ka = typeof oa === 'number' ? oa : a.idx;
      const kb = typeof ob === 'number' ? ob : b.idx;
      if (ka !== kb) return ka - kb;
      return a.idx - b.idx;
    });
    return indexed.map(({ project }) => project);
  }, [data]);

  // Deep link (e.g. /aucctus): jump to the matching project once on mount.
  // Uses the ordered list so admin reordering doesn't break the link.
  useEffect(() => {
    if (!initialSlug) return;
    const idx = orderedProjects.findIndex((p) => p.slug === initialSlug);
    if (idx >= 0) setActive(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeProject = orderedProjects[active] ?? orderedProjects[0];
  const projectState = normalizeProjectState(data[activeProject?.id]);
  const displayTitle = projectState.meta?.title ?? activeProject?.title ?? '';
  const displayCompany = projectState.meta?.company ?? activeProject?.company ?? '';
  const displayDuration = projectState.meta?.duration ?? activeProject?.duration ?? '';

  // Swap the active project with its neighbor in the ordered list by rewriting
  // both projects' `order` fields. Both writes go through one setData so the
  // persist debounce captures the final state.
  const swapProjectOrder = (delta) => {
    const targetIdx = active + delta;
    if (targetIdx < 0 || targetIdx >= orderedProjects.length) return;
    const a = orderedProjects[active];
    const b = orderedProjects[targetIdx];
    setData((prev) => {
      const sa = normalizeProjectState(prev[a.id]);
      const sb = normalizeProjectState(prev[b.id]);
      // Resolve current orders to concrete numbers (use natural index if unset).
      const oa = typeof sa.order === 'number' ? sa.order : workProjects.findIndex((p) => p.id === a.id);
      const ob = typeof sb.order === 'number' ? sb.order : workProjects.findIndex((p) => p.id === b.id);
      const next = {
        ...prev,
        [a.id]: { ...sa, order: ob },
        [b.id]: { ...sb, order: oa },
      };
      persist(next);
      return next;
    });
    // Keep the same project highlighted as it changes position.
    setActive(targetIdx);
  };

  const editProjectMeta = (field, label) => {
    if (!isAdmin || !activeProject) return;
    const current =
      field === 'title'
        ? displayTitle
        : field === 'company'
        ? displayCompany
        : displayDuration;
    const next = window.prompt(label, current || '');
    if (next == null) return;
    updateProject(activeProject.id, (state) => ({
      ...state,
      meta: { ...(state.meta || {}), [field]: next.trim() },
    }));
  };

  // Build the full list of screens: project's main screen + extras from JSON.
  // Admin overrides (mainSrc / mainLabel) are spliced into the main entry.
  const screens = useMemo(() => {
    const mainScreen = activeProject?.mainScreen;
    if (!mainScreen) return projectState.screens || [];
    const main = { ...mainScreen };
    if (projectState.mainSrc) main.src = projectState.mainSrc;
    if (projectState.mainLabel) main.label = projectState.mainLabel;
    return [main, ...(projectState.screens || [])];
  }, [
    activeProject,
    projectState.screens,
    projectState.mainSrc,
    projectState.mainLabel,
  ]);

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

  const uploadImage = async (file) => {
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
    return json.src;
  };

  const addScreen = async (file) => {
    try {
      const src = await uploadImage(file);
      const id = `s_${Math.random().toString(36).slice(2, 9)}`;
      const label = `Screen ${screens.length + 1}`;
      const newScreen = { id, label, src };
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

  const changeScreenImage = async (screenId, file) => {
    try {
      const src = await uploadImage(file);
      updateProject(activeProject.id, (state) => {
        if (screenId === 'main') {
          return { ...state, mainSrc: src };
        }
        return {
          ...state,
          screens: (state.screens || []).map((s) =>
            s.id === screenId ? { ...s, src } : s
          ),
        };
      });
    } catch (err) {
      window.alert(`Upload failed: ${err.message}`);
    }
  };

  const renameScreen = (screenId, label) => {
    updateProject(activeProject.id, (state) => {
      if (screenId === 'main') {
        return { ...state, mainLabel: label };
      }
      return {
        ...state,
        screens: (state.screens || []).map((s) =>
          s.id === screenId ? { ...s, label } : s
        ),
      };
    });
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
    setActive(idx);
    // Keep the URL shareable: /aucctus, /teb, etc. follow the active project.
    const slug = orderedProjects[idx]?.slug;
    if (slug) window.history.replaceState(null, '', `/${slug}`);
  };

  // Single-viewport stage. Outer container hugs content so no extra page
  // scroll is introduced beyond what the laptop + info naturally need.
  const stageStyle = useMemo(() => ({}), []);

  // Resolve the actual image URL for the active screen. `src` (an admin-uploaded
  // URL) wins over `image` (a Vite-imported asset) so overrides take priority.
  const activeImage = activeScreen?.src || activeScreen?.image || null;

  return (
    <section id="work" className="section tab-content work-section">
      <div className="work-stage" style={stageStyle}>
        <div className="work-stage-sticky">
          <ProjectStage
            image={activeImage}
            alt={`${activeProject?.title} — ${activeScreen?.label || ''}`}
            nodes={activeScreenNodes}
            isAdmin={isAdmin}
            onChange={setScreenNodes}
            animKey={`${activeProject?.id}_${activeScreenId}`}
          />
          <div className="work-info">
            <ScreenTabs
              screens={screens}
              activeId={activeScreenId}
              onSelect={selectScreen}
              isAdmin={isAdmin}
              onAdd={addScreen}
              onChangeImage={changeScreenImage}
              onRename={renameScreen}
              onDelete={deleteScreen}
              onAddNode={() => setScreenNodes([...activeScreenNodes, newNode()])}
            />
            {isAdmin ? (
              <h3
                className="work-info-title work-info-title--editable"
                onClick={() => editProjectMeta('title', 'Job title')}
                title="Click to edit job title"
              >
                {displayTitle}
              </h3>
            ) : (
              <h3 className="work-info-title">{displayTitle}</h3>
            )}
            {(displayCompany || displayDuration || isAdmin) && (
              <span
                className={`work-info-company${isAdmin ? ' work-info-company--editable' : ''}`}
                onClick={
                  isAdmin
                    ? () => {
                        const company = window.prompt('Company', displayCompany || '');
                        if (company == null) return;
                        const duration = window.prompt('Duration', displayDuration || '');
                        if (duration == null) return;
                        updateProject(activeProject.id, (state) => ({
                          ...state,
                          meta: {
                            ...(state.meta || {}),
                            company: company.trim(),
                            duration: duration.trim(),
                          },
                        }));
                      }
                    : undefined
                }
                title={isAdmin ? 'Click to edit company / duration' : undefined}
              >
                {displayCompany}
                {displayCompany && displayDuration ? ' · ' : ''}
                {displayDuration}
                {isAdmin && !displayCompany && !displayDuration ? 'Add company · duration' : ''}
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
                {orderedProjects.map((p, i) => (
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
              {isAdmin && (
                <div className="work-switcher-reorder" aria-label="Reorder projects">
                  <button
                    type="button"
                    className="work-switcher-reorder-btn"
                    onClick={() => swapProjectOrder(-1)}
                    disabled={active === 0}
                    title="Move project left"
                    aria-label="Move project left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="work-switcher-reorder-btn"
                    onClick={() => swapProjectOrder(1)}
                    disabled={active === count - 1}
                    title="Move project right"
                    aria-label="Move project right"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkSection;
