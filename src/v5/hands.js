// The hands the napkin can be written in.
//
// The default is the page's own typeface — the note is quietest when it is
// set in the same face as everything around it, and that is the one most
// visitors should see. The handwriting faces are there for anyone who wants
// them, one pick away in the fx panel.
//
// Only the page font and Caveat are in index.html's font request. The rest are
// fetched the first time somebody picks one, so trying every hand costs a
// stylesheet each and the page everyone else loads stays as heavy as it was.
//
// `scale` is per font, not decoration: these faces disagree wildly about how
// big 16px is — Instrument Sans sets a far larger x-height than Caveat — so
// without it, switching hand also silently resizes the note.

export const HANDS = [
  { id: 'default', label: 'default', css: 'var(--font)', scale: 0.87, google: null },
  { id: 'caveat', label: 'caveat', css: "'Caveat', cursive", scale: 1, google: null },
  { id: 'patrick', label: 'patrick', css: "'Patrick Hand', cursive", scale: 0.94, google: 'Patrick+Hand' },
  { id: 'kalam', label: 'kalam', css: "'Kalam', cursive", scale: 0.88, google: 'Kalam:wght@300;400' },
  { id: 'architect', label: 'architect', css: "'Architects Daughter', cursive", scale: 0.84, google: 'Architects+Daughter' },
  { id: 'shadows', label: 'shadows', css: "'Shadows Into Light', cursive", scale: 1.02, google: 'Shadows+Into+Light' },
  { id: 'indie', label: 'indie', css: "'Indie Flower', cursive", scale: 0.92, google: 'Indie+Flower' },
];

export const DEFAULT_HAND = 'default';

export const handOf = (id) => HANDS.find((h) => h.id === id) || HANDS[0];

// Adds the stylesheet once per font, and never for the two already in the
// document head.
const loaded = new Set();

export const loadHand = (id) => {
  const hand = handOf(id);
  if (!hand.google || loaded.has(hand.id)) return;
  loaded.add(hand.id);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${hand.google}&display=swap`;
  document.head.appendChild(link);
};
