import React, { useEffect, useRef } from 'react';

// The floating screenshot for the project under the pointer. It trails the
// cursor rather than snapping to it, and tilts with the direction of travel,
// so it reads as something being carried alongside the list.
const W = 250;
const H = 165;

// How long the frame keeps trailing the pointer after the screenshot is
// taken away. Matches the opacity transition in 30-projects.css: it fades
// while still following, rather than freezing in place as it goes.
const FADE_MS = 300;

const Preview = ({ src, label, pointerRef }) => {
  const elRef = useRef(null);
  const imgRef = useRef(null);
  const pos = useRef(null);

  useEffect(() => {
    let raf = 0;
    let idleAt = src ? 0 : performance.now();

    const frame = (now) => {
      const el = elRef.current;
      const target = pointerRef.current;

      if (el && target) {
        // Keep it beside the pointer and inside the window.
        const want = {
          x: Math.max(14, Math.min(window.innerWidth - W - 14, target.x + 34)),
          y: Math.max(14, Math.min(window.innerHeight - H - 14, target.y - H / 2)),
        };

        if (!pos.current) pos.current = { ...want, vx: 0, vy: 0 };

        const prevX = pos.current.x;
        const prevY = pos.current.y;
        pos.current.x += (want.x - pos.current.x) * 0.12;
        pos.current.y += (want.y - pos.current.y) * 0.12;

        const vx = pos.current.x - prevX;
        const vy = pos.current.y - prevY;
        const tilt = Math.max(-7, Math.min(7, vx * 0.45));

        el.style.transform =
          `translate3d(${pos.current.x.toFixed(1)}px, ${pos.current.y.toFixed(1)}px, 0) ` +
          `rotate(${tilt.toFixed(2)}deg)`;

        // The image drifts a little inside its frame — a touch of parallax.
        if (imgRef.current) {
          imgRef.current.style.transform =
            `scale(1.08) translate3d(${(-vx * 1.1).toFixed(1)}px, ${(-vy * 0.8).toFixed(1)}px, 0)`;
        }
      }

      // Nothing to carry and the fade is over: stop. Without this the loop
      // ran at 60fps for as long as the projects tab was open, writing
      // transforms to a frame nobody could see. The position is dropped with
      // it, so the next screenshot opens beside the pointer rather than
      // springing in from wherever this one was left.
      if (!src && now - idleAt > FADE_MS) {
        pos.current = null;
        raf = 0;
        return;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pointerRef, src]);

  return (
    <div
      className="preview"
      ref={elRef}
      data-on={src ? 'true' : 'false'}
      style={{ width: W, height: H }}
      aria-hidden="true"
    >
      {src ? <img ref={imgRef} src={src} alt={label || ''} /> : null}
    </div>
  );
};

export default Preview;
