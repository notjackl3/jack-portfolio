import React, { useState } from 'react';
import { lowerProse, plain } from '../text';
import Lightbox from './Lightbox';

// The list of write-ups, as headlines that open one at a time. The blog uses
// it for Jack's LinkedIn posts; the hackathons tab uses it twice, once for
// the streak and once for the hackathons that sit outside it. An open entry
// is just the writing — the photos are a click further in, so reading the
// page never pulls a single image down the wire.
//
// Callers hand over entries already shaped for display:
//   { key, id, title, aside, asideLabel, meta, body, images }
// `title`, `aside` and `meta` are rendered as given (a hackathon keeps its
// name's capitals; a blog headline is lowercased by its caller), and `body`
// is paragraphs, where one opening with "- " or "1. " is a list item.

const BULLET = /^[-–—]\s+/;
const NUMBERED = /^\d+\.\s+/;

const marker = (line) => (BULLET.test(line) ? 'bullet' : NUMBERED.test(line) ? 'number' : null);
const strip = (line) => line.replace(BULLET, '').replace(NUMBERED, '');

// Consecutive list paragraphs become one list; everything else stays a <p>.
const group = (body) =>
  body.reduce((out, line) => {
    const kind = marker(line);
    const last = out[out.length - 1];
    if (kind && last?.kind === kind) last.items.push(strip(line));
    else if (kind) out.push({ kind, items: [strip(line)] });
    else out.push({ kind: null, text: line });
    return out;
  }, []);

const Posts = ({ entries, variant }) => {
  const [openKey, setOpenKey] = useState(null);
  const [gallery, setGallery] = useState(null);

  return (
    <>
      {entries.map((entry, i) => {
        const open = openKey === entry.key;
        const photos = entry.images || [];
        return (
          <article
            className={`post rise${variant ? ` post--${variant}` : ''}`}
            id={entry.id}
            key={entry.key}
            data-open={open ? 'true' : 'false'}
            data-rail-target
            style={{ '--d': `${Math.min(i, 12) * 22}ms` }}
          >
            <button
              type="button"
              className="post-head"
              aria-expanded={open}
              onClick={() => setOpenKey(open ? null : entry.key)}
            >
              <span className="post-title">{entry.title}</span>
              {entry.aside ? (
                <span className="post-aside" title={entry.asideLabel} aria-label={entry.asideLabel}>
                  {entry.aside}
                </span>
              ) : null}
              {entry.meta ? <span className="post-date">{entry.meta}</span> : null}
            </button>

            <div className="post-body">
              <div>
                <div className="post-body-inner">
                  {group(entry.body).map((block, b) =>
                    block.kind ? (
                      // eslint-disable-next-line react/no-array-index-key
                      <ul className="post-list" key={b}>
                        {block.items.map((item) => (
                          <li key={item}>{lowerProse(plain(item))}</li>
                        ))}
                      </ul>
                    ) : (
                      // eslint-disable-next-line react/no-array-index-key
                      <p className="post-para" key={b}>
                        {lowerProse(plain(block.text))}
                      </p>
                    )
                  )}

                  {photos.length ? (
                    <button
                      type="button"
                      className="photos-btn"
                      onClick={() => setGallery(entry)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                        <rect x="3" y="6" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M20 8.5v9A2.5 2.5 0 0 1 17.5 20H7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <circle cx="7.6" cy="10.2" r="1.2" fill="currentColor" />
                        <path d="M4 15.2 8 11.6l4.5 4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      view {photos.length} pictures
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}

      {gallery ? (
        <Lightbox title={gallery.title} images={gallery.images} onClose={() => setGallery(null)} />
      ) : null}
    </>
  );
};

export default Posts;
