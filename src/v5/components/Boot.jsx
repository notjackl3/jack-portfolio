import { useEffect, useRef } from 'react';

// The page doesn't animate in — it is already there, sitting under a sheet of
// the background colour. The sheet is what animates: it erodes a block at a
// time, starting in the middle of the screen and spreading outward, so the
// page is uncovered rather than assembled.
//
// One canvas rather than an animation per element, because the unit of the
// dissolve has to be a block of the sheet. Fading elements individually makes
// a heading or a whole row arrive at once, which is what reads as chunks.

const CELL = 20; // px — one block of the dissolve
const HOLD = 240; // ms the sheet sits solid first, so the erosion is noticed
const SPREAD = 640; // ms from the middle of the screen to the furthest corner
const FADE = 420; // ms for one block to go from solid to gone
const JITTER = 380; // ms of per-block randomness. Generous on purpose: it is
                    // what sprinkles blocks out ahead of the wave, so this
                    // dissolves rather than wiping out in a clean circle
const CURVE = 0.85; // <1 pulls the outer blocks forward, so the erosion
                    // spreads at a steadier rate instead of creeping for the
                    // first third and then rushing the rest
const STEPS = 7; // alpha is quantised to this many levels. The pixellation
                 // comes from the block size, not from this, so more levels
                 // smooth each block's fade without softening the grid

const Boot = () => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const root = document.documentElement;
    if (!canvas) return undefined;

    const finish = () => {
      // `.v5-boot` only *suppressed* the mount entrance — it never ran. Drop
      // the class and every one of those animations starts fresh, which is
      // the bounce that used to follow the dissolve. Stamp them as done
      // first, before the suppression comes off. Anything mounted later (a
      // tab change, the heatmaps arriving) has no stamp and still animates.
      document.querySelectorAll('.rise').forEach((el) => el.classList.add('boot-still'));
      root.classList.remove('v5-boot');
      canvas.style.display = 'none';
      // Drop the backing store; a full-viewport canvas is a few megabytes to
      // keep around for something that runs once.
      canvas.width = 0;
      canvas.height = 0;
    };

    const ctx = canvas.getContext?.('2d');
    if (!ctx || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return undefined;
    }

    root.classList.add('v5-boot');

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Deliberately not scaled by devicePixelRatio. The blocks are the point,
    // and a 1:1 canvas is a quarter of the fill work on a retina screen.
    canvas.width = w;
    canvas.height = h;

    const sheet = getComputedStyle(document.body).backgroundColor;
    const rgb = sheet?.match(/\d+/g)?.slice(0, 3).join(',') || '251,250,247';

    const cols = Math.ceil(w / CELL);
    const rows = Math.ceil(h / CELL);
    const cx = w / 2;
    const cy = h / 2;
    const far = Math.hypot(cx, cy) || 1;

    // When each block starts to go: its distance from the middle, plus noise.
    const at = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const d = Math.hypot(i * CELL + CELL / 2 - cx, j * CELL + CELL / 2 - cy);
        at[j * cols + i] = HOLD + (d / far) ** CURVE * SPREAD + Math.random() * JITTER;
      }
    }

    const total = HOLD + SPREAD + JITTER + FADE;
    // Grouped by level so there are only STEPS fillStyle changes a frame,
    // however many blocks are still standing.
    const buckets = Array.from({ length: STEPS }, () => []);
    let raf = 0;
    let start = 0;

    const frame = (now) => {
      if (!start) start = now;
      const t = now - start;

      if (t >= total) {
        finish();
        return;
      }

      ctx.clearRect(0, 0, w, h);
      for (const b of buckets) b.length = 0;

      for (let j = 0; j < rows; j += 1) {
        for (let i = 0; i < cols; i += 1) {
          const gone = t - at[j * cols + i];
          if (gone >= FADE) continue;
          const a = gone <= 0 ? 1 : 1 - gone / FADE;
          const step = Math.ceil(a * STEPS); // hold a level, then drop
          if (step > 0) buckets[step - 1].push(i * CELL, j * CELL);
        }
      }

      for (let s = 0; s < STEPS; s += 1) {
        const pts = buckets[s];
        if (!pts.length) continue;
        ctx.fillStyle = `rgba(${rgb},${(s + 1) / STEPS})`;
        for (let k = 0; k < pts.length; k += 2) ctx.fillRect(pts[k], pts[k + 1], CELL, CELL);
      }

      raf = requestAnimationFrame(frame);
    };

    // Solid on the very first frame, before the loop has run.
    ctx.fillStyle = `rgb(${rgb})`;
    ctx.fillRect(0, 0, w, h);
    raf = requestAnimationFrame(frame);

    // What's under the sheet should be finished, not mid-entrance: a
    // half-faded row uncovered by the dissolve is the chunkiness this is
    // meant to avoid. `.v5-boot` stops `.rise`; the scroll reveals already
    // on screen are marked done here.
    document.querySelectorAll('.reveal').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < h) el.classList.add('is-in');
    });

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('v5-boot');
    };
  }, []);

  return <canvas className="boot-veil" ref={ref} aria-hidden="true" />;
};

export default Boot;
