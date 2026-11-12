import React, { useEffect, useRef, useState } from 'react';

// The pointer. Every design reacts to the same states, so the vocabulary is
// consistent whichever one you pick:
//
//   default  nothing under you
//   link     something to click
//   row      a blog entry — the box is the whole entry, open or shut
//   zoom     a photo that opens full size  (+)
//   scroll   the rail, which moves vertically
//   anchor   a text link — the circle flattens into its underline
//   text     a passage to read
//   bare     the page answers for itself here, so the pointer stands down
//   picture  a project preview is up — the pointer becomes its frame
//   down     the button is held

export const POINTERS = [
  { id: 'ring', label: 'ring' },
  { id: 'square', label: 'square' },
  { id: 'frame', label: 'frame' },
  { id: 'dotted', label: 'dotted' },
  { id: 'off', label: 'system' },
];

// First match wins, so specific targets come before general ones.
const TARGETS = [
  { sel: '.rail', state: 'scroll' },
  // The heatmap lights a circle of colour around the pointer, so a ring
  // drawn at the same place is a second circle chasing the first. The
  // pointer stands down to its dot and lets the grid be the pointer.
  { sel: '.heat-stack', state: 'bare' },
  { sel: '.preview', state: 'zoom' },
  // A work option answers the pointer itself — a highlighter stroke
  // draws in behind it — so a box drawn round it would be a second answer.
  { sel: '.wx-word', state: 'bare' },
  // A project row is boxed as a whole, the same as a blog entry: `box` is
  // the `.proj`, so the box lands on the dividers between rows and takes in
  // the description when one is opened. Ahead of the catch-all below, which
  // is a button and would box the head alone. While the screenshot is up it
  // never gets this far — a preview under the pointer owns the state.
  { sel: '.proj-head', state: 'row', box: '.proj' },
  // A text link is underlined rather than boxed, so it gets its own state.
  // Also ahead of the catch-all, which would match the anchor first.
  { sel: 'a.link', state: 'anchor' },
  // A blog entry is boxed as a whole — the <article>, not the button inside
  // it — so the box lands on the dividers that separate the entries and
  // grows to take in the body when one is opened. Its own controls come
  // first; everything else in there defers to the entry.
  // The photos button already wears an outline, so the circle doesn't open
  // a box around it — it becomes it. Same shape, and a pad of nothing, so
  // the ring lands exactly on the button's own border and the two are one
  // line. Ahead of `.post` so it answers for itself rather than deferring
  // to the entry around it.
  { sel: '.photos-btn', state: 'pill' },
  { sel: '.post', state: 'row' },
  // An open blog entry is one object: the headline, the photos and the
  // write-up. Pointing at the headline wraps the whole entry rather than
  // the row you would click to close it. `box` is what gets wrapped; the
  // selector stays on the head so reading the body still gets a caret.
  { sel: '.post[data-open="true"] .post-head', state: 'link', box: '.post' },
  // The note's own controls answer for themselves, ahead of the two rules
  // below that would otherwise swallow them.
  { sel: '.note-tool, .note-ok, .note-undo', state: 'link' },
  // The note is dragged by its head, so that strip hands the window back
  // its own cursor (grab/grabbing) the way the rail does.
  { sel: '.note-head', state: 'scroll' },
  // Writing on it: no box, and no caret of ours either. The field has a
  // real caret of its own while it is focused, blinking where the next
  // character lands, and a second bar drawn at the mouse is a second
  // cursor on screen, the pointer stands down the way it does over a
  // heatmap. Ahead of the `.note` rule below, so the box doesn't come
  // back over the sheet while somebody is writing on it.
  { sel: '.note-body:focus', state: 'bare' },
  // Everything else on the note is the note: the ring opens into a box
  // around the whole sheet rather than around the line under the pointer.
  // `row` rather than `link` so a click inside — which is a caret being
  // placed, not a thing being activated — does not latch the box. Its pad
  // is even and tight: a row's default pads 24 sideways and nothing at all
  // top to bottom, which is right for a list row sitting on its dividers
  // and wrong for a sheet of paper, where it reads as a box that has
  // slipped off the thing it is wrapping.
  // Ahead of the `text` rule below, which would put a caret on every line.
  { sel: '.note', state: 'row', pad: [7, 7] },
  // Inside the cursor box the pointer is the thing being chosen, not a thing
  // to point at. Wrapping a box around a 44px hit area holding a 24px shape
  // is the pointer talking over the one control whose whole job is to show
  // you pointers. It stays its resting shape in there. Ahead of the
  // catch-all below, which would read the shapes as the buttons they are.
  { sel: '.bed', state: 'default' },
  { sel: 'a, button, [role="button"], .filter, .fx-toggle', state: 'link' },
  // `.row-main` rather than the lines inside it: the role, the company and
  // the note are one passage, and listing them separately left the caret on
  // some lines of a row and not others.
  { sel: 'p, figcaption, .row-main, .post-aside, li', state: 'text' },
];

const TEXT_SLACK = 2; // px of grace around a line before the caret gives up

// Whether the pointer is on the words rather than merely inside the box that
// holds them. A block stretches the full column however short its text is —
// `.row-main` is the whole middle of a row — so testing the element's own
// rect puts a caret in the empty half of every line. Text nodes report one
// tight rect per line, which is the shape a reader actually sees.
const onWords = (el, x, y) => {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    if (!node.nodeValue.trim()) continue;
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (
        x >= r.left - TEXT_SLACK &&
        x <= r.right + TEXT_SLACK &&
        y >= r.top - TEXT_SLACK &&
        y <= r.bottom + TEXT_SLACK
      ) {
        return true;
      }
    }
  }
  return false;
};

const BASE = 28; // px, the resting size
const SQUARE_MS = 65; // square off first, then grow — morphing while
                      // growing reads as a rounded rectangle in between
const PICTURE_MS = 30; // ...but a screenshot is a far bigger jump than a link,
                       // so the same beat there reads as a stall before it
                       // opens. Just enough to square the corners.

// A critically damped spring, not a plain lerp. A lerp leaves at full speed
// and then crawls the last few pixels, which is what reads as snappy and
// slow at the same time; a spring eases out of rest and settles into place.
// Stiffness is per 60fps frame, damping is 2·√k — the no-overshoot point.
// Size is stiffer than position, so the shape resolves before it finishes
// travelling.
// `press` is the soft one: collapsing back to the circle under your thumb is
// a settling-down, not a snap, so it gets roughly twice the travel time.
const SPRING = { pos: 0.5, size: 0.58, press: 0.16 };
const DAMP = {
  pos: 2 * Math.sqrt(0.5),
  size: 2 * Math.sqrt(0.58),
  press: 2 * Math.sqrt(0.16),
};

// Which states make the pointer let go of the cursor and wrap the element
// under it instead. Only things you can actually click: a passage of text
// keeps its caret. The pad is [x, y] breathing room in px, and a target in
// TARGETS can override it with a `pad` of its own.
// Every design latches — the vocabulary is the point, and a design that
// only ever sat under your hand would be a worse pointer wearing the same
// name. What differs is the shape each one takes on arrival, not whether it
// goes.
const LATCH = {
  frame: { link: [16, 12], row: [24, 0], zoom: [16, 12], anchor: [10, 6], pill: [0, 0] },
  // The square never changes shape, only size, so it cannot take a pill's
  // outline the way the ring does — a square drawn exactly on a stadium is
  // two different shapes sharing an edge. It wraps the button instead, with
  // enough room that it reads as a box holding a pill rather than a failed
  // attempt at being one.
  square: { link: [18, 12], row: [24, 0], anchor: [9, 7], zoom: [14, 14], pill: [11, 9] },
  // `dotted` is the ring with a different stroke, so it wants the ring's
  // pads exactly. Anything else and the two would answer the same button at
  // two different sizes, which is the one thing they must not do.
  dotted: { link: [18, 12], row: [24, 0], anchor: [9, 7], zoom: [14, 14], pill: [0, 0] },
  // An anchor's pad is tight and bottom-weighted: the line wants to sit just
  // under the words and reach a little past them, not ring them.
  // A row pads sideways but not vertically: its top and bottom are the
  // divider lines and the box is meant to sit on them, while the left and
  // right want air so the text isn't pressed against the border.
  // A pill is not wrapped at all: the ring takes the button's own outline,
  // to the pixel. Any pad and you get two stadiums a few px apart, which
  // reads as a box around a pill rather than the pointer having become it.
  ring: { link: [18, 12], row: [24, 0], anchor: [9, 7], zoom: [14, 14], pill: [0, 0] },
};

const Cursor = ({ mode = 'ring' }) => {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const glyphRef = useRef(null);
  // Touch devices never get a pointer layer. Rendering it anyway parked two
  // elements at the page origin with their left halves off the edge, which
  // is enough to give a narrow phone a horizontal scrollbar.
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: fine)');
    if (!mq) return undefined;
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    // `fine` gates the markup, so this has to wait for it: on the first
    // render there is nothing to hang the pointer on, and without `fine` in
    // the deps below this effect would run once against a null ref, bail,
    // and never be asked again — the pointer elements would be in the page
    // with nothing driving them.
    if (mode === 'off' || !fine) return undefined;

    const root = rootRef.current;
    const dot = dotRef.current;
    const glyph = glyphRef.current;
    if (!root) return undefined;

    document.documentElement.classList.add('has-cursor');

    const want = { x: window.innerWidth / 2, y: window.innerHeight / 2, w: BASE, h: BASE };
    const at = { ...want };
    let raf = 0;
    let running = false;
    let state = 'default';
    let latched = null; // element the pointer is currently wrapped around
    let latchPad = [0, 0];
    let squaredAt = 0; // when the current latch started squaring off
    let locked = false; // frame has caught the picture and now rides with it
    let held = false; // the button is down
    let clicked = null; // what was last clicked: stays a circle until you leave
    let px = 0; // last pointer position, for re-aiming without a move event
    let py = 0;
    let aimed = false; // true once the pointer has been seen at least once
    const vel = { x: 0, y: 0, w: 0, h: 0 };
    let last = 0;

    // While a project preview is showing, the pointer stops being a pointer
    // and becomes the picture's frame.
    const previewBox = () => {
      const el = document.querySelector('.preview[data-on="true"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width <= 2) return null;

      // ...but only while the pointer is still on the list that carries it.
      // A picture that has been left behind — a list that stopped tracking,
      // a preview that missed its chance to clear — is not the pointer's
      // business, and following it is unrecoverable: every move hands the
      // state straight back to the picture, so the ring stays parked out
      // there, the hand keeps only the dot, and nothing hovers again until
      // the page is reloaded. Ask where the pointer actually is rather than
      // how far the picture has drifted: the picture trails the hand by
      // design, so distance alone says nothing about whether it is live.
      if (aimed && !document.elementFromPoint(px, py)?.closest?.('.proj')) return null;
      return r;
    };

    const frame = (now) => {
      // Elapsed time in 60fps frames, so the spring settles in the same wall
      // time whatever the refresh rate. Capped at four: coming back to a
      // backgrounded tab should resume, not replay the whole gap.
      const elapsed = last ? Math.min((now - last) / 16.667, 4) : 1;
      last = now;
      // Then walked in steps no larger than one frame. This integrator goes
      // unstable past a step of about 1.17 frames at this stiffness, and the
      // step used to be clamped to 1.2 — just the wrong side of the line. Any
      // display under ~50fps pinned it there every frame and the spring
      // diverged: the ring reached the pointer, sailed straight through it
      // and accelerated off the screen, never to return. Sub-stepping costs a
      // little arithmetic on a slow frame instead of the whole animation.
      const steps = Math.max(1, Math.ceil(elapsed));
      const dt = elapsed / steps;

      let moving = false;
      let holding = false; // sitting out the squaring beat — keep ticking

      // Held: the pointer is a plain circle under your hand, nothing else.
      const shot = held ? null : previewBox();
      if (shot) {
        // The picture trails the pointer on its own easing, so it is never
        // still: keep ticking whatever the spring thinks.
        holding = true;
        // Same beat as a fresh latch: square off small, then open out to the
        // picture. Growing and morphing at once reads as a rounded rectangle.
        if (state !== 'picture') squaredAt = performance.now();
        if (performance.now() - squaredAt < PICTURE_MS) {
          locked = false;
        } else {
          want.x = shot.left + shot.width / 2;
          want.y = shot.top + shot.height / 2;
          want.w = shot.width + 10;
          want.h = shot.height + 10;

          // Spring onto the picture once, then ride it exactly. Springing at
          // a target that is itself still moving leaves the frame trailing
          // the image for as long as you keep moving, which is the part that
          // looks broken. Once caught, the frame just is the picture's edge
          // and inherits its easing.
          if (locked) {
            for (const k of ['x', 'y', 'w', 'h']) {
              at[k] = want[k];
              vel[k] = 0;
            }
          } else if (['x', 'y', 'w', 'h'].every((k) => Math.abs(want[k] - at[k]) < 2)) {
            locked = true;
          }
        }
        setState('picture');
      } else if (state === 'picture') {
        locked = false;
        setState('default');
      } else if (latched && !held) {
        // Read the box fresh each tick — it has to stay put while the page
        // scrolls under it.
        const box = latched.getBoundingClientRect();
        // The beat exists so the ring can resolve its corners before it
        // travels. Only the ring and the frame have anything to resolve;
        // for a design that is already the shape it will be, the same pause
        // is just a stall before the pointer agrees to move.
        const beat = mode === 'ring' || mode === 'frame' ? SQUARE_MS : 0;
        const squaring = performance.now() - squaredAt < beat;

        // Belt and braces for the scroll re-aim: anything that moves the box
        // out from under the pointer — a row opening, a filter re-rendering
        // the list — lets it go rather than towing the ring along behind it.
        if (
          aimed &&
          (px < box.left - latchPad[0] ||
            px > box.right + latchPad[0] ||
            py < box.top - latchPad[1] ||
            py > box.bottom + latchPad[1])
        ) {
          latched = null;
          want.x = px;
          want.y = py;
          want.w = BASE;
          want.h = BASE;
          setState('default');
        } else if (box.width < 2) {
          // nothing to wrap
        } else if (state === 'anchor') {
          // A line is held by its left end, not its middle, so it draws out
          // the way an underline is written. Travel there first, still
          // short: stretching and sliding at the same time is what reads as
          // growing from the middle.
          want.x = box.left - latchPad[0] / 2;
          want.y = box.top + box.height / 2;
          want.h = box.height + latchPad[1];
          if (squaring || Math.abs(want.x - at.x) > 2) holding = true;
          else want.w = box.width + latchPad[0];
        } else if (squaring) {
          // Square off before moving: for one beat the pointer stays a small
          // shape under your hand and only its corners change. Growing and
          // morphing at once is what reads as clipped.
          holding = true;
        } else {
          want.x = box.left + box.width / 2;
          want.y = box.top + box.height / 2;
          want.w = box.width + latchPad[0];
          want.h = box.height + latchPad[1];
        }
      }
      for (let s = 0; s < steps; s += 1) {
        for (const k of ['x', 'y', 'w', 'h']) {
          const axis = held ? 'press' : k === 'x' || k === 'y' ? 'pos' : 'size';
          const d = want[k] - at[k];
          vel[k] += (d * SPRING[axis] - vel[k] * DAMP[axis]) * dt;
          at[k] += vel[k] * dt;
        }
      }
      // Asked once, of where the spring actually ended up.
      for (const k of ['x', 'y', 'w', 'h']) {
        if (Math.abs(want[k] - at[k]) > 0.3 || Math.abs(vel[k]) > 0.3) moving = true;
      }

      root.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0)`;
      root.style.setProperty('--w', `${at.w.toFixed(1)}px`);
      root.style.setProperty('--h', `${at.h.toFixed(1)}px`);

      if (moving || holding) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        last = 0;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const setState = (next, mark) => {
      if (next !== state) {
        state = next;
        root.dataset.state = next;
      }
      if (glyph && glyph.textContent !== (mark || '')) glyph.textContent = mark || '';
    };

    // What the pointer is over, resolved from an element. Split out of the
    // move handler because scrolling changes the answer without the pointer
    // ever moving.
    const aim = (el) => {
      want.x = px;
      want.y = py;
      want.w = BASE;
      want.h = BASE;

      // A picture under the pointer owns the state, and frame() drives it.
      // Otherwise every move would knock the pointer back to the row's own
      // state, frame() would read that as a fresh entry and restart the
      // morph, and the frame would never finish opening out while you move
      // along the title — which is exactly what reads as the pointer not
      // knowing whether it belongs on the name or on the picture. Ask the
      // DOM rather than caching the answer: StrictMode runs this effect
      // twice, and a flag written by one copy is stale in the other.
      if (!held && previewBox()) {
        latched = null;
        start();
        return;
      }

      let next = 'default';
      let mark = '';
      let hit = null;
      let hitPad = null;

      if (el?.closest) {
        for (const t of TARGETS) {
          const found = el.closest(t.sel);
          if (!found) continue;
          // A caret is a promise that there is something to read here, so it
          // waits until the pointer is actually on the words. Falling through
          // rather than stopping lets a wider target still answer. `always`
          // opts out, for a target whose empty space is still the target.
          if (t.state === 'text' && !t.always && !onWords(found, px, py)) continue;
          hit = t.box ? found.closest(t.box) || found : found;
          hitPad = t.pad || null;
          next = t.state;
          if (t.state === 'zoom') mark = '+';
          break;
        }
      }

      // Latch onto the thing you're pointing at, if this design does that
      // for this state. frame() eases the box out from wherever the pointer
      // left off, so the shape morphs rather than cutting.
      // Nothing latches while the button is down.
      if (!held) {
        // A target's own pad wins over the state's, for anything whose
        // shape the state's default was not chosen for.
        const pad = hit ? hitPad || LATCH[mode]?.[next] : null;
        let nextLatch = pad ? hit : null;

        // Having clicked a thing, the pointer stays the circle it collapsed
        // to rather than popping back open over what you just pressed. Move
        // to anything else — or off it and back — and it opens out again.
        if (nextLatch && nextLatch === clicked) nextLatch = null;
        else clicked = null;
        root.dataset.quiet = clicked ? 'true' : 'false';

        // Only a fresh latch squares off. Sliding from one link straight to
        // the next is already square, so it tracks across without the beat.
        if (nextLatch && !latched) squaredAt = performance.now();
        latched = nextLatch;
        latchPad = nextLatch ? pad : [0, 0];
      }

      setState(next, mark);
    };

    // Resolving what's under the pointer costs a hit test, a walk up the
    // tree against every selector in TARGETS, and — over prose — a Range
    // per line of the block. A fast mouse reports several moves per frame
    // and a scroll fires as fast as it can; the answer can only be drawn
    // once a frame either way, so it is worked out once a frame too. The
    // dot is written on the event itself and never waits for this.
    let aimRaf = 0;
    const queueAim = () => {
      if (aimRaf) return;
      aimRaf = requestAnimationFrame(() => {
        aimRaf = 0;
        // Asked at the latest position rather than carrying a stale
        // event.target: by now the pointer may have moved on.
        aim(document.elementFromPoint(px, py));
      });
    };

    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;

      // First sighting. The spring starts at the middle of the window because
      // on load there is nowhere better to put it — but easing in from there
      // reads as a ring flying at you out of the centre of the page. Begin it
      // under the pointer instead, where it would have been all along.
      if (!aimed) {
        at.x = want.x = px;
        at.y = want.y = py;
        vel.x = 0;
        vel.y = 0;
      }
      aimed = true;

      // The dot never lags — it is the pointer.
      if (dot) {
        dot.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        dot.dataset.on = 'true';
      }
      root.dataset.on = 'true';

      queueAim();
      start();
    };

    // The page moves under a stationary pointer, so what it is over changes
    // with no pointermove to say so. Without this the ring keeps riding the
    // element it latched onto as that element scrolls away, while the dot
    // stays under your hand — the pointer appears to split in two and one
    // half runs off across the page.
    const onScroll = () => {
      if (aimed) queueAim();
      start();
    };

    const onDown = () => {
      held = true;
      // Rows are the exception to staying a circle after a press: clicking
      // one opens it, and the box should take in what it just opened rather
      // than collapsing out of the way of it.
      clicked = state === 'row' ? null : latched;
      root.classList.add('is-down');
      // Come back to the hand as a circle rather than scaling the box up.
      want.x = px;
      want.y = py;
      want.w = BASE;
      want.h = BASE;
      locked = false;
      start();
    };

    const onUp = () => {
      held = false;
      root.classList.remove('is-down');
      // Let go and it stays the circle it became — `clicked` keeps it that
      // way until the pointer moves somewhere else. Set the flag here too:
      // releasing without moving fires no pointermove to set it.
      latched = null;
      root.dataset.quiet = clicked ? 'true' : 'false';
      start();
    };
    const onLeave = () => {
      root.dataset.on = 'false';
      if (dot) dot.dataset.on = 'false';
    };
    const onEnter = () => {
      root.dataset.on = 'true';
      if (dot) dot.dataset.on = 'true';
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(aimRaf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
    };
  }, [mode, fine]);

  if (mode === 'off' || !fine) return null;

  return (
    <>
      <div
        className="cursor"
        ref={rootRef}
        data-mode={mode}
        data-state="default"
        data-on="false"
        aria-hidden="true"
      >
        <span className="cursor-ring" />
        <span className="cursor-corner c-tl" />
        <span className="cursor-corner c-tr" />
        <span className="cursor-corner c-bl" />
        <span className="cursor-corner c-br" />
        <span className="cursor-glyph" ref={glyphRef} />
      </div>
      {/* Off until the pointer is first seen. `has-cursor` hides the real
          cursor the moment this mounts, and the dot has no transform yet, so
          starting it on left a visible dot parked in the top-left corner
          while the actual pointer was nowhere. */}
      <div className="cursor-dot" ref={dotRef} data-mode={mode} data-on="false" aria-hidden="true" />
    </>
  );
};

export default Cursor;
