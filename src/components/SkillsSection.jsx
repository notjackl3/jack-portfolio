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
    r: [],
  });

  const measureStageAndBubbles = () => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const stageRect = stageEl.getBoundingClientRect();
    const stageW = stageRect.width;
    const stageH = stageRect.height;

    const w = [];
    const h = [];
    const r = [];

    for (let i = 0; i < skills.length; i++) {
      const el = bubbleRefs.current[i];
      if (!el) {
        w[i] = 80;
        h[i] = 32;
        r[i] = 40;
        continue;
      }
      const rect = el.getBoundingClientRect();
      w[i] = rect.width;
      h[i] = rect.height;
      r[i] = Math.max(rect.width, rect.height) * 0.5;
    }

    simRef.current.stageW = stageW;
    simRef.current.stageH = stageH;
    simRef.current.w = w;
    simRef.current.h = h;
    simRef.current.r = r;
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
    // Seed positions near the center, then measure and position properly.
    const stageEl = stageRef.current;
    if (!stageEl) return;

    measureStageAndBubbles();

    const { stageW, stageH } = simRef.current;
    const cx = stageW / 2;
    const cy = stageH / 2;

    const x = new Array(skills.length);
    const y = new Array(skills.length);
    const vx = new Array(skills.length);
    const vy = new Array(skills.length);

    for (let i = 0; i < skills.length; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.min(stageW, stageH) * (0.08 + Math.random() * 0.22);
      x[i] = cx + Math.cos(angle) * radius;
      y[i] = cy + Math.sin(angle) * radius;
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
    };
    const onPointerLeave = () => {
      mouseRef.current.active = false;
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

      const wander = 0.055; // random hover force
      const damping = 0.988;
      const maxSpeed = 1.55;
      const mousePush = 0.42; // higher => stronger mouse interaction
      const mouseRadius = Math.min(s.stageW, s.stageH) * 0.22;
      const mouseRadius2 = mouseRadius * mouseRadius;

      // Apply forces
      for (let i = 0; i < n; i++) {
        s.vx[i] += (Math.random() - 0.5) * wander * dt;
        s.vy[i] += (Math.random() - 0.5) * wander * dt;

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

        const ri = s.r[i] ?? 24;
        const pad = 6;
        const minX = ri + pad;
        const maxX = s.stageW - ri - pad;
        const minY = ri + pad;
        const maxY = s.stageH - ri - pad;

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

      // Collisions: simple separation + a bit of random "bump apart"
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = s.x[j] - s.x[i];
          const dy = s.y[j] - s.y[i];
          const dist = Math.hypot(dx, dy);
          const minDist = (s.r[i] ?? 24) + (s.r[j] ?? 24) + 2;

          if (dist > 0 && dist < minDist) {
            const overlap = minDist - dist;

            // Mostly separate along the collision normal, but add a small random twist.
            let nx = dx / dist;
            let ny = dy / dist;
            const twist = (Math.random() - 0.5) * 0.55;
            nx += twist;
            ny -= twist;
            const nlen = Math.hypot(nx, ny) || 1;
            nx /= nlen;
            ny /= nlen;

            const push = overlap * 0.5;
            s.x[i] -= nx * push;
            s.y[i] -= ny * push;
            s.x[j] += nx * push;
            s.y[j] += ny * push;

            s.vx[i] -= nx * 0.12;
            s.vy[i] -= ny * 0.12;
            s.vx[j] += nx * 0.12;
            s.vy[j] += ny * 0.12;
          } else if (dist === 0) {
            // Perfect overlap: random nudge
            const angle = Math.random() * Math.PI * 2;
            const nudge = 2;
            s.x[i] += Math.cos(angle) * nudge;
            s.y[i] += Math.sin(angle) * nudge;
          }
        }
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
              s.vx[i] += (Math.random() - 0.5) * 2.4;
              s.vy[i] += (Math.random() - 0.5) * 2.4;
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

