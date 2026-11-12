import React, { useCallback, useEffect, useState } from 'react';
import Nav from './components/Nav';
import Backdrop from './components/Backdrop';
import Boot from './components/Boot';
import Rail from './components/Rail';
import FxPanel from './components/FxPanel';
import Cursor, { POINTERS } from './components/Cursor';
import CursorBed from './cursor-bed/CursorBed';
import { DEFAULT_HAND } from './hands';
import Home from './components/Home';
import Projects from './components/Projects';
import Experience from './components/Experience';
import Work from './components/Work';
import Streak from './components/Streak';
import Letters from './components/Letters';

import './styles/00-base.css';
import './styles/05-boot.css';
import './styles/10-nav.css';
import './styles/20-home.css';
import './styles/30-projects.css';
import './styles/35-work.css';
import './styles/40-experience.css';
import './styles/50-streak.css';
import './styles/55-blog.css';
import './styles/57-lightbox.css';
import './styles/60-contact.css';
import './styles/70-activity.css';
import './styles/90-rail.css';
import './styles/95-fx.css';
import './styles/96-cursor.css';
import './styles/97-notes.css';
import './styles/98-bed.css';

const TABS = [
  { id: 'home', label: 'home' },
  { id: 'work', label: 'work' },
  { id: 'hackathons', label: 'competitions' },
  { id: 'others', label: 'others' },
];

// Pages that left the nav but still answer their old links: projects and
// experience live under `work` now, blog and contact under `others`.
const FOLDED = { projects: 'work', experience: 'work', blog: 'others', contact: 'others' };
const TAB_IDS = [...TABS.map((t) => t.id), ...Object.keys(FOLDED)];

// The tab lives in the hash, which is path-independent — it survived v5
// moving from its own entry onto the root, and it means deep links never
// depend on the SPA rewrite.
const readHash = () => {
  if (typeof window === 'undefined') return 'home';
  const id = window.location.hash.replace(/^#\/?/, '').split('/')[0].toLowerCase();
  return TAB_IDS.includes(id) ? id : 'home';
};

const readStored = (key, fallback) => {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState(readHash);
  const [fx, setFx] = useState(() => readStored('v5-fx', 'none'));
  const [palette, setPalette] = useState(() => readStored('v5-palette', 'sunrise'));
  // `invert` and `dot` were dropped from the roster, and anyone who picked
  // one still has it in storage. An unknown id matches no CSS at all, so it
  // would restore as a pointer that draws nothing — fall back instead.
  const [pointer, setPointer] = useState(() => {
    const stored = readStored('v5-pointer', 'ring');
    return POINTERS.some((p) => p.id === stored) ? stored : 'ring';
  });
  const [noteStyle, setNoteStyle] = useState(() => readStored('v5-note', 'napkin'));
  const [hand, setHand] = useState(() => readStored('v5-hand', DEFAULT_HAND));

  const store = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage can be blocked — the choice just won't persist */
    }
  };

  const changeFx = (next) => {
    setFx(next);
    store('v5-fx', next);
  };

  const changePalette = (next) => {
    setPalette(next);
    store('v5-palette', next);
  };

  // Also how a shape is taken out of the box: choosing a design and picking
  // one up are the same move, so they are the same path. Whatever was in
  // your hand goes back — the box works that out for itself from the fact
  // that it is now loose, which is why there is no separate drop control.
  const changePointer = useCallback((next) => {
    setPointer(next);
    store('v5-pointer', next);
  }, []);

  const changeNote = (next) => {
    setNoteStyle(next);
    store('v5-note', next);
  };

  const changeHand = (next) => {
    setHand(next);
    store('v5-hand', next);
  };

  useEffect(() => {
    const onHash = () => setActiveTab(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (tabId) => {
    setActiveTab(tabId);
    const next = tabId === 'home' ? '#/' : `#/${tabId}`;
    if (window.location.hash !== next) {
      window.history.pushState(null, '', next);
      // pushState fires nothing, so a tab that reads a sub-path from the
      // hash (work's open drawer) would never hear that it went back to
      // its own root. Tell everyone the hash moved.
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
    window.scrollTo(0, 0);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'projects':
        return <Projects />;
      case 'experience':
        return <Experience />;
      case 'work':
        return <Work />;
      case 'hackathons':
        return <Streak />;
      case 'others':
        return <Letters />;
      // The old addresses land on the part of `others` they used to be.
      case 'blog':
        return <Letters />;
      case 'contact':
        return <Letters toContact />;
      case 'home':
      default:
        return <Home noteStyle={noteStyle} hand={hand} />;
    }
  };

  return (
    <div className="v5">
      <Boot />
      <Backdrop mode={fx} palette={palette} />
      <Cursor mode={pointer} />
      <Nav
        tabs={TABS}
        activeTab={FOLDED[activeTab] || activeTab}
        onNavigate={navigate}
        aside={<CursorBed pointer={pointer} onEquip={changePointer} />}
      />

      {/* Keyed on the tab so each panel plays its entrance once. */}
      <main className="v5-main" key={activeTab}>
        {renderTab()}
      </main>

      {/* Outside <main>: the rail measures that subtree, so it must not be
          part of it — its own ticks and label would be measured, and its
          own DOM writes would trigger the re-measure observer. */}
      <Rail resetKey={activeTab} />

      <footer className="v5-footer wrap">Toronto</footer>

      {/* Home only. It is a note left on the front of the site, and on a
          page of projects or writing it would be one more thing competing
          with the content. Outside <main> so it is pinned to the window
          rather than to the tab's layout. */}

      <FxPanel
        mode={fx}
        onChange={changeFx}
        palette={palette}
        onPalette={changePalette}
        pointer={pointer}
        onPointer={changePointer}
        note={noteStyle}
        onNote={changeNote}
        hand={hand}
        onHand={changeHand}
      />
    </div>
  );
}

export default App;
