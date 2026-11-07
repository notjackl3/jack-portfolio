import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// The photo gallery for one entry, over the page. A photo can arrive as a
// plain src or as { src, w, h }: the blog data carries dimensions, so that
// grid is right on first paint, while the hackathon photos are bundled
// imports with no size attached and get measured as they decode.

const normalize = (image) => (typeof image === 'string' ? { src: image } : image);

// Rows are justified on the photos' own proportions, so a row always ends
// flush with both edges and every gap is the same. Until a photo without
// stored dimensions has decoded it is assumed to be a touch wide, which is
// the common case and keeps the first paint close to the final one.
const ASSUMED = 1.4;

const Lightbox = ({ title, images, onClose }) => {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  // Proportions worked out from photos that arrived without dimensions.
  const [measured, setMeasured] = useState({});

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);

    // Hold the page still underneath, and leave its scrollbar in place so
    // the layout doesn't jump sideways as the overlay opens.
    const { overflow, paddingRight } = document.body.style;
    const bar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (bar > 0) document.body.style.paddingRight = `${bar}px`;

    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [onClose]);

  // Rendered into <body> rather than where it sits in the tree. An overlay
  // that covers the page cannot be a descendant of the page: any ancestor
  // with a transform, a filter or a will-change becomes its containing block
  // and `position: fixed` starts measuring from that box instead of the
  // viewport. The `.rise` entrance did exactly that for a while; a portal
  // means the next thing to grow a transform cannot do it again.
  return createPortal(
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // Only a press that both starts and ends on the backdrop closes it,
        // so a drag that happens to finish out here doesn't.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lb-panel" ref={panelRef}>
        <div className="lb-head">
          <span className="lb-title">{title}</span>
          <button type="button" className="lb-close" onClick={onClose} ref={closeRef} aria-label="close">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M6 6 L18 18 M18 6 L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="lb-grid">
          {images.map(normalize).map((image) => {
            const known = image.w && image.h ? image.w / image.h : null;
            const ratio = known || measured[image.src] || ASSUMED;
            return (
              <figure
                className="lb-item"
                style={{ '--r': ratio.toFixed(4) }}
                key={image.src}
              >
                <img
                  src={image.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onLoad={
                    known
                      ? undefined
                      : (e) => {
                          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                          if (!w || !h) return;
                          setMeasured((prev) =>
                            prev[image.src] ? prev : { ...prev, [image.src]: w / h }
                          );
                        }
                  }
                />
              </figure>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Lightbox;
