import { useEffect, useRef } from 'react';
import { hackathons } from '../data/hackathons';

const WHEEL_THRESHOLD = 60;
const TRANSITION_MS   = 500;

const HackathonsSection = () => {
  const bgNumberRef     = useRef(null);
  const viewportRef     = useRef(null);
  const dotsRef         = useRef(null);
  const prevBtnRef      = useRef(null);
  const nextBtnRef      = useRef(null);
  const cursorTipRef    = useRef(null);
  const activeIndex     = useRef(-1);
  const isTransitioning = useRef(false);
  const boxFocused      = useRef(false);
  const wheelAccum      = useRef(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const setBoxFocus = (focused, contentEl = null) => {
    boxFocused.current = focused;
    viewportRef.current?.querySelectorAll('.hackathon-slide-content').forEach(el => {
      el.classList.toggle('focused', focused && el === contentEl);
    });
    if (focused) cursorTipRef.current?.classList.remove('visible');
  };

  const updateArrows = (index) => {
    if (prevBtnRef.current) prevBtnRef.current.disabled = index <= -1;
    if (nextBtnRef.current) nextBtnRef.current.disabled = index >= hackathons.length - 1;
  };

  const updateSlide = (index) => {
    const viewport = viewportRef.current;
    const bgNum    = bgNumberRef.current;
    const dots     = dotsRef.current;
    const isIntro  = index < 0;

    if (bgNum) {
      bgNum.style.opacity = isIntro ? '0' : '1';
      if (!isIntro) bgNum.textContent = index + 1;
    }

    const intro = viewport?.querySelector('.hackathon-intro');
    if (intro) intro.classList.toggle('active', isIntro);

    if (viewport) {
      viewport.querySelectorAll('.hackathon-slide').forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
      });
    }

    if (dots) {
      dots.querySelectorAll('.hackathon-dot-nav').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }

    updateArrows(index);
  };

  const goTo = (index) => {
    const clamped = Math.max(-1, Math.min(hackathons.length - 1, index));
    if (clamped === activeIndex.current) return;
    activeIndex.current = clamped;
    isTransitioning.current = true;
    setBoxFocus(false);
    updateSlide(clamped);
    setTimeout(() => { isTransitioning.current = false; }, TRANSITION_MS);
  };

  useEffect(() => {
    const onWheel = (e) => {
      const inBox = e.target.closest('.hackathon-slide-content');

      // If box is focused and cursor is inside it — let it scroll naturally
      if (boxFocused.current && inBox) return;

      // If box is focused but cursor drifted outside — deselect and navigate
      if (boxFocused.current && !inBox) setBoxFocus(false);

      e.preventDefault();
      if (isTransitioning.current) return;
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) >= WHEEL_THRESHOLD) {
        goTo(activeIndex.current + (wheelAccum.current > 0 ? 1 : -1));
        wheelAccum.current = 0;
      }
    };

    const onViewportClick = (e) => {
      const content = e.target.closest('.hackathon-slide-content');
      setBoxFocus(!!content, content || null);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setBoxFocus(false);
    };

    const onMouseMove = (e) => {
      const tip = cursorTipRef.current;
      const vp  = viewportRef.current;
      if (!tip || !vp) return;
      const rect = vp.getBoundingClientRect();
      tip.style.left = `${e.clientX - rect.left}px`;
      tip.style.top  = `${e.clientY - rect.top}px`;
      const inBox = e.target.closest('.hackathon-slide-content');
      tip.classList.toggle('visible', !!inBox && !boxFocused.current && activeIndex.current >= 0);
    };

    const onMouseLeave = () => {
      cursorTipRef.current?.classList.remove('visible');
    };

    const vp = viewportRef.current;
    if (!vp) return;

    vp.addEventListener('wheel',      onWheel,          { passive: false });
    vp.addEventListener('click',      onViewportClick,  { passive: true  });
    vp.addEventListener('mousemove',  onMouseMove,      { passive: true  });
    vp.addEventListener('mouseleave', onMouseLeave,     { passive: true  });
    window.addEventListener('keydown', onKeyDown);

    updateSlide(-1);

    return () => {
      vp.removeEventListener('wheel',      onWheel);
      vp.removeEventListener('click',      onViewportClick);
      vp.removeEventListener('mousemove',  onMouseMove);
      vp.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <section id="hackathons" className="section tab-content hackathons-section">
      <div className="hackathons-sticky">
        <div className="hackathons-bg-number" ref={bgNumberRef} aria-hidden="true">1</div>

        <div className="hackathons-viewport" ref={viewportRef}>

          {/* Intro screen */}
          <div className="hackathon-intro">
            <div className="hackathon-intro-body">
              <p className="hackathon-intro-quote">
                "Starting 2026, I went to 14 hackathons in a row, 12 weeks straight. Here is my story."
              </p>
              <p className="hackathon-intro-hint">scroll to begin ↓</p>
            </div>
          </div>

          {/* Hackathon slides */}
          {/* Cursor tip */}
          <div className="hackathon-cursor-tip" ref={cursorTipRef}>click to view</div>

          {hackathons.map((h, i) => {
            const imgs = h.images || (h.image ? [h.image] : []);
            return (
              <div key={h.id} className="hackathon-slide" data-index={i}>
                <div className="hackathon-slide-content">
                  <h3 className="hackathon-name">{h.name}</h3>
                  {h.award && <div className="hackathon-award">🏆 {h.award}</div>}
                  <p className="hackathon-highlight">{h.highlight}</p>
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
        </div>

        {/* Nav row: arrow · dots · arrow */}
        <div className="hackathons-nav-row">
          <button
            className="hackathon-nav-arrow"
            ref={prevBtnRef}
            aria-label="Previous hackathon"
            onClick={() => goTo(activeIndex.current - 1)}
          >←</button>

          <div className="hackathons-nav-dots" ref={dotsRef}>
            {hackathons.map((h, i) => (
              <button
                key={h.id}
                className="hackathon-dot-nav"
                aria-label={`Go to ${h.name}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <button
            className="hackathon-nav-arrow"
            ref={nextBtnRef}
            aria-label="Next hackathon"
            onClick={() => goTo(activeIndex.current + 1)}
          >→</button>
        </div>
      </div>
    </section>
  );
};

export default HackathonsSection;
