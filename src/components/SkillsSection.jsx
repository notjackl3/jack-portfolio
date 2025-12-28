import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

const SkillsSection = () => {
  const skills = useMemo(
    () => [
      // Languages
      "Python",
      "JavaScript",
      "TypeScript",
      "Java",
      "C",
      "SQL",
      "HTML",
      "CSS",
      "Assembly",

      // Frameworks
      "Django",
      "Next.js",
      "React.js",
      "FastAPI",
      "Flask",
      "Tailwind",
      "Bootstrap",

      // Technologies
      "Git",
      "Github",
      "PostgreSQL",
      "AWS",
      "Google Cloud Platform",
      "Docker",
      "Supabase",
      "Vercel",
      "Render",

      // Coding Tools
      "VS Code",
      "IntelliJ",
      "Pycharm",
      "Gemini CLI",
      "Cursor",
      "Claude",
    ],
    []
  );

  const stageRef = useRef(null);
  const bubbleRefs = useRef([]);
  const rafRef = useRef(null);
  const lastTRef = useRef(0);
  const mouseRef = useRef({ active: false, x: 0, y: 0 });
  const tickRef = useRef(0);

  // Simulation state stored in a ref (so we can animate without re-rendering every frame)
  const simRef = useRef({
    stageW: 0,
    stageH: 0,
    x: [],
    y: [],
    vx: [],
    vy: [],
    w: [],
    h: [],
    hw: [],
    hh: [],
  });

  const measureStageAndBubbles = () => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const stageRect = stageEl.getBoundingClientRect();
    const stageW = stageRect.width;
    const stageH = stageRect.height;

    const w = [];
    const h = [];
    const hw = [];
    const hh = [];

    for (let i = 0; i < skills.length; i++) {
      const el = bubbleRefs.current[i];
      if (!el) {
        w[i] = 80;
        h[i] = 32;
        hw[i] = 40;
        hh[i] = 16;
        continue;
      }
      const rect = el.getBoundingClientRect();
      w[i] = rect.width;
      h[i] = rect.height;
      hw[i] = rect.width * 0.5;
      hh[i] = rect.height * 0.5;
    }

    simRef.current.stageW = stageW;
    simRef.current.stageH = stageH;
    simRef.current.w = w;
    simRef.current.h = h;
    simRef.current.hw = hw;
    simRef.current.hh = hh;
  };

  const applyDomPositions = () => {
    const { x, y, w, h } = simRef.current;
    for (let i = 0; i < skills.length; i++) {
      const el = bubbleRefs.current[i];
      if (!el) continue;
      const tx = (x[i] ?? 0) - (w[i] ?? 0) / 2;
      const ty = (y[i] ?? 0) - (h[i] ?? 0) / 2;
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    }
  };

  useLayoutEffect(() => {
    // Measure + seed positions spread across the stage (avoid starting overlapped in the center).
    const stageEl = stageRef.current;
    if (!stageEl) return;

    measureStageAndBubbles();

    const { stageW, stageH } = simRef.current;

    const x = new Array(skills.length);
    const y = new Array(skills.length);
    const vx = new Array(skills.length);
    const vy = new Array(skills.length);

    const pad = 10;

    for (let i = 0; i < skills.length; i++) {
      const hw = simRef.current.hw[i] ?? 40;
      const hh = simRef.current.hh[i] ?? 16;
      const minX = hw + pad;
      const maxX = stageW - hw - pad;
      const minY = hh + pad;
      const maxY = stageH - hh - pad;

      // Try a few times to place without overlap; fall back to random.
      let placed = false;
      for (let attempt = 0; attempt < 80; attempt++) {
        const px = minX + Math.random() * Math.max(1, maxX - minX);
        const py = minY + Math.random() * Math.max(1, maxY - minY);
        let overlap = false;
        for (let j = 0; j < i; j++) {
          const dx = Math.abs(px - x[j]);
          const dy = Math.abs(py - y[j]);
          const ox = hw + (simRef.current.hw[j] ?? 40) + 2 - dx;
          const oy = hh + (simRef.current.hh[j] ?? 16) + 2 - dy;
          if (ox > 0 && oy > 0) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          x[i] = px;
          y[i] = py;
          placed = true;
          break;
        }
      }

      if (!placed) {
        x[i] = minX + Math.random() * Math.max(1, maxX - minX);
        y[i] = minY + Math.random() * Math.max(1, maxY - minY);
      }

      vx[i] = (Math.random() - 0.5) * 0.9;
      vy[i] = (Math.random() - 0.5) * 0.9;
    }

    simRef.current.x = x;
    simRef.current.y = y;
    simRef.current.vx = vx;
    simRef.current.vy = vy;

    applyDomPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = Boolean(mq?.matches);
    if (prefersReducedMotion) return;

    const stageEl = stageRef.current;
    const onPointerMove = (e) => {
      if (!stageEl) return;
      const r = stageEl.getBoundingClientRect();
      mouseRef.current.active = true;
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;

      // Drive the cursor ring via CSS variables (so it stays smooth and cheap to render)
      stageEl.style.setProperty('--mx', `${mouseRef.current.x}px`);
      stageEl.style.setProperty('--my', `${mouseRef.current.y}px`);
      stageEl.style.setProperty('--mactive', '1');
    };
    const onPointerLeave = () => {
      mouseRef.current.active = false;
      stageEl?.style.setProperty('--mactive', '0');
    };
    stageEl?.addEventListener('pointermove', onPointerMove);
    stageEl?.addEventListener('pointerleave', onPointerLeave);

    const step = (t) => {
      const s = simRef.current;
      const n = skills.length;

      if (!s.stageW || !s.stageH) {
        measureStageAndBubbles();
      }

      const dtMs = lastTRef.current ? t - lastTRef.current : 16.67;
      lastTRef.current = t;
      const dt = Math.min(34, Math.max(8, dtMs)) / 16.67; // normalized ~60fps
      tickRef.current = (tickRef.current + dtMs) % 1000000;

      const wander = 0.055; // random hover force
      const damping = 0.988;
      const maxSpeed = 1.55;
      const mousePush = 0.42; // higher => stronger mouse interaction
      const mouseRadius = Math.min(s.stageW, s.stageH) * 0.22;
      const mouseRadius2 = mouseRadius * mouseRadius;
      const swirl = 0.012; // gentle time-based nudge to prevent "locking"

      // Apply forces
      for (let i = 0; i < n; i++) {
        s.vx[i] += (Math.random() - 0.5) * wander * dt;
        s.vy[i] += (Math.random() - 0.5) * wander * dt;

        // Small deterministic swirl so packs keep circulating (balanced x/y)
        const phase = (tickRef.current * 0.0012) + i * 0.7;
        s.vx[i] += Math.cos(phase) * swirl * dt;
        s.vy[i] += Math.sin(phase) * swirl * dt;

        // Mouse repulsion (creates collisions/movement when hovering over/near bubbles)
        if (mouseRef.current.active) {
          const mdx = s.x[i] - mouseRef.current.x;
          const mdy = s.y[i] - mouseRef.current.y;
          const d2 = mdx * mdx + mdy * mdy;
          if (d2 > 0 && d2 < mouseRadius2) {
            const d = Math.sqrt(d2);
            const nx = mdx / d;
            const ny = mdy / d;
            const falloff = 1 - d / mouseRadius; // 1 at cursor, 0 at edge
            const kick = mousePush * falloff * falloff;
            s.vx[i] += nx * kick * dt;
            s.vy[i] += ny * kick * dt;
          }
        }

        s.vx[i] *= damping;
        s.vy[i] *= damping;

        const speed = Math.hypot(s.vx[i], s.vy[i]);
        if (speed > maxSpeed) {
          const k = maxSpeed / speed;
          s.vx[i] *= k;
          s.vy[i] *= k;
        }
      }

      // Integrate + keep in bounds
      for (let i = 0; i < n; i++) {
        s.x[i] += s.vx[i] * dt;
        s.y[i] += s.vy[i] * dt;

        const pad = 6;
        const hw = s.hw[i] ?? 40;
        const hh = s.hh[i] ?? 16;
        const minX = hw + pad;
        const maxX = s.stageW - hw - pad;
        const minY = hh + pad;
        const maxY = s.stageH - hh - pad;

        if (s.x[i] < minX) {
          s.x[i] = minX;
          s.vx[i] = Math.abs(s.vx[i]) * 0.9;
        } else if (s.x[i] > maxX) {
          s.x[i] = maxX;
          s.vx[i] = -Math.abs(s.vx[i]) * 0.9;
        }

        if (s.y[i] < minY) {
          s.y[i] = minY;
          s.vy[i] = Math.abs(s.vy[i]) * 0.9;
        } else if (s.y[i] > maxY) {
          s.y[i] = maxY;
          s.vy[i] = -Math.abs(s.vy[i]) * 0.9;
        }
      }

      // Collisions: softer AABB separation to avoid jitter in dense packs
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = s.x[j] - s.x[i];
          const dy = s.y[j] - s.y[i];
          const gap = 2;
          const ox = (s.hw[i] ?? 40) + (s.hw[j] ?? 40) + gap - Math.abs(dx);
          const oy = (s.hh[i] ?? 16) + (s.hh[j] ?? 16) + gap - Math.abs(dy);

          if (ox > 0 && oy > 0) {
            const slop = 0.75; // ignore tiny overlaps to reduce micro-jitter
            const sx = dx < 0 ? -1 : 1;
            const sy = dy < 0 ? -1 : 1;

            const corr = 0.28; // only correct a fraction of overlap per frame
            const maxStep = 3.25; // cap correction so it doesn't explode

            // Separate on the axis of least penetration (stable), with a tiny sideways drift
            if (ox < oy) {
              const push = Math.min(maxStep, Math.max(0, ox - slop) * corr);
              if (push > 0) {
                const drift = Math.sin((tickRef.current * 0.0015) + i * 0.7 + j) * 0.15;
                s.x[i] -= sx * push;
                s.x[j] += sx * push;
                s.y[i] -= drift;
                s.y[j] += drift;

                // Gentle velocity damping along the push axis
                s.vx[i] *= 0.92;
                s.vx[j] *= 0.92;
              }
            } else {
              const push = Math.min(maxStep, Math.max(0, oy - slop) * corr);
              if (push > 0) {
                const drift = Math.cos((tickRef.current * 0.0015) + i * 0.7 + j) * 0.15;
                s.y[i] -= sy * push;
                s.y[j] += sy * push;
                s.x[i] -= drift;
                s.x[j] += drift;

                s.vy[i] *= 0.92;
                s.vy[j] *= 0.92;
              }
            }
          }
        }
      }

      // Re-clamp after collision resolution
      for (let i = 0; i < n; i++) {
        const pad = 6;
        const hw = s.hw[i] ?? 40;
        const hh = s.hh[i] ?? 16;
        const minX = hw + pad;
        const maxX = s.stageW - hw - pad;
        const minY = hh + pad;
        const maxY = s.stageH - hh - pad;
        s.x[i] = Math.min(maxX, Math.max(minX, s.x[i]));
        s.y[i] = Math.min(maxY, Math.max(minY, s.y[i]));
      }

      applyDomPositions();
      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);

    const onResize = () => {
      measureStageAndBubbles();
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      stageEl?.removeEventListener('pointermove', onPointerMove);
      stageEl?.removeEventListener('pointerleave', onPointerLeave);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [skills]);

  return (
    <section id="skills" className="section tab-content skills-bubbles-section">
      <div ref={stageRef} className="skills-bubbles-stage" aria-label="Skills">
        {skills.map((skill, i) => (
          <span
            key={skill}
            ref={(el) => {
              bubbleRefs.current[i] = el;
            }}
            className="skills-bubble"
            onPointerEnter={() => {
              // Extra little "kick" when you hover directly over a bubble
              const s = simRef.current;
              if (!s.vx?.length) return;
              s.vx[i] += (Math.random() - 0.5) * 1.2;
              s.vy[i] += (Math.random() - 0.5) * 1.2;
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
};

export default SkillsSection;

