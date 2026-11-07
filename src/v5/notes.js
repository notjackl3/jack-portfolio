// The corner note — one sheet of writing, not a list of fields.
//
// This file is the *original*. Anyone visiting the site can write on the
// napkin, and what they write lives in Blob behind /api/goals as an overlay
// on top of this; the text below is what the napkin says when nobody has.
// `npm run goals -- revert` puts it back to exactly this.
//
// It is a free-form document: lines, in order, nothing more. A line opening
// with `~` is struck through — that is the only mark there is, and it is a
// mark you can type, so the napkin never needs a toolbar.
//
// PLACEHOLDER CONTENT — the struck lines are real (they come out of blog.js
// and the intro copy); the rest are stand-ins. Replace them.

export const note = {
  title: 'things i want to do',

  body: [
    '~ hackathon in a mansion',
    '~ rap to 2,000 people',
    '~ 15 hackathons in a row',
    'ship something a million people use',
    'learn my dad’s guitar, badly',
    'back to vietnam, my own money',
    'draw my mum properly, in pencil',
    'see the northern lights',
    'sleep eight hours',
    '~ become a morning person',
  ].join('\n'),
};

// Everything the napkin will hold. The server enforces the same numbers —
// these only stop the canvas running past the paper while someone types.
export const LIMITS = { body: 760, line: 64, lines: 16 };

export default note;
