import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { projects } from '../../data/projects';
import { lowerNote, lowerProse, plain } from '../text';
import Preview from './Preview';
import FilterSentence from './FilterSentence';

// Titles in the data carry their own suffix ("| Hack The 6ix, Winner 🏆").
// Split it so the row stays short and the note sits on the right. The name is
// the project's own, so it keeps its capitals; the note's award wording does not.
const split = (title) => {
  const [name, ...rest] = title.split('|');
  return { name: plain(name), note: lowerNote(plain(rest.join('|'))) };
};

// Nothing is chosen until a word in the sentence is pressed, and until then
// the sentence is all there is.
const matches = (p, f) => (f === 'all' ? true : p.category === f);

const Projects = () => {
  const [filter, setFilter] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const pointer = useRef(null);
  const listRef = useRef(null);

  // The preview belongs to the title, not the whole row. `.proj-name` is a
  // stretched flex item, so measure the text itself and allow a little
  // slack past the end of it.
  //
  // An open row answers for itself — the description is right there — so the
  // screenshot only stands in for rows that are still shut. Read the state
  // off the DOM rather than from `openId`: this runs from a scroll handler
  // that closes over the first render.
  const idNearName = (row, x) => {
    if (!row || row.dataset.open === 'true') return null;
    const name = row.querySelector('.proj-name');
    if (!name) return null;
    const range = document.createRange();
    range.selectNodeContents(name);
    const box = range.getBoundingClientRect();
    if (x > box.right + 28) return null;
    return Number(row.dataset.id);
  };

  // Scrolling the list under a stationary pointer should change the preview
  // too, so re-test what's under the cursor on every scroll.
  const underPointer = useCallback(() => {
    const at = pointer.current;
    if (!at) return;
    const row = document.elementFromPoint(at.x, at.y)?.closest?.('.proj');
    setPreviewId(idNearName(row, at.x));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', underPointer, { passive: true });
    return () => window.removeEventListener('scroll', underPointer);
  }, [underPointer]);

  const onPointerMove = (e) => {
    pointer.current = { x: e.clientX, y: e.clientY };
    const id = idNearName(e.target.closest?.('.proj'), e.clientX);
    setPreviewId((prev) => (prev === id ? prev : id));
  };

  const onLeave = () => {
    setPreviewId(null);
  };

  const shown = useMemo(() => (filter ? projects.filter((p) => matches(p, filter)) : []), [filter]);

  return (
    <div className="wrap">
      <section className="rise">
        <FilterSentence
          value={filter}
          onChange={(id) => {
            setFilter(id);
            setOpenId(null);
          }}
        >
          {(w) => (
            <>
              show me {w('all', 'everything i built')}, or just the {w('hackathon', 'hackathon builds')},{' '}
              the {w('personal', 'personal projects')} or the {w('school', 'school work')}.
            </>
          )}
        </FilterSentence>

        <div
          key={filter}
          ref={listRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onLeave}
        >
          {shown.map((p, i) => {
            const { name, note } = split(p.title);
            const open = openId === p.id;
            return (
              <div
                className="proj rise"
                id={`p-${p.id}`}
                data-id={p.id}
                key={p.id}
                data-open={open ? 'true' : 'false'}
                style={{ '--d': `${Math.min(i, 12) * 22}ms` }}
              >
                <button
                  type="button"
                  className="proj-head"
                  aria-expanded={open}
                  onClick={() => {
                    // Opening pulls the screenshot immediately; the pointer is
                    // still on the name, so nothing else would clear it. Closing
                    // gives it back, once the attribute has actually flipped.
                    if (open) requestAnimationFrame(underPointer);
                    else setPreviewId(null);
                    setOpenId(open ? null : p.id);
                  }}
                >
                  <span className="proj-name">{name}</span>
                  <span className="proj-note">{note || p.category}</span>
                </button>

                <div className="proj-body">
                  <div>
                    <div className="proj-body-inner">
                      <p className="proj-desc">{lowerProse(plain(p.description))}</p>
                      {p.technologies?.length ? (
                        <p className="proj-tech">{p.technologies.join(', ')}</p>
                      ) : null}
                      {p.githubUrl || p.liveUrl ? (
                        <div className="proj-links">
                          {p.githubUrl ? (
                            <a className="link" href={p.githubUrl} target="_blank" rel="noopener noreferrer">
                              source
                            </a>
                          ) : null}
                          {p.liveUrl ? (
                            <a className="link" href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                              live
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Preview
        src={shown.find((p) => p.id === previewId)?.image}
        label={previewId ? split(projects.find((p) => p.id === previewId).title).name : ''}
        pointerRef={pointer}
      />
    </div>
  );
};

export default Projects;
