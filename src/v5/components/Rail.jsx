import React, { useCallback, useEffect, useRef, useState } from 'react';

// A tick for every sentence on the page — the rail is a small map of whatever
// you're reading. The ticks near the read position swell into a lens; hovering
// the rail moves that lens to your pointer and shows the sentence; clicking
// scrolls to it.
const ANCHOR = 140; // the sentence under this y is the "current" one
const BASE_W = 12; // px, a tick at rest
const PEAK_W = 32; // px, the tick at the centre of the lens
const LENS = 7; // how many ticks either side the lens reaches
const LABEL_MAX = 150; // characters
const MIN_SENTENCE = 14; // shorter fragments get folded into the previous one

// Blocks that read as one thing, however many elements they're built from.
const ATOMIC = '.row, .proj-head, .filters, .intro-links, .contact-links, .heat, .post-head';

// Floating chrome that happens to sit inside the measured subtree. Counting
// it would add phantom ticks, and its DOM churn would re-measure the rail
// (which drops the pointer's hover state mid-interaction).
const IGNORE = '.preview, .rail, [data-rail-ignore]';

const BLOCKISH = new Set(['block', 'flex', 'grid', 'list-item', 'table', 'flow-root']);

const isBlock = (el) => BLOCKISH.has(getComputedStyle(el).display);

// display:none, or clipped inside a collapsed container (an unopened project).
const isHidden = (el) => {
  if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return true;
  if (el.clientHeight === 0 && getComputedStyle(el).overflow === 'hidden') return true;
  return false;
};

const condense = (s) => s.replace(/\s+/g, ' ').trim();

const clip = (s) => (s.length > LABEL_MAX ? `${s.slice(0, LABEL_MAX).trimEnd()}…` : s);

// Split on sentence enders, keeping short trailing scraps attached.
const sentences = (text) => {
  // Don't require a capital after the full stop: the prose on this site is
  // set in lower case, so that lookahead matched nothing and every paragraph
  // collapsed into a single tick.
  const raw = text.split(/(?<=[.!?…])\s+(?=\S)/);
  const out = [];
  let at = 0;

  for (const piece of raw) {
    const start = text.indexOf(piece, at);
    at = start + piece.length;
    const prev = out[out.length - 1];
    if (prev && condense(piece).length < MIN_SENTENCE) prev.end = at;
    else out.push({ start, end: at });
  }
  return out.filter((s) => condense(text.slice(s.start, s.end)).length > 0);
};

// Flatten a block's text nodes so sentence offsets can be mapped back to
// a Range — a sentence often runs through an inline link. Text from separate
// child blocks is joined with a separator, otherwise a row reads as
// "UofT BlueprintSoftware Tech Lead".
const blockOf = (node) => {
  let el = node.parentElement;
  while (el && !BLOCKISH.has(getComputedStyle(el).display)) el = el.parentElement;
  return el;
};

const flatten = (block) => {
  const parts = [];
  let text = '';
  let lastBlock = null;

  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
  let node = walker.nextNode();
  while (node) {
    const value = node.nodeValue || '';
    if (value) {
      const owner = blockOf(node);
      if (lastBlock && owner !== lastBlock && text && !/\s$/.test(text)) text += ' · ';
      lastBlock = owner;
      parts.push({ node, start: text.length });
      text += value;
    }
    node = walker.nextNode();
  }
  return { text, parts };
};

const locate = (parts, offset) => {
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (offset >= parts[i].start) {
      return {
        node: parts[i].node,
        offset: Math.min(offset - parts[i].start, parts[i].node.nodeValue.length),
      };
    }
  }
  return { node: parts[0].node, offset: 0 };
};

const Rail = ({ resetKey }) => {
  const [units, setUnits] = useState([]);
  const [pitch, setPitch] = useState(3);
  const railRef = useRef(null);
  const tickRefs = useRef([]);
  const labelRef = useRef(null);
  const unitsRef = useRef([]);
  const signature = useRef('');
  const measureTimer = useRef(0);
  const pitchRef = useRef(3);
  const lensPos = useRef(null); // the lens centre currently drawn
  const hover = useRef(null); // fractional index under the pointer, or null
  const kick = useRef(() => {});

  unitsRef.current = units;
  pitchRef.current = pitch;

  // ── Collect one unit per sentence, heading, row or photo ───────
  const measure = useCallback(() => {
    const root = document.querySelector('.v5-main');
    if (!root) return;

    const scrollY = window.scrollY;
    const out = [];
    const range = document.createRange();

    const pushBlock = (el) => {
      if (el.tagName === 'IMG') {
        const r = el.getBoundingClientRect();
        if (r.height < 2) return;
        out.push({
          y: r.top + scrollY,
          label: el.alt ? `photo, ${el.alt}` : 'photo',
          kind: 'photo',
        });
        return;
      }

      const { text, parts } = flatten(el);
      if (!parts.length || !condense(text)) return;

      const weight = parseInt(getComputedStyle(el).fontWeight, 10);
      const head = /^H[1-4]$/.test(el.tagName) || weight >= 600;

      // An atomic block is one tick however long it is.
      const spans = el.matches(ATOMIC)
        ? [{ start: 0, end: text.length }]
        : sentences(text);

      for (const span of spans) {
        const label = condense(text.slice(span.start, span.end));
        if (!label) continue;

        const from = locate(parts, span.start);
        const to = locate(parts, span.end);
        range.setStart(from.node, from.offset);
        range.setEnd(to.node, to.offset);
        const rects = range.getClientRects();
        const r = rects[0];
        if (!r || r.height < 2) continue;

        out.push({ y: r.top + scrollY, label: clip(label), kind: head ? 'head' : 'text' });
      }
    };

    const visit = (el) => {
      if (el.matches(IGNORE) || isHidden(el)) return;
      if (el.matches(ATOMIC)) {
        pushBlock(el);
        return;
      }
      const kids = Array.from(el.children);
      if (!kids.some(isBlock)) {
        pushBlock(el);
        return;
      }
      kids.forEach(visit);
    };

    Array.from(root.children).forEach(visit);
    out.sort((a, b) => a.y - b.y);

    // Re-measuring runs on image loads and DOM changes; if nothing actually
    // moved, keep the existing array so React doesn't re-render the ticks
    // (which would strand the lens the loop had already drawn).
    const sig = `${out.length}|${out.map((u) => Math.round(u.y)).join(',')}`;
    if (sig === signature.current) return;
    signature.current = sig;

    if (labelRef.current) labelRef.current.dataset.i = '';
    setUnits(out);
    setPitch(Math.min(5, Math.max(1.6, (window.innerHeight * 0.72) / Math.max(out.length, 1))));
  }, []);

  const scheduleMeasure = useCallback(() => {
    clearTimeout(measureTimer.current);
    measureTimer.current = setTimeout(measure, 140);
  }, [measure]);

  useEffect(() => {
    const root = document.querySelector('.v5-main');
    signature.current = '';
    lensPos.current = null; // a new page starts the lens where the page starts
    measure();

    document.fonts?.ready?.then(measure).catch(() => {});
    window.addEventListener('resize', scheduleMeasure);

    // Image loads only matter when they move text, which always changes the
    // page height — our images all carry their own box. Without this guard
    // a page of lazy-loaded photos re-measures once per photo as you scroll,
    // and every pass walks the whole document with Ranges.
    let lastHeight = document.documentElement.scrollHeight;
    const onLoad = () => {
      const h = document.documentElement.scrollHeight;
      if (h === lastHeight) return;
      lastHeight = h;
      scheduleMeasure();
    };
    root?.addEventListener('load', onLoad, true);

    // childList only: the scroll-reveal classes don't change layout, so
    // watching attributes would re-measure on every scroll.
    const mo = new MutationObserver(scheduleMeasure);
    if (root) mo.observe(root, { childList: true, subtree: true });

    // A project row opening or closing does change layout. Debounced like
    // the rest: a full pass walks the tab with Ranges and computed styles,
    // and the row's own transition is still settling when this fires.
    const onTransitionEnd = (e) => {
      if (e.propertyName === 'grid-template-rows') scheduleMeasure();
    };
    root?.addEventListener('transitionend', onTransitionEnd);

    return () => {
      clearTimeout(measureTimer.current);
      window.removeEventListener('resize', scheduleMeasure);
      root?.removeEventListener('load', onLoad, true);
      root?.removeEventListener('transitionend', onTransitionEnd);
      mo.disconnect();
    };
  }, [measure, scheduleMeasure, resetKey]);

  // ── Paint: the lens follows the scroll position, or the pointer while
  //    the rail is hovered, and eases between the two. ──────────────
  useEffect(() => {
    let raf = 0;
    let running = false;

    const fromScroll = (all) => {
      const anchor = window.scrollY + ANCHOR;
      let hi = 0;
      while (hi < all.length && all[hi].y < anchor) hi += 1;
      hi = Math.min(hi, all.length - 1);
      const lo = Math.max(0, hi - 1);
      const gap = all[hi].y - all[lo].y || 1;
      return Math.max(0, Math.min(all.length - 1, lo + (anchor - all[lo].y) / gap));
    };

    // Every tick is repainted, so a lens left over from a previous pass can
    // never survive — that's what used to leave two bulges on the rail.
    const applyLens = (all, centre, selected) => {
      const cur = selected ?? Math.round(centre);
      for (let i = 0; i < all.length; i += 1) {
        const el = tickRefs.current[i];
        if (!el) continue;

        const d = Math.abs(i - centre);
        const t = d >= LENS ? 0 : (1 - d / LENS) ** 2;
        // Scaled, not resized. A tick is a solid block anchored at its left
        // edge, so scaleX looks identical to growing its width — but width
        // is a layout property and this runs on every tick in the lens,
        // every frame, for the whole length of a scroll.
        const scale = `scaleX(${((BASE_W + (PEAK_W - BASE_W) * t) / BASE_W).toFixed(3)})`;
        if (el.style.transform !== scale) el.style.transform = scale;

        const state = i === cur ? 'cur' : t > 0.02 ? 'near' : 'out';
        if (el.dataset.state !== state) el.dataset.state = state;
      }
    };

    const step = () => {
      const all = unitsRef.current;
      if (!all.length) return false;

      const hovering = hover.current !== null;
      const target = hovering ? hover.current : fromScroll(all);

      if (lensPos.current === null) lensPos.current = target; // no easing in
      const delta = target - lensPos.current;
      // Track the pointer more closely than the scroll position, so the lens
      // doesn't trail behind what you're pointing at.
      lensPos.current += delta * (hovering ? 0.45 : 0.3);
      if (Math.abs(delta) < 0.01) lensPos.current = target;

      // While hovering, the marked tick is the one being read out — never the
      // eased centre, which would lag a frame or two behind the label.
      applyLens(all, lensPos.current, hovering ? Math.round(hover.current) : null);
      return Math.abs(target - lensPos.current) > 0.01;
    };

    kick.current = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(function frame() {
        if (step()) raf = requestAnimationFrame(frame);
        else running = false;
      });
    };

    step();

    // Hover is decided by coordinates against the rail's box, not by event
    // targets. Re-measuring re-renders the ticks, and the browser then fires
    // leave/enter events for a pointer that never moved — hit-testing the box
    // directly is immune to that.
    // Measured lazily and kept: the rail is fixed, so its box only moves
    // when the window resizes or the tick count changes — and a new tick
    // count re-runs this effect, which starts the cache empty again.
    let box = null;
    const railBox = () => {
      if (!box) box = railRef.current?.getBoundingClientRect() || null;
      return box;
    };
    const forgetBox = () => {
      box = null;
    };

    const showLabel = (i) => {
      const label = labelRef.current;
      if (!label) return;
      if (label.dataset.i !== String(i)) {
        label.dataset.i = String(i);
        label.textContent = unitsRef.current[i]?.label || '';
        label.style.top = `${i * pitchRef.current}px`;
      }
      label.dataset.on = 'true';
    };

    const release = () => {
      if (railRef.current) railRef.current.dataset.hover = 'false';
      if (labelRef.current) labelRef.current.dataset.on = 'false';
      if (hover.current === null) return;
      hover.current = null;
      kick.current();
    };

    const onWindowMove = (e) => {
      const box = railBox();
      const inside =
        box &&
        e.clientX >= box.left &&
        e.clientX <= box.right &&
        e.clientY >= box.top &&
        e.clientY <= box.bottom;

      if (!inside) {
        release();
        return;
      }

      const count = unitsRef.current.length;
      if (!count) return;

      const pos = Math.max(0, Math.min(count - 1, (e.clientY - box.top) / pitchRef.current));
      hover.current = pos;
      railRef.current.dataset.hover = 'true';
      showLabel(Math.round(pos));
      kick.current();
    };

    const onScroll = () => kick.current();
    const onResize = () => {
      forgetBox();
      kick.current();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onWindowMove, { passive: true });
    window.addEventListener('blur', release);
    document.addEventListener('pointerleave', release);
    return () => {
      cancelAnimationFrame(raf);
      running = false;
      kick.current = () => {};
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('blur', release);
      document.removeEventListener('pointerleave', release);
    };
  }, [units]);

  // ── Click: jump to the unit under the pointer ───────────────────
  const onClick = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(
      Math.max(0, Math.min(units.length - 1, (e.clientY - box.top) / pitch))
    );
    const unit = units[i];
    if (!unit) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, unit.y - ANCHOR), behavior: reduced ? 'auto' : 'smooth' });
  };

  if (!units.length) return null;

  return (
    <div
      className="rail"
      ref={railRef}
      data-hover="false"
      style={{ height: `${units.length * pitch}px` }}
      onClick={onClick}
      role="presentation"
    >
      {units.map((unit, i) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          ref={(el) => {
            tickRefs.current[i] = el;
          }}
          className="rail-tick"
          data-head={unit.kind === 'head' ? 'true' : undefined}
          data-photo={unit.kind === 'photo' ? 'true' : undefined}
          data-state="out"
          style={{
            top: `${i * pitch}px`,
            height: `${Math.max(1, Math.min(2, pitch * 0.42)).toFixed(2)}px`,
            width: `${BASE_W}px`,
          }}
        />
      ))}
      <span className="rail-label" ref={labelRef} data-on="false" />
    </div>
  );
};

export default Rail;
