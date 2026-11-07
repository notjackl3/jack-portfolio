import React, { useEffect, useRef, useState } from 'react';
import { note, LIMITS } from '../notes';
import Hand, { HandCanvas } from './Hand';
import { handOf, loadHand } from '../hands';

// A note pinned to the page, in one of six hands. What it says is the same
// in every one (src/v5/notes.js, plus whatever visitors have written over
// it); only the paper changes.
export const NOTE_STYLES = [
  { id: 'napkin', label: 'napkin' },
  { id: 'sticky', label: 'sticky' },
  { id: 'card', label: 'index' },
  { id: 'scrap', label: 'torn' },
  { id: 'margin', label: 'margin' },
  { id: 'plain', label: 'plain' },
  { id: 'off', label: 'off' },
];

const OPEN_KEY = 'v5-note-open';

const read = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const save = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage can be blocked — the note just forgets between visits */
  }
};

const Arrow = () => (
  <svg className="note-arrow" viewBox="0 0 64 40" aria-hidden="true">
    <path d="M62 6C44 2 18 6 6 26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M4 16.5 5.4 27.6 15.6 25" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Notes = ({ style = 'napkin', hand = 'caveat' }) => {
  const ref = useRef(null);

  const [open, setOpen] = useState(() => read(OPEN_KEY) !== '0');

  // `saved` is what the napkin says to everyone; `draft` is what this
  // visitor has written over it and not yet saved.
  const [saved, setSaved] = useState(note.body);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState(null);
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/goals', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return;
        // Nothing written yet, or the endpoint is down: the napkin still
        // reads, it just reads what shipped with the build.
        setSaved(d.body || note.body);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Fetches the stylesheet the first time this hand is picked; the
  // default is already in the document head, so the usual visit adds
  // nothing.
  useEffect(() => {
    loadHand(hand);
  }, [hand]);

  const toggle = () => {
    setOpen((v) => {
      save(OPEN_KEY, v ? '0' : '1');
      return !v;
    });
  };

  const body = draft ?? saved;
  const dirty = draft != null && draft.trim() !== saved.trim();

  const discard = () => {
    setDraft(null);
    setStatus(null);
  };

  const commit = async () => {
    if (!dirty || busy) return;
    const text = draft.trim();
    if (!text) return setStatus('nothing written');

    setBusy(true);
    setStatus(null);
    try {
      const r = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        // A 4xx is written for whoever is holding the pen — "slow down",
        // "nothing written" — so it goes on the sheet as-is. A 5xx is the
        // server talking to itself; that goes to the console and the sheet
        // says something plain instead.
        if (r.status >= 500) {
          console.error('[goals] save failed:', d?.error || r.status);
          throw new Error('could not save — try again later');
        }
        throw new Error(d?.error || 'could not save');
      }
      setSaved(d.body || text);
      setDraft(null);
    } catch (err) {
      // The draft stays exactly as written — nothing is thrown away because
      // the network was not there.
      setStatus(String(err.message || err).slice(0, 44));
    } finally {
      setBusy(false);
    }
  };

  if (style === 'off') return null;

  const face = handOf(hand);
  return (
    <aside
      ref={ref}
      className={[
        'note',
        `note--${style}`,
        open ? '' : 'is-retracted',
        dirty ? 'is-dirty' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        // `plain` is the site's own typeface and takes no hand at all.
        ...(style === 'plain' ? null : { '--hand': face.css, '--hand-scale': face.scale }),
      }}
      // Drives the no-wiggle rule: the per-glyph jitter is what makes a
      // handwriting face look written, and what makes a geometric sans look
      // like a rendering fault.
      data-hand={style === 'plain' ? 'default' : hand}
      aria-label={note.title}
    >
      <div className="note-sheet">
        <span className="note-deco" aria-hidden="true" />

        <div className="note-head">
          <span className="note-title">
            <Hand text={note.title} />
          </span>
          {/* Minimise only. There was a close here too, and it was a
              trap: the way back was the fx panel, which nothing on the note
              points at, so closing it read as losing it. Turning the note
              off entirely still lives in that panel, next to the other
              things you would go there to switch off. */}
          <button
            type="button"
            className="note-tool"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? 'minimise the note' : 'open the note'}
            title={open ? 'minimise' : 'open'}
          >
            {open ? '–' : '+'}
          </button>
        </div>

        {open ? (
          <>
            {/* One sheet, not ten fields: click anywhere and write. */}
            <HandCanvas
              className="note-body"
              value={body}
              max={LIMITS.body}
              maxLines={LIMITS.lines}
              placeholder="write something"
              onChange={setDraft}
              onSave={commit}
              onCancel={discard}
              onFocus={() => setWriting(true)}
              onBlur={() => setWriting(false)}
            />

            <div className="note-foot">
              <span className="note-hint">
                {status ||
                  (dirty ? 'unsaved' : writing ? '~ at the start crosses a line out' : 'write on it')}
              </span>
              {dirty ? (
                <>
                  <button type="button" className="note-ok" onClick={commit} disabled={busy}>
                    {busy ? 'saving' : 'save'}
                  </button>
                  <button type="button" className="note-undo" onClick={discard}>
                    undo
                  </button>
                </>
              ) : null}
            </div>

          </>
        ) : null}

        {style === 'margin' && open ? <Arrow /> : null}
      </div>
    </aside>
  );
};

export default Notes;
