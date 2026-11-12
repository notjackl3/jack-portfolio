import React from 'react';

// Filters written as a sentence rather than a row of tabs — the same idea as
// the work page's chooser, one size down. The caller writes the sentence;
// `w(id, text)` drops an option into it as a word you can press.
//
// Nothing is chosen to begin with, and pressing the chosen word again lets
// go of it — so the page can be just the sentence until someone picks.
//
//   <FilterSentence value={filter} onChange={setFilter}>
//     {(w) => <>show me {w('all', 'everything')}, or just {w('x', 'the x ones')}.</>}
//   </FilterSentence>
const FilterSentence = ({ value, onChange, children }) => {
  const w = (id, text) => (
    <button
      type="button"
      className="wx-word"
      aria-pressed={value === id}
      onClick={() => onChange(value === id ? null : id)}
    >
      <span className="wx-word-text">{text}</span>
    </button>
  );

  return (
    <p className="wx-sentence wx-sentence--small" data-open={value ? 'true' : 'false'}>
      {children(w)}
    </p>
  );
};

export default FilterSentence;
