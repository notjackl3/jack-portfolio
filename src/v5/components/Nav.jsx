import React, { useEffect, useRef, useState } from 'react';
import duck from '../../assets/duck.jpg';
import me from '../../assets/me.jpeg';

const Nav = ({ tabs, activeTab, onNavigate, aside }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // The menu only exists under the nav's breakpoint, so anything that takes
  // the page out from under it — a resize past that width, a click
  // elsewhere, Escape — closes it rather than leaving it hanging open.
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      if (e.type === 'pointerdown' && ref.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', close);
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const go = (id) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <nav className={`nav wrap${open ? ' is-open' : ''}`} ref={ref}>
      <a
        className="nav-mark"
        href="/"
        aria-label="Jack Le, home"
        onClick={(e) => {
          e.preventDefault();
          go('home');
        }}
      >
        <img className="avatar" src={duck} alt="" />
        <img className="avatar" src={me} alt="" />
      </a>

      {/* Sits with the mark rather than in the links: it is a thing you set,
          not a place you go. It holds a fixed footprint here and opens over
          the page, so the nav does not grow when you point at it. */}
      {aside}

      {/* Only ever visible under the nav's breakpoint; above it the links
          are the nav and this is not rendered to the screen at all. */}
      <button
        type="button"
        className="nav-burger"
        aria-expanded={open}
        aria-controls="nav-links"
        aria-label={open ? 'close menu' : 'open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-bar" />
        <span className="nav-bar" />
      </button>

      <div className="nav-links" id="nav-links">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            className="nav-link"
            href={tab.id === 'home' ? '/' : `/${tab.id}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(tab.id);
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
};

export default Nav;
