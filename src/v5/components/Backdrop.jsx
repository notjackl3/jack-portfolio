import React, { useEffect, useRef } from 'react';

// The background effect. One canvas, one loop, several modes — the mode is
// picked in the fx panel (bottom right) and remembered in localStorage.
//
//   none     nothing at all
//   dots     a grid of dots that drift toward the pointer
//   rings    hollow circles that open up near the pointer
//   cross    small plus marks that swell and turn to face the pointer
//   diamond  squares that grow and rotate into diamonds
//   grain    fine paper grain that lifts where the pointer passes
//   lines    a field of strokes that turn to face the pointer
//   ripple   rings spreading from wherever the pointer goes
//   rain     drops falling and splashing; the pointer pushes them aside
//   glow     a patterned surface fixed to the page; the pointer uncovers it
export const MODES = [
  { id: 'grain', label: 'grain' },
  { id: 'glow', label: 'reveal' },
  { id: 'rain', label: 'rain' },
  { id: 'ripple', label: 'ripple' },
  { id: 'lines', label: 'lines' },
  { id: 'rings', label: 'rings' },
  { id: 'cross', label: 'cross' },
  { id: 'diamond', label: 'diamond' },
  { id: 'dots', label: 'dots' },
  { id: 'none', label: 'none' },
];

const INK = '44, 43, 40';

// The colour field behind the page. The field itself never moves — the
// pointer just uncovers the part of it you're over.
export const PALETTES = [
  { id: 'sunrise', label: 'sunrise', colors: ['#f3b89c', '#f6d9a0', '#f0a9b6', '#f5c4ad', '#eec9a3'] },
  { id: 'ocean', label: 'ocean', colors: ['#a8d3e6', '#bfe6ea', '#b3b7e0', '#b6e0d2', '#b9cfea'] },
  { id: 'meadow', label: 'meadow', colors: ['#c2d9b4', '#e8e0a8', '#b4d8c8', '#d9e2bd', '#cde0c4'] },
  { id: 'candy', label: 'candy', colors: ['#f0bfd8', '#d4c0ee', '#bfd8f0', '#f0e0b8', '#f2c7d2'] },
  { id: 'ash', label: 'ash', colors: ['#d8d3c9', '#c7c1b6', '#e2ddd3', '#c0bab0', '#d0cabf'] },
];

const paletteOf = (id) => (PALETTES.find((x) => x.id === id) || PALETTES[0]).colors;

// Deterministic per cell: the surface is identical every visit and stays put
// on the page, so moving the pointer explores it rather than dragging it.
const hash = (i, j) => {
  let n = i * 374761393 + j * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
};

const Backdrop = ({ mode = 'none', palette = 'sunrise' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let last = 0;

    // Target is where the pointer is; current trails it, which is what gives
    // every mode a bit of weight.
    const p = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    let sinceSpawn = 0; // px travelled since the last pointer-spawned ring

    let ripples = []; // { x, y, r, max, alpha }
    let drops = []; // { x, y, vy, len, ground }
    let grain = []; // { x, y, a, size }
    let lastScroll = -1;
    const scrolledSince = () => {
      const now = window.scrollY;
      if (now === lastScroll) return false;
      lastScroll = now;
      return true;
    };

    const rand = (a, b) => a + Math.random() * (b - a);

    const seedDrops = () => {
      const want = mode === 'rain' ? Math.round(w / 52) : 0;
      drops = [];
      for (let i = 0; i < want; i += 1) {
        drops.push({
          x: rand(0, w),
          y: rand(-h, h),
          vy: rand(0.34, 0.72),
          len: rand(7, 15),
          ground: rand(h * 0.1, h),
        });
      }
    };

    const seedGrain = () => {
      if (mode !== 'grain') {
        grain = [];
        return;
      }
      // Scattered rather than gridded — that's what makes it read as paper.
      const count = Math.min(4200, Math.round((w * h) / 460));
      grain = [];
      for (let i = 0; i < count; i += 1) {
        grain.push({
          x: rand(0, w),
          y: rand(0, h),
          a: rand(0.03, 0.12),
          size: Math.random() < 0.18 ? 2 : 1,
        });
      }
    };

    const addRipple = (x, y, max) => {
      if (ripples.length > 60) return;
      ripples.push({ x, y, r: 0, max, alpha: 1 });
    };

    // ── Renderers ────────────────────────────────────────────────

    // Every grid texture walks the same lattice: `s` is 0 far from the
    // pointer and 1 under it, `angle` points at it.
    const overGrid = (spacing, radius, fn) => {
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;

      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          const gx = i * spacing;
          const gy = j * spacing;
          let s = 0;
          let angle = 0;
          let dx = 0;
          let dy = 0;
          let d = 0;

          if (p.active) {
            dx = p.x - gx;
            dy = p.y - gy;
            d = Math.hypot(dx, dy);
            angle = Math.atan2(dy, dx);
            if (d < radius) s = (1 - d / radius) ** 2;
          }

          fn(gx, gy, s, angle, dx, dy, d);
        }
      }
    };

    const drawDots = () => {
      const PULL = 9;
      overGrid(30, 190, (gx, gy, s, angle, dx, dy, d) => {
        let x = gx;
        let y = gy;
        if (s > 0 && d > 0.001) {
          x += (dx / d) * PULL * s;
          y += (dy / d) * PULL * s;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${INK}, ${0.16 + s * 0.58})`;
        ctx.arc(x, y, (1 + s * 1.4) / 2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawRings = () => {
      ctx.lineWidth = 1;
      overGrid(32, 200, (x, y, s) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${INK}, ${0.1 + s * 0.34})`;
        ctx.arc(x, y, 1.4 + s * 5, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const drawCross = () => {
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';
      overGrid(34, 210, (x, y, s, angle) => {
        const len = 2.6 + s * 7;
        const turn = angle * s; // only the marks near the pointer swing round
        ctx.strokeStyle = `rgba(${INK}, ${0.1 + s * 0.4})`;
        for (let k = 0; k < 2; k += 1) {
          const t = turn + k * (Math.PI / 2);
          const cx = Math.cos(t) * len;
          const cy = Math.sin(t) * len;
          ctx.beginPath();
          ctx.moveTo(x - cx, y - cy);
          ctx.lineTo(x + cx, y + cy);
          ctx.stroke();
        }
      });
    };

    const drawDiamond = () => {
      overGrid(30, 190, (x, y, s, angle) => {
        const size = 1.5 + s * 4.5;
        ctx.fillStyle = `rgba(${INK}, ${0.13 + s * 0.45})`;
        if (s < 0.01) {
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
          return;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle * s + (Math.PI / 4) * s);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      });
    };

    const drawGrain = () => {
      const RADIUS = 170;
      for (const g of grain) {
        let a = g.a;
        let x = g.x;
        let y = g.y;

        if (p.active) {
          const dx = x - p.x;
          const dy = y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < RADIUS && d > 0.001) {
            const s = (1 - d / RADIUS) ** 2;
            a += s * 0.5;
            x += (dx / d) * s * 6;
            y += (dy / d) * s * 6;
          }
        }

        ctx.fillStyle = `rgba(${INK}, ${a})`;
        ctx.fillRect(x, y, g.size, g.size);
      }
    };

    const drawLines = () => {
      const SPACING = 38;
      const RADIUS = 240;
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;

      ctx.lineCap = 'round';

      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          const gx = i * SPACING;
          const gy = j * SPACING;

          let angle = 0;
          let s = 0;

          if (p.active) {
            const dx = p.x - gx;
            const dy = p.y - gy;
            const d = Math.hypot(dx, dy);
            angle = Math.atan2(dy, dx);
            if (d < RADIUS) s = (1 - d / RADIUS) ** 1.6;
          }

          const len = 6 + s * 9;
          const ax = Math.cos(angle) * len * 0.5;
          const ay = Math.sin(angle) * len * 0.5;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(${INK}, ${0.055 + s * 0.26})`;
          ctx.lineWidth = 1;
          ctx.moveTo(gx - ax, gy - ay);
          ctx.lineTo(gx + ax, gy + ay);
          ctx.stroke();
        }
      }
    };

    const stepRipples = (dt) => {
      ctx.lineWidth = 1;
      ripples = ripples.filter((rp) => {
        rp.r += dt * 0.16;
        rp.alpha = Math.max(0, 1 - rp.r / rp.max);
        if (rp.alpha <= 0) return false;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${INK}, ${rp.alpha * 0.24})`;
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();

        // A second, slower ring makes it read as water rather than a pulse.
        if (rp.r > 14) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${INK}, ${rp.alpha * 0.11})`;
          ctx.arc(rp.x, rp.y, rp.r * 0.62, 0, Math.PI * 2);
          ctx.stroke();
        }
        return true;
      });
    };

    const drawRain = (dt) => {
      ctx.lineCap = 'round';

      for (const d of drops) {
        // The pointer parts the rain as it passes.
        if (p.active) {
          const dx = d.x - p.x;
          const dy = d.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110 && dist > 0.001) {
            const push = (1 - dist / 110) ** 2 * 2.2;
            d.x += (dx / dist) * push;
          }
        }

        d.y += d.vy * dt;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${INK}, 0.15)`;
        ctx.lineWidth = 1;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.len);
        ctx.stroke();

        if (d.y >= d.ground) {
          addRipple(d.x, d.ground, rand(26, 52));
          d.x = rand(0, w);
          d.y = rand(-160, -20);
          d.vy = rand(0.34, 0.72);
          d.len = rand(7, 15);
          d.ground = rand(h * 0.1, h);
        }
      }

      stepRipples(dt);
    };

    const REVEAL = 110; // px, how far the pointer uncovers
    const CELL = 120; // px, the grain of the surface underneath

    const hexToRgb = (hex) => {
      const v = parseInt(hex.slice(1), 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    };

    const rgba = (hex, a) => {
      const [r, g, b] = hexToRgb(hex);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    };

    // One cell of the hidden surface, drawn in page coordinates.
    const drawCell = (i, j, colors, offsetY) => {
      const x = i * CELL;
      const y = j * CELL - offsetY;
      const a = hash(i, j);
      const b = hash(i + 7, j - 3);
      const c = hash(i - 5, j + 11);

      ctx.fillStyle = rgba(colors[Math.floor(a * colors.length)], 0.5);
      ctx.fillRect(x, y, CELL, CELL);

      const mark = colors[Math.floor(c * colors.length)];

      if (b > 0.68) {
        ctx.beginPath();
        ctx.fillStyle = rgba(mark, 0.55);
        ctx.arc(x + CELL / 2, y + CELL / 2, CELL * (0.18 + c * 0.2), 0, Math.PI * 2);
        ctx.fill();
      } else if (b > 0.46) {
        ctx.strokeStyle = rgba(mark, 0.5);
        ctx.lineWidth = 2 + c * 4;
        const step = CELL / 4;
        for (let k = -1; k < 4; k += 1) {
          ctx.beginPath();
          ctx.moveTo(x + k * step, y);
          ctx.lineTo(x + k * step + CELL, y + CELL);
          ctx.stroke();
        }
      } else if (b > 0.3) {
        ctx.fillStyle = rgba(mark, 0.45);
        ctx.fillRect(x, y + CELL * c * 0.5, CELL, CELL * 0.22);
      }
    };

    const drawGlow = () => {
      const x = p.active ? p.x : w / 2;
      const y = p.active ? p.y : h / 2;
      const offsetY = window.scrollY;

      // Only the cells the opening can actually show need drawing.
      const i0 = Math.floor((x - REVEAL) / CELL);
      const i1 = Math.floor((x + REVEAL) / CELL);
      const j0 = Math.floor((y + offsetY - REVEAL) / CELL);
      const j1 = Math.floor((y + offsetY + REVEAL) / CELL);
      const colors = paletteOf(palette);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x - REVEAL, y - REVEAL, REVEAL * 2, REVEAL * 2);
      ctx.clip();
      for (let i = i0; i <= i1; i += 1) {
        for (let j = j0; j <= j1; j += 1) drawCell(i, j, colors, offsetY);
      }
      ctx.restore();

      // Keep only what's under the opening, and keep it translucent.
      const mask = ctx.createRadialGradient(x, y, 0, x, y, REVEAL);
      mask.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      mask.addColorStop(0.55, 'rgba(0, 0, 0, 0.3)');
      mask.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    };

    // ── Loop ─────────────────────────────────────────────────────
    const render = (dt) => {
      ctx.clearRect(0, 0, w, h);
      if (mode === 'glow') drawGlow();
      else if (mode === 'dots') drawDots();
      else if (mode === 'rings') drawRings();
      else if (mode === 'cross') drawCross();
      else if (mode === 'diamond') drawDiamond();
      else if (mode === 'grain') drawGrain();
      else if (mode === 'lines') drawLines();
      else if (mode === 'ripple') stepRipples(dt);
      else if (mode === 'rain') drawRain(dt);
    };

    const busy = () =>
      mode === 'rain' ||
      (mode === 'glow' && scrolledSince()) ||
      ripples.length > 0 ||
      Math.abs(p.tx - p.x) > 0.4 ||
      Math.abs(p.ty - p.y) > 0.4;

    const step = (now) => {
      const dt = Math.min(48, now - (last || now));
      last = now;

      p.x += (p.tx - p.x) * 0.14;
      p.y += (p.ty - p.y) * 0.14;

      render(dt);

      if (busy() && !document.hidden) {
        raf = requestAnimationFrame(step);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (running || reduced || mode === 'none') return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(step);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedDrops();
      seedGrain();
      render(16);
      start();
    };

    const onMove = (e) => {
      if (!p.active) {
        p.x = e.clientX;
        p.y = e.clientY;
        p.active = true;
      }

      if (mode === 'ripple' || mode === 'rain') {
        sinceSpawn += Math.hypot(e.clientX - p.tx, e.clientY - p.ty);
        if (sinceSpawn > (mode === 'ripple' ? 58 : 120)) {
          sinceSpawn = 0;
          addRipple(e.clientX, e.clientY, mode === 'ripple' ? 150 : 60);
        }
      }

      p.tx = e.clientX;
      p.ty = e.clientY;
      start();
    };

    const onLeave = () => {
      p.active = false;
      start();
    };

    const onVisible = () => {
      if (!document.hidden) start();
    };

    const onScroll = () => {
      if (mode === 'glow') start();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisible);
    if (!reduced && mode !== 'none') {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [mode, palette]);

  return <canvas className="backdrop" ref={canvasRef} aria-hidden="true" />;
};

export default Backdrop;
