import React, { useEffect, useRef, useState } from 'react';
import { MODES, PALETTES } from './Backdrop';
import { POINTERS } from './Cursor';
import { NOTE_STYLES } from './Notes';
import { HANDS } from '../hands';

// Panel for trying backgrounds and pointer designs. Toggle with the fx
// button or the ` key; Esc closes it and hands focus back to the button.
const Group = ({ title, items, value, onPick, second }) => (
  <div className="fx-group" role="group" aria-label={title}>
    <div className={`fx-title${second ? ' fx-title--second' : ''}`}>{title}</div>
    <div className="fx-options">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="fx-option"
          aria-pressed={value === item.id}
          onClick={() => onPick(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

const FxPanel = ({
  mode, onChange,
  palette, onPalette,
  pointer, onPointer,
  note, onNote,
  hand, onHand,
}) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '`') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <div className="fx">
      {open ? (
        <div className="fx-panel" role="dialog" aria-label="display options" tabIndex={-1} ref={panelRef}>
          <Group title="background" items={MODES} value={mode} onPick={onChange} />
          {mode === 'glow' ? (
            <Group title="colour" items={PALETTES} value={palette} onPick={onPalette} second />
          ) : null}
          <Group title="pointer" items={POINTERS} value={pointer} onPick={onPointer} second />
          <Group title="note" items={NOTE_STYLES} value={note} onPick={onNote} second />
          {/* `plain` sets the note in the site's own typeface, and `off`
              has no note to set, so neither has a hand to pick. */}
          {note !== 'off' && note !== 'plain' ? (
            <Group title="hand" items={HANDS} value={hand} onPick={onHand} second />
          ) : null}
          <div className="fx-hint">` to toggle · esc to close</div>
        </div>
      ) : null}

      <button
        type="button"
        className="fx-toggle"
        ref={toggleRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="display options"
        title="display options (`)"
      >
        fx
      </button>
    </div>
  );
};

export default FxPanel;
