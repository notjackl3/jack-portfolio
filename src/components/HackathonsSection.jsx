import { useEffect, useRef } from 'react';
import { hackathons } from '../data/hackathons';

const WHEEL_THRESHOLD = 55;
const RECEDE_MS       = 160;
const EMERGE_MS       = 310;
const COMMIT_DELAY    = 380;   // ms after scroll stops → show card
const SLOT_DEG        = 360 / hackathons.length;

const wheelAngle = (n) => 270 + n * SLOT_DEG;
const isMobile   = () => window.innerWidth <= 768;

const HackathonsSection = () => {
  const bgNumberRef    = useRef(null);
  const viewportRef    = useRef(null);
  const wheelRef       = useRef(null);
  const wheelWrapRef   = useRef(null);
  const dotsRef        = useRef(null);
  const prevBtnRef     = useRef(null);
  const nextBtnRef     = useRef(null);
  const cursorTipRef   = useRef(null);
  const mobileNameRef  = useRef(null);

  const activeIndex    = useRef(-1);
  const previewIndex   = useRef(-1);
  const isScrolling    = useRef(false);
  const boxFocused     = useRef(false);
  const wheelAccum     = useRef(0);
  const commitTimer    = useRef(null);

  // mobile touch tracking
  const currentRotation    = useRef(wheelAngle(0));
  const touchStartAngle    = useRef(0);
  const touchStartRotation = useRef(wheelAngle(0));

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

  /* Show card for previewIndex — called when scroll/spin stops */
  const commitCard = () => {
    isScrolling.current = false;
    const vp  = viewportRef.current;
    const idx = previewIndex.current;

    if (idx < 0) {
      vp?.querySelector('.hackathon-intro')?.classList.add('active');
      activeIndex.current = -1;
      return;
    }

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

  /* Mobile: return to clock from card view */
  const returnToMobileClock = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    setBoxFocus(false);
    vp.classList.remove('mobile-card-view');
    if (bgNumberRef.current) bgNumberRef.current.style.opacity = '1';
    recedeActiveCard(() => { activeIndex.current = -1; });
  };

  /* ── event wiring ── */

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    /* ── desktop wheel ── */
    const onWheel = (e) => {
      if (isMobile()) return;
      const inBox = e.target.closest('.hackathon-slide-content');

      if (boxFocused.current && inBox) return;

      if (boxFocused.current && !inBox) {
        setBoxFocus(false);
        e.preventDefault();
        return;
      }

      e.preventDefault();

      if (!isScrolling.current) {
        isScrolling.current = true;
        previewIndex.current = activeIndex.current;

        const cur = vp.querySelector('.hackathon-slide.active');
        if (cur) {
          cur.classList.add('card-recede');
          setTimeout(() => cur.classList.remove('active', 'card-recede'), RECEDE_MS);
        }

        vp.querySelector('.hackathon-intro')?.classList.remove('active');

        if (activeIndex.current >= 0) {
          wheelWrapRef.current?.classList.add('visible');
        }
      }

      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) >= WHEEL_THRESHOLD) {
        spinTo(previewIndex.current + (wheelAccum.current > 0 ? 1 : -1));
        wheelAccum.current = 0;
      }

      clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(commitCard, COMMIT_DELAY);
    };

    /* ── desktop click / hover ── */
    const onViewportClick = (e) => {
      if (isMobile()) return;
      const content = e.target.closest('.hackathon-slide-content');
      setBoxFocus(!!content, content || null);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setBoxFocus(false);
    };

    const onMouseMove = (e) => {
      if (isMobile()) return;
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

    /* ── mobile touch — spin the clock ── */
    const getWheelCenter = () => {
      const rect = wheelWrapRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const onTouchStart = (e) => {
      if (!isMobile()) return;
      if (vp.classList.contains('mobile-card-view')) return;
      const touch = e.touches[0];
      const { x, y } = getWheelCenter();
      touchStartAngle.current    = Math.atan2(touch.clientY - y, touch.clientX - x) * 180 / Math.PI;
      touchStartRotation.current = currentRotation.current;
      if (wheelRef.current) wheelRef.current.style.transition = 'none';
    };

    const onTouchMove = (e) => {
      if (!isMobile()) return;
      if (vp.classList.contains('mobile-card-view')) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getWheelCenter();
      const angle = Math.atan2(touch.clientY - y, touch.clientX - x) * 180 / Math.PI;
      let delta = angle - touchStartAngle.current;
      if (delta >  180) delta -= 360;
      if (delta < -180) delta += 360;

      const newRot = touchStartRotation.current + delta;
      currentRotation.current = newRot;

      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${newRot}deg)`;

      const raw = Math.round((newRot - 270) / SLOT_DEG);
      const idx = ((raw % hackathons.length) + hackathons.length) % hackathons.length;

      if (bgNumberRef.current) bgNumberRef.current.textContent = idx + 1;
      if (mobileNameRef.current) mobileNameRef.current.textContent = hackathons[idx].name;
      dotsRef.current?.querySelectorAll('.hackathon-dot-nav').forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
      });
      previewIndex.current = idx;
    };

    const onTouchEnd = () => {
      if (!isMobile()) return;
      if (vp.classList.contains('mobile-card-view')) return;

      const idx     = previewIndex.current;
      const snapped = wheelAngle(idx);
      currentRotation.current = snapped;

      if (wheelRef.current) {
        wheelRef.current.style.transition = '';
        wheelRef.current.style.transform  = `rotate(${snapped}deg)`;
      }

      // auto-show card after snap settles
      clearTimeout(commitTimer.current);
      commitTimer.current = setTimeout(() => {
        vp.classList.add('mobile-card-view');
        if (bgNumberRef.current) bgNumberRef.current.style.opacity = '0';
        commitCard();
        // auto-focus card so inner scroll works immediately
        setTimeout(() => {
          const content = vp.querySelectorAll('.hackathon-slide-content')[previewIndex.current];
          if (content) { content.classList.add('focused'); boxFocused.current = true; }
        }, EMERGE_MS + 40);
      }, 320);
    };

    vp.addEventListener('wheel',      onWheel,         { passive: false });
    vp.addEventListener('click',      onViewportClick, { passive: true  });
    vp.addEventListener('mousemove',  onMouseMove,     { passive: true  });
    vp.addEventListener('mouseleave', onMouseLeave,    { passive: true  });
    vp.addEventListener('touchstart', onTouchStart,    { passive: true  });
    vp.addEventListener('touchmove',  onTouchMove,     { passive: false });
    vp.addEventListener('touchend',   onTouchEnd,      { passive: true  });
    window.addEventListener('keydown', onKeyDown);

    /* init */
    if (!isMobile()) {
      vp.querySelector('.hackathon-intro')?.classList.add('active');
      updateArrows(-1);
    } else {
      const initIdx = 0;
      wheelWrapRef.current?.classList.add('visible');
      if (bgNumberRef.current) {
        bgNumberRef.current.style.opacity = '1';
        bgNumberRef.current.textContent   = String(initIdx + 1);
      }
      if (mobileNameRef.current) mobileNameRef.current.textContent = hackathons[initIdx].name;
      previewIndex.current    = initIdx;
      currentRotation.current = wheelAngle(initIdx);
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${wheelAngle(initIdx)}deg)`;
      dotsRef.current?.querySelectorAll('.hackathon-dot-nav').forEach((dot, i) => {
        dot.classList.toggle('active', i === initIdx);
      });
    }

    return () => {
      vp.removeEventListener('wheel',      onWheel);
      vp.removeEventListener('click',      onViewportClick);
      vp.removeEventListener('mousemove',  onMouseMove);
      vp.removeEventListener('mouseleave', onMouseLeave);
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove',  onTouchMove);
      vp.removeEventListener('touchend',   onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(commitTimer.current);
    };
  }, []);

  return (
    <section id="hackathons" className="section tab-content hackathons-section">
      <div className="hackathons-sticky">
        <div className="hackathons-viewport" ref={viewportRef}>

          {/* Big number */}
          <div className="hackathons-bg-number" ref={bgNumberRef} aria-hidden="true">1</div>

          {/* Clock wheel */}
          <div className="hackathon-wheel-wrap" ref={wheelWrapRef} aria-hidden="true">
            <div className="hackathon-wheel" ref={wheelRef}>
              {hackathons.map((h, i) => (
                <div key={i} className="hackathon-wheel-tick"
                     style={{ '--angle': `${-i * SLOT_DEG}deg` }}>
                  <span className="hackathon-wheel-label">{h.name}</span>
                </div>
              ))}
            </div>
            <div className="hackathon-wheel-notch" />
          </div>

          {/* Mobile: quote above clock */}
          <p className="hackathon-mobile-quote">
            "Starting 2026, I went to 15 hackathons in a row, 12 weeks straight.
            Competed in 12, judged 1, organized 1, founded 1.
            Here is my story..."
          </p>

          {/* Mobile: name below clock + drag hint */}
          <div className="hackathon-mobile-name" ref={mobileNameRef} />
          <p className="hackathon-mobile-hint">drag to spin</p>

          {/* Mobile: return button (visible in card view) */}
          <button className="hackathon-mobile-return" onClick={returnToMobileClock}>
            ← Return
          </button>

          {/* Intro (desktop only) */}
          <div className="hackathon-intro">
            <div className="hackathon-intro-body">
              <p className="hackathon-intro-quote">
                "Starting 2026, I went to 15 hackathons in a row, 12 weeks straight.
                <br />
                Competed in 12, judged 1, organized 1, founded 1. Here is my story..."
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
