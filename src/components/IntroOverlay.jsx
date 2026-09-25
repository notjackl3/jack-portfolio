import React, { useEffect, useRef, useState } from 'react';

// Greeting shown once per page load: the page fades / blurs behind it, the note
// types itself out, rests for a beat, then the whole thing fades away. Clicking
// anywhere (or Escape) skips ahead.
const HEADING = 'HEY THERE';
const LINES = [
  "Hey, nice to meet you at the Fall career fair.",
  "I'm looking for a winter/summer internship.",
  "Let's stay in touch."
];

const FADE_OUT_MS = 1400; // keep in sync with .intro-overlay--leaving
const HOLD_AFTER_TYPING_MS = 2000; // let the finished note sit before it leaves
const TYPE_START_MS = 650; // let the heading land before the typing starts
const CHAR_MS = 26;
const LINE_PAUSE_MS = 280;

const CHARS_TOTAL = LINES.reduce((total, line) => total + line.length, 0);
// Timestamp (ms after mount) at which each character lands, with a small pause
// between lines. Driving the typing off elapsed time rather than a chain of
// timeouts keeps it correct if the tab is backgrounded and timers are throttled.
const CHAR_TIMES = (() => {
  const times = [];
  let t = TYPE_START_MS;
  LINES.forEach((line, lineIndex) => {
    for (let i = 0; i < line.length; i += 1) {
      t += CHAR_MS;
      times.push(t);
    }
    if (lineIndex < LINES.length - 1) t += LINE_PAUSE_MS;
  });
  return times;
})();
const typedCountAt = (elapsed) => {
  let count = 0;
  while (count < CHAR_TIMES.length && CHAR_TIMES[count] <= elapsed) count += 1;
  return count;
};
const TYPING_END_MS = CHAR_TIMES[CHAR_TIMES.length - 1];
// Derived so the hold stays 2s no matter how the copy or typing speed changes.
const INTRO_TOTAL_MS = TYPING_END_MS + HOLD_AFTER_TYPING_MS + FADE_OUT_MS;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const IntroOverlay = () => {
  // 'enter' → 'visible' → 'leaving' → 'gone' (unmounted)
  const [phase, setPhase] = useState('enter');
  const [typed, setTyped] = useState(0);
  // Hold everything until the page is actually on screen, so a site opened in a
  // background tab still gets the greeting when it is first looked at.
  const [started, setStarted] = useState(() => typeof document === 'undefined' || !document.hidden);
  const leaveTimer = useRef(null);

  useEffect(() => {
    if (started) return undefined;
    const onVisibility = () => {
      if (!document.hidden) setStarted(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [started]);

  // Kick the fade-in on the frame after mount so the transition actually runs.
  useEffect(() => {
    if (!started) return undefined;
    const raf = requestAnimationFrame(() => setPhase('visible'));
    return () => cancelAnimationFrame(raf);
  }, [started]);

  // Type the note out one character at a time (instant when motion is reduced).
  useEffect(() => {
    if (!started) return undefined;
    if (prefersReducedMotion()) {
      setTyped(CHARS_TOTAL);
      return undefined;
    }
    const start = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const count = typedCountAt(now - start);
      setTyped(count);
      if (count < CHARS_TOTAL) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [started]);

  // Auto-dismiss: start the fade-out so the whole thing is gone at INTRO_TOTAL_MS.
  useEffect(() => {
    if (!started) return undefined;
    const timer = setTimeout(() => setPhase('leaving'), INTRO_TOTAL_MS - FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [started]);

  // Once leaving, unmount after the transition so the page is fully interactive.
  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    leaveTimer.current = setTimeout(() => setPhase('gone'), FADE_OUT_MS);
    return () => clearTimeout(leaveTimer.current);
  }, [phase]);

  const dismiss = () =>
    setPhase((prev) => (prev === 'leaving' || prev === 'gone' ? prev : 'leaving'));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (phase === 'gone') return null;

  // How much of each line is visible, derived from the single typed counter.
  let budget = typed;
  const visibleCounts = LINES.map((line) => {
    const shown = Math.max(0, Math.min(line.length, budget));
    budget -= line.length;
    return shown;
  });
  const activeLine = visibleCounts.findIndex((shown, i) => shown < LINES[i].length);
  const caretLine = activeLine === -1 ? LINES.length - 1 : activeLine;

  return (
    <div
      className={`intro-overlay intro-overlay--${phase}`}
      role="dialog"
      aria-label={`${HEADING}. ${LINES.join(' ')}`}
      onClick={dismiss}
    >
      <div className="intro-overlay-card" aria-hidden="true">
        <p className="intro-overlay-heading">{HEADING}</p>
        <div className="intro-overlay-lines">
          {LINES.map((line, i) => (
            <p className="intro-overlay-line" key={line}>
              {/* Ghost copy reserves the wrapped height so nothing shifts while typing. */}
              <span className="intro-overlay-line-ghost">{line}</span>
              <span className="intro-overlay-line-typed">
                {line.slice(0, visibleCounts[i])}
                {i === caretLine ? <span className="intro-overlay-caret" /> : null}
              </span>
            </p>
          ))}
        </div>
        <button type="button" className="intro-overlay-skip" onClick={dismiss}>
          <span className="intro-overlay-skip-pointer">click anywhere to skip</span>
          <span className="intro-overlay-skip-touch">tap anywhere to skip</span>
        </button>
      </div>
    </div>
  );
};

export default IntroOverlay;
