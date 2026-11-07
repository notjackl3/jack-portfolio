import React, { useEffect, useState } from 'react';
import { POINTERS } from '../components/Cursor';

// The box your cursors live in when they are not in your hand. It sits in the
// nav beside the mark: a row of the designs you are not using, each one drawn
// the size it will be under your hand. Take one and it becomes your cursor,
// and the one you were holding goes back in its place.
//
// A row, not a grid. Four designs means three are loose at any time, and
// three in a 2×2 is an empty quadrant that reads as a mistake rather than a
// layout. A row takes three or four equally well and matches the direction
// the nav already runs in.
//
// There is no drop control, because taking a shape already drops the one in
// your hand — a separate button would only be a second way to do a thing
// that happens anyway, and the only state it could reach that this cannot is
// holding nothing at all. The OS arrow, in the fx panel, is that.
//
// The roster is read straight off POINTERS rather than listed again here, so
// a design cannot exist in the panel and be missing from the box. `off` is
// the OS arrow and has no shape to show, so it is the one that drops out.

const CursorBed = ({ pointer, onEquip }) => {
  // Gated on the same two conditions as the pointer layer, and for the same
  // reason in the second case: under reduced motion `.cursor` is display:none
  // and the native arrow is back, so there is no custom pointer for the box
  // to be choosing between.
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia?.('(pointer: fine)');
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!fine) return undefined;
    const sync = () => setOk(fine.matches && !calm?.matches);
    sync();
    fine.addEventListener('change', sync);
    calm?.addEventListener('change', sync);
    return () => {
      fine.removeEventListener('change', sync);
      calm?.removeEventListener('change', sync);
    };
  }, []);

  if (!ok) return null;

  // Every design is either in your hand or in the box; there is no third
  // place, which is why this is derived on every render and never stored.
  const loose = POINTERS.filter((p) => p.id !== 'off' && p.id !== pointer);

  const take = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    onEquip(id);
  };

  return (
    <div className="bed">
      {loose.map((p) => (
        <button
          key={p.id}
          type="button"
          className="bed-shape"
          data-shape={p.id}
          aria-label={`use the ${p.label} pointer`}
          onPointerDown={(e) => take(e, p.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') take(e, p.id);
          }}
        >
          <span className="bed-art" aria-hidden="true">
            {p.id === 'frame' ? (
              <>
                <i className="bed-c bed-c-tl" />
                <i className="bed-c bed-c-tr" />
                <i className="bed-c bed-c-bl" />
                <i className="bed-c bed-c-br" />
              </>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CursorBed;
