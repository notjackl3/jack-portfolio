// The data files carry emoji (experience notes open with one, award suffixes
// end with a trophy). v5 renders without them; the data is left untouched so
// the archived v4 build still shows them.
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{E0020}-\u{E007F}]/gu;

export const plain = (value) =>
  String(value ?? '')
    .replace(EMOJI, '')
    .replace(/\s{2,}/g, ' ')
    // Only where the punctuation ends a word — "Best .tech domain" keeps its space.
    .replace(/\s+([,.;:!?])(?=\s|$)/g, '$1')
    .replace(/[\s,·—-]+$/, '')
    .trim();

// v5 sets everything in lower case. Capitals that exist only for formality —
// sentence openings, the pronoun, headings, job titles, award wording — come
// off; names keep theirs. The data is shared with the live v4 site, so this
// happens here at render time rather than in src/data.
//
// A word reads as a name when it carries a capital past its first letter:
// AI, AI/ML, SOON, SkySync, Backboard.IO. Names that are spelled like an
// ordinary word, where that test can't help, are listed instead.
const NAMES = new Set(['toronto', 'kingston', 'google']);

// Acronyms that stand for a common noun rather than a name, so they come
// down with everything else. Anything not listed here — SOON, UTRA, VNG,
// AWS, KNOWIDEA — is somebody's name and keeps its capitals.
const GENERIC = /\b(?:AI|ML|LLM|RAG|API|UI|UX|VR|ATS|CEO)\b/g;

// Names that happen to contain one of those acronyms. They are lifted out
// before the acronym pass and put back after it, so "The AI Fellowship" and
// "the ai hackathon" can sit in the same sentence.
const NAME_PHRASES = [
  'The AI Fellowship',
  'AI Agents Voice Hackathon',
  'AI Voice Agent Hackathon',
  'AWS AI League',
  'Face Detection API',
];

const PHRASES = new RegExp(
  NAME_PHRASES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g'
);

const isName = (word) => /[A-Z]/.test(word.slice(1)) || NAMES.has(word.toLowerCase());

const lowerWord = (word) => (isName(word) ? word : word.toLowerCase());

const lowerGeneric = (text) => {
  const held = [];
  return String(text)
    .replace(PHRASES, (m) => `\u0000${held.push(m) - 1}\u0000`)
    .replace(GENERIC, (a) => a.toLowerCase())
    .replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
};

// Sentences: the opening letter, the pronoun and the generic acronyms are
// formality. Every other capital is mid-sentence, which in this prose means
// it is a name.
export const lowerProse = (value) =>
  lowerGeneric(String(value ?? ''))
    .replace(
      /(^|[.!?]['"”’)\]]?\s+)(['"“‘([]?)([A-Za-z][A-Za-z'’]*)/g,
      // "I" is left to the pronoun pass below, which can tell the pronoun
      // from the "Vol. I" in a name — a period before it is not always the
      // end of a sentence.
      (all, lead, open, word) =>
        isName(word) || /^I['’]?$/.test(word) ? all : lead + open + lowerWord(word)
    )
    // The pronoun only: "I" before a colon or a capital is something else,
    // like the "Vol. I" in an event's name.
    .replace(/\bI\b(?=['’]|\s+[a-z]|[,.!?](?:\s|$))/g, 'i');

// Job titles, headings, nav items, filters: no names in them beyond the
// occasional place, so these go all the way down.
export const lowerTitle = (value) =>
  lowerGeneric(String(value ?? '')).replace(/[A-Za-z][A-Za-z'’.]*/g, (word) =>
    NAMES.has(word.toLowerCase()) ? word : word.toLowerCase()
  );

// Award wording, where the surrounding event or sponsor is named and must
// survive: "Best use of Backboard.IO", "City of Kingston Challenge Winner".
// Hyphens and slashes are left out of a word so "Photo/Video" lowers both
// halves; the dot stays in, to hold "Backboard.IO" together.
export const lowerLabel = (value) =>
  String(value ?? '').replace(/[A-Za-z][A-Za-z'’.]*/g, lowerWord);

// "May 2026 - Present" → "May 2026 - present", and "November 2026 -
// December 2026" → "Nov 2026 - Dec 2026". The month is a name, so it keeps
// its capital, cut to three letters; "Present" is not a name.
export const lowerDuration = (value) =>
  String(value ?? '')
    .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/g, '$1')
    .replace(/\bPresent\b/g, 'present');

// A project note is "<event>" or "<event>, <award>". The event is a name and
// stays as written; only the award wording comes down.
export const lowerNote = (value) => {
  const text = String(value ?? '');
  const at = text.lastIndexOf(',');
  return at === -1 ? text : text.slice(0, at + 1) + lowerLabel(text.slice(at + 1));
};

export default plain;
