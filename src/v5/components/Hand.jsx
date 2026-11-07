import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

// Handwriting, letter by letter.
//
// Caveat already looks written, but every "a" in it is the same "a", and at
// this size the repetition is what gives it away as a font. So each glyph
// gets its own small rotation, rise and tracking.
//
// The jitter is derived from the glyph and where it sits, never from
// random(): the same words wiggle the same way for every visitor, on every
// render, on every machine. That is what lets it be applied live while
// somebody types, without the letters already written dancing as they go.

const FNV = (str) => {
  let n = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    n ^= str.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
};

const mix = (seed, i) => {
  let n = seed ^ Math.imul(i + 1, 2654435761);
  n ^= n >>> 15;
  n = Math.imul(n, 2246822507);
  n ^= n >>> 13;
  return (n >>> 0) / 4294967295;
};

const swing = (seed, i) => mix(seed, i) * 2 - 1; // −1..1

// A letter tilted two degrees still reads as that letter. A comma does not —
// it reads as a comma that has come loose. Punctuation keeps its place and
// takes a quarter of the movement.
const LETTER = /[\p{L}\p{N}]/u;

const Word = ({ word, from }) =>
  Array.from(word).map((ch, ci) => {
    const seed = FNV(`${ch}${from + ci}`);
    const d = LETTER.test(ch) ? 1 : 0.25;
    return (
      <span
        className="hw-c"
        key={ci}
        style={{
          '--cr': `${(swing(seed, 1) * 2.4 * d).toFixed(2)}deg`,
          '--cy': `${(swing(seed, 2) * 0.85 * d).toFixed(2)}px`,
          '--ct': `${(swing(seed, 3) * 0.3 * d).toFixed(2)}px`,
        }}
      >
        {ch}
      </span>
    );
  });

// A line opening with `~` is struck through. The tilde stays in the DOM and
// is only dimmed, never hidden: the canvas is contentEditable, and the caret
// is placed by counting characters, so what is rendered has to be exactly
// what is in the text — a glyph removed for looks puts every caret after it
// one place out.
const renderLine = (line, base) => {
  const struck = line.startsWith('~');
  // Spaces stay outside the inline-blocks, so a long line still wraps at
  // its words rather than mid-word.
  const parts = line.split(/(\s+)/).filter((p) => p !== '');
  let at = 0;

  const inner = parts.map((part, pi) => {
    const from = at;
    at += part.length;
    if (/^\s+$/.test(part)) return <React.Fragment key={`s${pi}`}>{part}</React.Fragment>;
    const mark = struck && from === 0;
    return (
      <span className={mark ? 'hw-w hw-mark' : 'hw-w'} key={`w${pi}`}>
        <Word word={part} from={base + from} />
      </span>
    );
  });

  return <span className={struck ? 'hw-l is-struck' : 'hw-l'}>{inner}</span>;
};

export const Glyphs = ({ text }) => {
  const lines = useMemo(() => String(text ?? '').split('\n'), [text]);
  let base = 0;

  return lines.map((line, li) => {
    const node = (
      <React.Fragment key={li}>
        {/* A real newline character, not a <br>: the caret is placed by
            counting the text content, and a <br> counts for nothing.
            `white-space: pre-wrap` on the canvas turns it into the break. */}
        {li > 0 ? '\n' : null}
        {renderLine(line, base)}
      </React.Fragment>
    );
    base += line.length + 1;
    return node;
  });
};

// ── Writing on it ──
//
// contentEditable rather than a textarea, because a textarea cannot style
// its own letters and the whole point is that the words wiggle as they are
// typed. React owns the spans, so every keystroke replaces the text nodes
// under the caret and the caret has to be put back by hand.

// Exactly the string Range.toString() counts over, so the caret arithmetic
// below and the text model can never disagree about where a character is.
const domText = (root) => {
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let out = '';
  let node = walk.nextNode();
  while (node) {
    out += node.textContent;
    node = walk.nextNode();
  }
  return out;
};

const caretAt = (root) => {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const live = sel.getRangeAt(0);
  if (!root.contains(live.endContainer)) return null;
  const upto = live.cloneRange();
  upto.selectNodeContents(root);
  upto.setEnd(live.endContainer, live.endOffset);
  return upto.toString().length;
};

// Both ends, as offsets into the text — a selection being replaced needs
// to know what it covers, not just where the caret blinks.
const selectionIn = (root) => {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const live = sel.getRangeAt(0);
  if (!root.contains(live.startContainer) || !root.contains(live.endContainer)) return null;
  const before = live.cloneRange();
  before.selectNodeContents(root);
  before.setEnd(live.startContainer, live.startOffset);
  const start = before.toString().length;
  return { start, end: start + live.toString().length };
};

const putCaret = (root, offset) => {
  const sel = window.getSelection();
  if (!sel) return;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let seen = 0;
  let node = walk.nextNode();
  while (node) {
    const len = node.textContent.length;
    if (seen + len >= offset) {
      range.setStart(node, Math.max(0, offset - seen));
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    seen += len;
    node = walk.nextNode();
  }
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
};

export const HandCanvas = ({
  value,
  onChange,
  onSave,
  onCancel,
  onFocus,
  onBlur,
  max,
  maxLines,
  className = '',
  placeholder,
}) => {
  const ref = useRef(null);
  const caret = useRef(null);
  // The handler is rebuilt on every keystroke because it closes over the
  // current text; the ref is what the listener actually calls, so the
  // listener itself is only attached once.
  const apply = useRef(null);
  // Taking the DOM away from the browser takes its undo stack with it, so
  // the canvas keeps its own. Snapshots of the whole text — it is under a
  // kilobyte, and a diff would be more code than it saves.
  const undos = useRef([]);
  const redos = useRef([]);
  const lastEdit = useRef({ type: null, at: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || caret.current == null) return;
    putCaret(el, caret.current);
    caret.current = null;
    // The canvas is a fixed ten lines with the rest scrolled, and a caret
    // moved by a render does not bring itself into view the way one moved
    // by the browser would — type past the bottom and the words would go on
    // appearing somewhere below the fold.
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const at = sel.getRangeAt(0).getBoundingClientRect();
    if (!at || (!at.top && !at.bottom)) return;
    const box = el.getBoundingClientRect();
    if (at.top < box.top) el.scrollTop -= box.top - at.top;
    else if (at.bottom > box.bottom) el.scrollTop += at.bottom - box.bottom;
  });

  // Replace the whole text and say where the caret should land in it.
  const set = (next, at) => {
    const capped = next.slice(0, max);
    caret.current = Math.max(0, Math.min(at, capped.length));
    onChange(capped);
  };

  // One undo step per run of typing rather than per character: a new step
  // starts when the kind of edit changes, when whitespace is typed (which
  // is where a word ends), or after a pause.
  const remember = (type, data, at) => {
    const now = Date.now();
    const run =
      type === 'insertText' &&
      !/\s/.test(data || '') &&
      lastEdit.current.type === 'insertText' &&
      now - lastEdit.current.at < 700;
    if (!run) {
      undos.current.push({ text: value, caret: at });
      if (undos.current.length > 120) undos.current.shift();
    }
    lastEdit.current = { type, at: now };
    redos.current.length = 0;
  };

  // Cross out, or un-cross, every line the selection touches. The mark is a
  // `~` at the head of the line — typing one does the same thing, and this
  // is only the shortcut for it, so there is still exactly one way a struck
  // line is stored and it survives a save as plain text.
  const strike = () => {
    const sel = selectionIn(ref.current);
    if (!sel) return;
    const lines = value.split('\n');

    // Which lines the selection covers, counting a collapsed caret as the
    // one line it sits on.
    let at = 0;
    let first = -1;
    let last = -1;
    lines.forEach((line, i) => {
      const from = at;
      const to = at + line.length;
      if (sel.start <= to && sel.end >= from) {
        if (first < 0) first = i;
        last = i;
      }
      at = to + 1;
    });
    if (first < 0) return;

    // Already all struck means the shortcut takes the mark off again.
    const off = lines.slice(first, last + 1).every((l) => l.startsWith('~'));

    let shift = 0;
    let own = 0;
    at = 0;
    const next = lines.map((line, i) => {
      const from = at;
      at += line.length + 1;
      if (i < first || i > last) return line;
      const out = off ? line.replace(/^~[^\S\n]?/, '') : `~ ${line}`;
      const delta = out.length - line.length;
      // Everything before the caret's line pushes it along; its own line
      // pushes it only as far as the line's new start.
      if (sel.start > from + line.length) shift += delta;
      else if (sel.start >= from && own === 0) own = delta;
      return out;
    });

    const moved = Math.max(0, sel.start + shift + own);
    remember('strike', null, sel.start);
    set(next.join('\n'), moved);
  };

  // Undo and redo, from the canvas's own stacks.
  //
  // These are driven from keydown rather than from beforeinput, even though
  // beforeinput reports `historyUndo`. Refusing every edit means the
  // browser's own undo stack never gets an entry, and with nothing in it
  // ⌘Z emits no beforeinput at all — so the event this would hang off never
  // arrives.
  const travel = (back) => {
    const from = back ? undos : redos;
    const to = back ? redos : undos;
    const step = from.current.pop();
    if (!step) return;
    const at = selectionIn(ref.current)?.start ?? value.length;
    to.current.push({ text: value, caret: at });
    lastEdit.current = { type: null, at: 0 };
    set(step.text, step.caret);
  };

  // Every edit is intercepted before the browser makes it, applied to the
  // text instead, and re-rendered from there.
  //
  // This is the whole reason the canvas works. React builds the glyph spans
  // from `value` and diffs against what it rendered last — it has no idea
  // contentEditable has been writing to the DOM underneath it. Let the
  // browser insert the character itself and the two disagree, React skips
  // the spans it thinks are unchanged, and the text quietly corrupts:
  // typing ", one day" came out as ", one day, one day, one da, one d, ...".
  // So nothing is allowed to touch the DOM except a render.
  apply.current = (e) => {
    const el = ref.current;
    const sel = selectionIn(el);
    if (!sel) return;
    const { start, end } = sel;
    const type = e.inputType;

    const splice = (insert, from = start, to = end) => {
      e.preventDefault();
      remember(type, e.data, start);
      set(value.slice(0, from) + insert + value.slice(to), from + insert.length);
    };

    if (type === 'insertText' && e.data != null) return splice(e.data);

    if (type === 'insertLineBreak' || type === 'insertParagraph') {
      // ⌘/ctrl+enter saves instead; that is handled on keydown.
      if (start === end && value.split('\n').length >= maxLines) return e.preventDefault();
      return splice('\n');
    }

    if (type === 'insertFromPaste' || type === 'insertFromDrop') {
      const text = e.dataTransfer?.getData('text/plain') ?? '';
      return splice(text.replace(/\r\n?/g, '\n'));
    }

    if (type === 'deleteContentBackward') {
      if (start !== end) return splice('');
      if (start === 0) return e.preventDefault();
      return splice('', start - 1, start);
    }

    if (type === 'deleteContentForward') {
      if (start !== end) return splice('');
      if (end >= value.length) return e.preventDefault();
      return splice('', start, start + 1);
    }

    if (type === 'deleteWordBackward') {
      if (start !== end) return splice('');
      const run = value.slice(0, start).match(/\S*[^\S\n]*$/)?.[0].length || 1;
      return splice('', start - run, start);
    }

    if (type === 'deleteWordForward') {
      if (start !== end) return splice('');
      const run = value.slice(end).match(/^[^\S\n]*\S*/)?.[0].length || 1;
      return splice('', start, end + run);
    }

    // Styling commands and anything else the browser might try: the napkin
    // has one typeface, and nothing here can set another.
    e.preventDefault();
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onBeforeInput = (e) => apply.current?.(e);
    el.addEventListener('beforeinput', onBeforeInput);
    return () => el.removeEventListener('beforeinput', onBeforeInput);
  }, []);

  return (
    <div
      ref={ref}
      className={`hw hw-canvas ${className}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      data-placeholder={placeholder}
      spellCheck={false}
      onFocus={onFocus}
      onBlur={onBlur}
      // Safety net. beforeinput covers typing, deleting and pasting, but an
      // IME commits without one — if the DOM has drifted from the text for
      // any reason, the DOM is what the person can see, so it wins.
      onInput={() => {
        const el = ref.current;
        const dom = domText(el);
        if (dom !== value) set(dom, caretAt(el) ?? dom.length);
      }}
      onKeyDown={(e) => {
        const cmd = e.metaKey || e.ctrlKey;
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel?.();
        } else if (e.key === 'Enter' && cmd) {
          e.preventDefault();
          onSave?.();
        } else if (cmd && (e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          travel(!e.shiftKey);
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
          e.preventDefault();
          travel(false);
        } else if (cmd && (e.key === 'd' || e.key === 'D')) {
          e.preventDefault();
          strike();
        }
      }}
    >
      <Glyphs text={value} />
    </div>
  );
};

const Hand = ({ text, className = '' }) => (
  <span className={`hw ${className}`}>
    <Glyphs text={text} />
  </span>
);

export default Hand;
