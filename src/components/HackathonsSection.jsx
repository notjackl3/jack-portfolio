import { useEffect, useRef } from 'react';
import { hackathons } from '../data/hackathons';

const ZONE = 220;
const TRIGGER = 0.55;

const easeOutBack = (p) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

const applyCardAnim = (inner, connector, rawProgress) => {
  const p  = Math.max(0, Math.min(1, rawProgress));
  const ep = p < 1 ? easeOutBack(p) : 1;
  const dy = (1 - ep) * 22; // always animate from above
  inner.style.opacity   = Math.min(1, p * 1.8);
  inner.style.transform = `translateY(${dy}px)`;
  if (connector) connector.style.opacity = Math.min(1, p * 1.4);
};

const HackathonCard = ({ hackathon, index }) => (
  <div className="hackathon-card" data-index={index}>
    <div className="hackathon-card-inner">
      <h3 className="hackathon-name">{hackathon.name}</h3>
      <p className="hackathon-highlight">{hackathon.highlight}</p>
    </div>
    <div className="hackathon-connector">
      <div className="hackathon-stem" />
      <div className="hackathon-dot" />
    </div>
  </div>
);


const HackathonsSection = () => {
  const viewportRef  = useRef(null);
  const trackRef     = useRef(null);
  const bgNumberRef  = useRef(null);
  const spotlightRef = useRef(null);
  const galleryRef   = useRef(null);
  const dotsRef      = useRef(null);
  const scrollX      = useRef(0);
  const targetX      = useRef(0);
  const rafId        = useRef(0);
  const touchStartX  = useRef(0);
  const touchStartY  = useRef(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const getMax = () => {
    const track   = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return 0;
    return Math.max(0, track.scrollWidth - viewport.offsetWidth);
  };

  const updateAnims = (x) => {
    const track     = trackRef.current;
    const viewport  = viewportRef.current;
    const bgNum     = bgNumberRef.current;
    const spotlight = spotlightRef.current;
    const gallery   = galleryRef.current;
    const dots      = dotsRef.current;
    if (!track || !viewport) return;
    const vw = viewport.offsetWidth;
    const vh = viewport.offsetHeight;
    let bestDist   = Infinity;
    let activeNum  = 1;
    let activeCard = null;

    const cards = track.querySelectorAll('.hackathon-card');

    cards.forEach((card) => {
      const inner     = card.querySelector('.hackathon-card-inner');
      const connector = card.querySelector('.hackathon-connector');
      const cardLeft  = card.offsetLeft - x;
      const progress  = (vw * TRIGGER - cardLeft) / ZONE;
      applyCardAnim(inner, connector, progress);
      const dist = Math.abs(progress - 1);
      if (progress > 0 && dist < bestDist) {
        bestDist   = dist;
        activeNum  = parseInt(card.dataset.index, 10) + 1;
        activeCard = card;
      }
    });

    // Dim non-active cards, boost active
    cards.forEach((card) => {
      const inner = card.querySelector('.hackathon-card-inner');
      const conn  = card.querySelector('.hackathon-connector');
      const isActive = card === activeCard;
      if (inner) inner.style.filter = isActive ? 'brightness(1.6) saturate(1.1)' : 'brightness(0.35)';
      if (conn)  conn.style.filter  = isActive ? '' : 'brightness(0.3)';
    });

    if (bgNum) bgNum.textContent = activeNum;

    // Update gallery
    if (gallery) {
      gallery.querySelectorAll('.hackathon-gallery-set').forEach((set, i) => {
        set.classList.toggle('active', i === activeNum - 1);
      });
    }

    // Update nav dots
    if (dots) {
      dots.querySelectorAll('.hackathon-dot-nav').forEach((dot, i) => {
        dot.classList.toggle('active', i === activeNum - 1);
      });
    }

    if (spotlight && activeCard) {
      const cardLeft   = activeCard.offsetLeft - x;
      const cardCenter = cardLeft + activeCard.offsetWidth / 2;
      const rx = Math.round(cardCenter * 10) / 10;
      spotlight.style.background = [
        `radial-gradient(ellipse 220px 420px at ${rx}px -60px,`,
        `  rgba(255,240,200,0.07) 0%, transparent 70%),`,
        `radial-gradient(ellipse 580px ${vh * 1.1}px at ${rx}px -80px,`,
        `  transparent 0%, transparent 28%, rgba(0,0,0,0.93) 72%)`,
      ].join(' ');
    }
  };

  const commit = (x) => {
    const track = trackRef.current;
    const max   = getMax();
    const clamped = Math.max(0, Math.min(max, x));
    scrollX.current = clamped;
    if (track) track.style.transform = `translateX(${-clamped}px)`;
    updateAnims(clamped);
  };

  const scrollToCard = (index) => {
    const track   = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const cards = track.querySelectorAll('.hackathon-card');
    const card  = cards[index];
    if (!card) return;
    const vw = viewport.offsetWidth;
    targetX.current = Math.max(0, Math.min(getMax(), card.offsetLeft - vw / 2 + card.offsetWidth / 2));
    cancelAnimationFrame(rafId.current);
    const step = () => {
      const diff = targetX.current - scrollX.current;
      if (Math.abs(diff) > 0.3) {
        commit(scrollX.current + diff * 0.1);
        rafId.current = requestAnimationFrame(step);
      } else {
        commit(targetX.current);
      }
    };
    rafId.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const animate = () => {
      const diff = targetX.current - scrollX.current;
      if (Math.abs(diff) > 0.3) {
        commit(scrollX.current + diff * 0.1);
        rafId.current = requestAnimationFrame(animate);
      } else {
        commit(targetX.current);
      }
    };

    const nudge = (delta) => {
      targetX.current = Math.max(0, Math.min(getMax(), targetX.current + delta));
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(animate);
    };

    const onWheel = (e) => {
      // Don't scroll timeline when wheeling over the gallery
      if (e.target.closest('.hackathons-gallery')) return;

      const cardInner = e.target.closest('.hackathon-card-inner');
      if (cardInner && cardInner.scrollHeight > cardInner.clientHeight) {
        const scrollingDown = e.deltaY > 0;
        const atTop    = cardInner.scrollTop <= 0;
        const atBottom = cardInner.scrollTop + cardInner.clientHeight >= cardInner.scrollHeight - 1;
        if ((scrollingDown && !atBottom) || (!scrollingDown && !atTop)) return;
      }
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      nudge(d);
    };

    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      const dx = touchStartX.current - e.touches[0].clientX;
      const dy = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        nudge(dx * 1.5);
        touchStartX.current = e.touches[0].clientX;
      }
    };

    const vp = viewportRef.current;
    if (!vp) return;
    vp.addEventListener('wheel',      onWheel,      { passive: false });
    vp.addEventListener('touchstart', onTouchStart, { passive: true  });
    vp.addEventListener('touchmove',  onTouchMove,  { passive: false });

    commit(0);

    return () => {
      vp.removeEventListener('wheel',      onWheel);
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove',  onTouchMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <section id="hackathons" className="section tab-content hackathons-section">
      <div className="hackathons-sticky">
        <div className="hackathons-bg-number" ref={bgNumberRef} aria-hidden="true">1</div>
        <div className="hackathons-viewport" ref={viewportRef}>
          <div className="hackathons-spotlight" ref={spotlightRef} aria-hidden="true" />
          <div className="hackathons-track" ref={trackRef}>
            <div className="hackathons-timeline-line" />
            {hackathons.map((h, i) => (
              <HackathonCard key={h.id} hackathon={h} index={i} />
            ))}
          </div>
          <div className="hackathons-gallery" ref={galleryRef}>
            {hackathons.map((h, i) => {
              const imgs = h.images || (h.image ? [h.image] : []);
              return (
                <div key={h.id} className="hackathon-gallery-set" data-gallery-index={i}>
                  {imgs.map((src, j) => (
                    <div key={j} className="hackathon-gallery-item">
                      <img src={src} alt={`${h.name} ${j + 1}`} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hackathons-nav-dots" ref={dotsRef}>
          {hackathons.map((h, i) => (
            <button
              key={h.id}
              className="hackathon-dot-nav"
              aria-label={`Go to ${h.name}`}
              onClick={() => scrollToCard(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HackathonsSection;
