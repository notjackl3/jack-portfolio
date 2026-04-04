import { useEffect, useRef } from 'react';
import { hackathons } from '../data/hackathons';

const WHEEL_THRESHOLD = 55;
const RECEDE_MS       = 160;
const EMERGE_MS       = 310;
const COMMIT_DELAY    = 380;   // ms after scroll stops → show card
const SLOT_DEG        = 360 / hackathons.length;

const wheelAngle = (n) => 270 - n * SLOT_DEG;

const HackathonsSection = () => {
  const bgNumberRef    = useRef(null);
  const viewportRef    = useRef(null);
  const wheelRef       = useRef(null);
  const wheelWrapRef   = useRef(null);
  const dotsRef        = useRef(null);
  const prevBtnRef     = useRef(null);
  const nextBtnRef     = useRef(null);
  const cursorTipRef   = useRef(null);

  const activeIndex    = useRef(-1);   // card currently on screen
  const previewIndex   = useRef(-1);   // wheel position during scroll
  const isScrolling    = useRef(false);
  const boxFocused     = useRef(false);
  const wheelAccum     = useRef(0);
  const commitTimer    = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ── helpers ── */

  const setBoxFocus = (focused, contentEl = null) => {
    boxFocused.current = focused;
    viewportRef.current?.querySelectorAll('.hackathon-slide-content').forEach(el => {
      el.classList.toggle('focused', focused && el === contentEl);
    });
    if (focused) cursorTipRef.current?.classList.remove('visible');
  };

  const updateArrows = (idx) => {
    if (prevBtnRef.current) prevBtnRef.current.disabled = idx <= -1;
    if (nextBtnRef.current) nextBtnRef.current.disabled = idx >= hackathons.length - 1;
  };

  /* Spin the wheel + update number — no card change */
  const spinTo = (rawIndex) => {
    const idx     = Math.max(-1, Math.min(hackathons.length - 1, rawIndex));
    const isIntro = idx < 0;
    previewIndex.current = idx;

    if (wheelRef.current && !isIntro) {
      wheelRef.current.style.transform = `rotate(${wheelAngle(idx)}deg)`;
    }
    wheelWrapRef.current?.classList.toggle('visible', !isIntro);

    if (bgNumberRef.current) {
      bgNumberRef.current.style.opacity = isIntro ? '0' : '1';
      if (!isIntro) bgNumberRef.current.textContent = idx + 1;
    }

    dotsRef.current?.querySelectorAll('.hackathon-dot-nav').forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
    updateArrows(idx);
  };

  /* Remove whatever card is visible */
  const recedeActiveCard = (cb) => {
    const vp  = viewportRef.current;
    const cur = vp?.querySelector('.hackathon-slide.active');
    if (cur) {
      cur.classList.add('card-recede');
      setTimeout(() => {
        cur.classList.remove('active', 'card-recede');
        cb?.();
      }, RECEDE_MS);
    } else {
      cb?.();
    }
  };

  /* Show card for previewIndex — called when scroll stops */
  const commitCard = () => {
    isScrolling.current = false;
    const vp  = viewportRef.current;
    const idx = previewIndex.current;

    if (idx < 0) {
      // Back to intro
      vp?.querySelector('.hackathon-intro')?.classList.add('active');
      activeIndex.current = -1;
      return;
    }

    // Deactivate all, activate target
    vp?.querySelectorAll('.hackathon-slide').forEach((s, i) => {
      s.classList.toggle('active', i === idx);
    });
    const newSlide = vp?.querySelectorAll('.hackathon-slide')[idx];
    if (newSlide) {
      newSlide.classList.add('card-emerge');
      setTimeout(() => newSlide.classList.remove('card-emerge'), EMERGE_MS + 30);
    }
    activeIndex.current = idx;
  };

  /* Nav arrows / dots — immediate spin + card */
  const goTo = (rawIndex) => {
    const idx = Math.max(-1, Math.min(hackathons.length - 1, rawIndex));
    if (idx === activeIndex.current && !isScrolling.current) return;

    clearTimeout(commitTimer.current);
    viewportRef.current?.querySelector('.hackathon-intro')?.classList.remove('active');

    spinTo(idx);

    recedeActiveCard(() => {
      isScrolling.current = false;
      commitCard();
    });
  };

  /* ── event wiring ── */

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e) => {
      const inBox = e.target.closest('.hackathon-slide-content');

      // focused + inside box → natural scroll
      if (boxFocused.current && inBox) return;

      // focused + outside box → unfocus only, no nav
      if (boxFocused.current && !inBox) {
        setBoxFocus(false);
        e.preventDefault();
        return;
      }

      e.preventDefault();

      /* ── enter scroll mode ── */
      if (!isScrolling.current) {
        isScrolling.current = true;
        previewIndex.current = activeIndex.current;

        // recede card immediately
        const cur = vp.querySelector('.hackathon-slide.active');
        if (cur) {
          cur.classList.add('card-recede');
          setTimeout(() => cur.classList.remove('active', 'card-recede'), RECEDE_MS);
        }

        // hide intro
        vp.querySelector('.hackathon-intro')?.classList.remove('active');

        // ensure wheel is visible if we have a position
        if (activeIndex.current >= 0) {
          wheelWrapRef.current?.classList.add('visible');
        }
      }

      /* ── accumulate + advance preview ── */
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) >= WHEEL_THRESHOLD) {
        spinTo(previewIndex.current + (wheelAccum.current > 0 ? 1 : -1));
        wheelAccum.current = 0;
      }

      /* ── debounce: commit card when scroll stops ── */
      clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(commitCard, COMMIT_DELAY);
    };

    const onViewportClick = (e) => {
      const content = e.target.closest('.hackathon-slide-content');
      setBoxFocus(!!content, content || null);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setBoxFocus(false);
    };

    const onMouseMove = (e) => {
      const tip  = cursorTipRef.current;
      if (!tip) return;
      const rect = vp.getBoundingClientRect();
      tip.style.left = `${e.clientX - rect.left}px`;
      tip.style.top  = `${e.clientY - rect.top}px`;
      const inBox            = e.target.closest('.hackathon-slide-content');
      const showClickToView  = !!inBox && !boxFocused.current && activeIndex.current >= 0;
      const showClickToLeave = !inBox  &&  boxFocused.current && activeIndex.current >= 0;
      if (showClickToView)       tip.textContent = 'click to view';
      else if (showClickToLeave) tip.textContent = 'click to leave';
      tip.classList.toggle('visible', showClickToView || showClickToLeave);
    };

    const onMouseLeave = () => cursorTipRef.current?.classList.remove('visible');

    vp.addEventListener('wheel',      onWheel,         { passive: false });
    vp.addEventListener('click',      onViewportClick, { passive: true  });
    vp.addEventListener('mousemove',  onMouseMove,     { passive: true  });
    vp.addEventListener('mouseleave', onMouseLeave,    { passive: true  });
    window.addEventListener('keydown', onKeyDown);

    /* init */
    vp.querySelector('.hackathon-intro')?.classList.add('active');
    updateArrows(-1);

    return () => {
      vp.removeEventListener('wheel',      onWheel);
      vp.removeEventListener('click',      onViewportClick);
      vp.removeEventListener('mousemove',  onMouseMove);
      vp.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(commitTimer.current);
    };
  }, []);

  return (
    <section id="hackathons" className="section tab-content hackathons-section">
      <div className="hackathons-sticky">
        <div className="hackathons-viewport" ref={viewportRef}>

          {/* Big number — left, unchanged */}
          <div className="hackathons-bg-number" ref={bgNumberRef} aria-hidden="true">1</div>

          {/* Clock wheel — right edge, half off-screen */}
          <div className="hackathon-wheel-wrap" ref={wheelWrapRef} aria-hidden="true">
            <div className="hackathon-wheel" ref={wheelRef}>
              {hackathons.map((h, i) => (
                <div key={i} className="hackathon-wheel-tick"
                     style={{ '--angle': `${i * SLOT_DEG}deg` }}>
                  <span className="hackathon-wheel-label">{h.name}</span>
                </div>
              ))}
            </div>
            <div className="hackathon-wheel-notch" />
          </div>

          {/* Intro */}
          <div className="hackathon-intro">
            <div className="hackathon-intro-body">
              <p className="hackathon-intro-quote">
                "Starting 2026, I went to 15 hackathons in a row, 12 weeks straight.
                <br />
                Competed in 12, judged 1, organized 1, founded 1.
                <br />
                Here is my story..."
              </p>
              <p className="hackathon-intro-hint">scroll to begin ↓</p>
            </div>
          </div>

          {/* Cards */}
          {hackathons.map((h, i) => {
            const imgs = h.images || (h.image ? [h.image] : []);
            return (
              <div key={h.id} className="hackathon-slide" data-index={i}>
                <div className="hackathon-slide-content">
                  <h3 className="hackathon-name">{h.name}</h3>
                  {h.award && <div className="hackathon-award">🏆 {h.award}</div>}
                  {Array.isArray(h.highlight)
                    ? h.highlight.map((para, pi) => <p key={pi} className="hackathon-highlight">{para}</p>)
                    : <p className="hackathon-highlight">{h.highlight}</p>
                  }
                  {imgs.length > 0 && (
                    <div className="hackathon-slide-images">
                      {imgs.map((src, j) => (
                        <div key={j} className="hackathon-slide-image">
                          <img src={src} alt={`${h.name} ${j + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="hackathon-cursor-tip" ref={cursorTipRef}>click to view</div>
        </div>

        {/* Nav row */}
        <div className="hackathons-nav-row">
          <button className="hackathon-nav-arrow" ref={prevBtnRef}
            aria-label="Previous" onClick={() => goTo(activeIndex.current - 1)}>←</button>

          <div className="hackathons-nav-dots" ref={dotsRef}>
            {hackathons.map((h, i) => (
              <button key={h.id} className="hackathon-dot-nav"
                aria-label={`Go to ${h.name}`} onClick={() => goTo(i)} />
            ))}
          </div>

          <button className="hackathon-nav-arrow" ref={nextBtnRef}
            aria-label="Next" onClick={() => goTo(activeIndex.current + 1)}>→</button>
        </div>
      </div>
    </section>
  );
};

export default HackathonsSection;
