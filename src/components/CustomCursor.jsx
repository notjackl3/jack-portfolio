import React, { useEffect, useRef } from 'react';

const TRAIL_COUNT = 6;

// Liquid-glass cursor: a frosted circle that trails the pointer, stretches
// along its direction of motion, and leaves a chain of droplets behind.
// Only activates on devices with a precise pointer (mouse/trackpad), so
// touch devices keep their default behavior.
const CustomCursor = () => {
  const cursorRef = useRef(null);
  const trailRefs = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;

    const el = cursorRef.current;
    if (!el) return undefined;
    const trailEls = trailRefs.current.filter(Boolean);

    document.body.classList.add('custom-cursor-active');

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    const trail = trailEls.map(() => ({ ...pos }));
    let visible = false;
    let raf;

    const render = () => {
      const prevX = pos.x;
      const prevY = pos.y;
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;

      // Squash & stretch along the direction of motion: faster movement
      // pulls the circle into a droplet, easing back to round at rest.
      const vx = pos.x - prevX;
      const vy = pos.y - prevY;
      const speed = Math.sqrt(vx * vx + vy * vy);
      const stretch = Math.min(speed / 40, 0.45);
      const angle = Math.atan2(vy, vx);
      el.style.transform =
        `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) ` +
        `rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.55})`;

      // Each droplet chases the one ahead of it, so the trail flows like
      // a fluid being dragged rather than a row of fixed-lag followers.
      let leadX = pos.x;
      let leadY = pos.y;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        t.x += (leadX - t.x) * 0.3;
        t.y += (leadY - t.y) * 0.3;
        trailEls[i].style.transform =
          `translate3d(${t.x}px, ${t.y}px, 0) translate(-50%, -50%)`;
        leadX = t.x;
        leadY = t.y;
      }

      raf = requestAnimationFrame(render);
    };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        pos.x = e.clientX;
        pos.y = e.clientY;
        trail.forEach((t) => {
          t.x = e.clientX;
          t.y = e.clientY;
        });
        el.classList.add('is-visible');
        trailEls.forEach((t) => t.classList.add('is-visible'));
      }
    };

    const onLeave = () => {
      visible = false;
      el.classList.remove('is-visible');
      trailEls.forEach((t) => t.classList.remove('is-visible'));
    };
    const onDown = () => el.classList.add('is-down');
    const onUp = () => el.classList.remove('is-down');

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="liquid-cursor" aria-hidden="true" />
      {Array.from({ length: TRAIL_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(node) => {
            trailRefs.current[i] = node;
          }}
          className="liquid-cursor-trail"
          aria-hidden="true"
          style={{
            width: `${14 - i * 1.8}px`,
            height: `${14 - i * 1.8}px`,
            '--trail-opacity': 0.55 - i * 0.07,
          }}
        />
      ))}
    </>
  );
};

export default CustomCursor;
