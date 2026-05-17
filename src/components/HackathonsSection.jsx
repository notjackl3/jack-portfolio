import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { hackathons } from '../data/hackathons';
import { FaInfoCircle, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Per-card visual variation. Keyed off the index so renders stay stable.
const ROTATIONS = [-4, 3, -2, 5, -3, 4, -5, 2, -3, 4, -2, 5, -4, 3, -3];
const Y_NUDGES  = [ 0,  8, 4,  0,  6, 2,  8, 4,  0, 6, 4,  2,  8, 0,  4];

// Per-photo offsets/rotations inside a stack.
// Index 0 = front-most (highest z), bigger indices sit behind and fan out.
const STACK_OFFSETS = [
  { x:   8, y:  34, r:  -3 },  // [0] front-center, sits low
  { x: -78, y: -22, r:  -7 },  // [1] back upper-left
  { x:  82, y: -18, r:   9 },  // [2] back upper-right
];

const HackathonsSection = () => {
  const railRef = useRef(null);
  const [openId, setOpenId] = useState(null);

  // Always start the rail at card #1 when the tab mounts
  useLayoutEffect(() => {
    if (railRef.current) railRef.current.scrollLeft = 0;
  }, []);

  // Lock body scroll while this tab is mounted (page is a single horizontal viewport)
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  // vertical wheel → horizontal scroll
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      if (rail.scrollWidth <= rail.clientWidth) return;
      e.preventDefault();
      rail.scrollLeft += e.deltaY;
    };
    rail.addEventListener('wheel', onWheel, { passive: false });
    return () => rail.removeEventListener('wheel', onWheel);
  }, []);

  // close modal on Esc
  useEffect(() => {
    if (openId == null) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpenId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  const scrollBy = (dir) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.75, behavior: 'smooth' });
  };

  const openHackathon = openId != null
    ? hackathons.find((h) => h.id === openId)
    : null;

  return (
    <section id="hackathons" className="section tab-content hackathons-section">
      <header className="hackathons-header">
        <p className="hackathons-quote">
          "Starting 2026, I went to 15 hackathons in a row, 12 weeks straight.
          Competed in 12, judged 1, organized 1, founded 1. Here is my story..."
        </p>
      </header>

      <div className="hackathons-stage">
        <button
          type="button"
          className="stage-arrow stage-arrow--left"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
        >
          <FaChevronLeft />
        </button>

        <div className="hackathons-rail" ref={railRef}>
          <div className="hackathons-rail-track">
            {hackathons.map((h, i) => {
              const allImgs = h.images || (h.image ? [h.image] : []);
              // Show up to 3 photos in the stack (top photo last so it sits on top in DOM order via z-index)
              const stackImgs = allImgs.slice(0, 3);
              const rot = ROTATIONS[i % ROTATIONS.length];
              const dy  = Y_NUDGES[i % Y_NUDGES.length];
              const row = i % 2;
              return (
                <article
                  key={h.id}
                  className={`stamp-card stamp-card--row-${row}`}
                  style={{
                    '--i':   i,
                    '--rot': `${rot}deg`,
                    '--dy':  `${dy}px`,
                  }}
                >
                  <div className="stamp-stack">
                    {stackImgs.length === 0 ? (
                      <div className="stamp stamp--top">
                        <div className="stamp-photo">
                          <div className="stamp-photo-fallback">{h.name}</div>
                        </div>
                        <div className="stamp-caption">
                          <span className="stamp-num">#{String(i + 1).padStart(2, '0')}</span>
                          <span className="stamp-name">{h.name}</span>
                        </div>
                        <button
                          type="button"
                          className="stamp-info"
                          aria-label={`Read about ${h.name}`}
                          onClick={() => setOpenId(h.id)}
                        >
                          <FaInfoCircle />
                        </button>
                      </div>
                    ) : (
                      stackImgs.map((src, si) => {
                        // Bottom of stack rendered first; top last so it sits on top
                        const reversedIndex = stackImgs.length - 1 - si;
                        const offset = STACK_OFFSETS[reversedIndex] || STACK_OFFSETS[0];
                        const isTop = si === stackImgs.length - 1;
                        return (
                          <div
                            key={si}
                            className={`stamp ${isTop ? 'stamp--top' : ''}`}
                            style={{
                              '--sx': `${offset.x}px`,
                              '--sy': `${offset.y}px`,
                              '--sr': `${offset.r}deg`,
                              '--z':  stackImgs.length - reversedIndex,
                            }}
                          >
                            <div className="stamp-photo">
                              <img src={src} alt={`${h.name} ${si + 1}`} loading="lazy" />
                            </div>

                            {isTop && (
                              <>
                                <div className="stamp-caption">
                                  <span className="stamp-num">#{String(i + 1).padStart(2, '0')}</span>
                                  <span className="stamp-name">{h.name}</span>
                                </div>

                                {h.award && (
                                  <div className="stamp-award" title={h.award}>🏆</div>
                                )}

                                <button
                                  type="button"
                                  className="stamp-info"
                                  aria-label={`Read about ${h.name}`}
                                  onClick={() => setOpenId(h.id)}
                                >
                                  <FaInfoCircle />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="stage-arrow stage-arrow--right"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
        >
          <FaChevronRight />
        </button>
      </div>

      {openHackathon && (
        <div
          className="hackathon-modal-overlay"
          onClick={() => setOpenId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={openHackathon.name}
        >
          <div className="hackathon-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hackathon-modal-close"
              aria-label="Close"
              onClick={() => setOpenId(null)}
            >
              <FaTimes />
            </button>

            <div className="hackathon-modal-header">
              <h3 className="hackathon-modal-name">{openHackathon.name}</h3>
              {openHackathon.award && (
                <div className="hackathon-modal-award">🏆 {openHackathon.award}</div>
              )}
            </div>

            <div className="hackathon-modal-body">
              {Array.isArray(openHackathon.highlight)
                ? openHackathon.highlight.map((p, i) => (
                    <p key={i} className="hackathon-modal-para">{p}</p>
                  ))
                : <p className="hackathon-modal-para">{openHackathon.highlight}</p>}

              {(openHackathon.images?.length ?? 0) > 0 && (
                <div className="hackathon-modal-gallery">
                  {openHackathon.images.map((src, j) => (
                    <div key={j} className="hackathon-modal-gallery-item">
                      <img src={src} alt={`${openHackathon.name} ${j + 1}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HackathonsSection;
