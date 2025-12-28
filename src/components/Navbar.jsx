import React, { useEffect, useRef, useState } from 'react';

const Navbar = ({ onNavigate, activeTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'skills', label: 'Skills' },
    { id: 'contact', label: 'Contact' }
  ];

  useEffect(() => {
    const onPointerDown = (e) => {
      if (!isMenuOpen) return;
      if (navRef.current && !navRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (!isMenuOpen) return;
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    // Close the mobile menu when switching to desktop layout
    const mq = window.matchMedia('(min-width: 769px)');
    const onChange = (e) => {
      if (e.matches) setIsMenuOpen(false);
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return (
    <nav className={`navbar ${isMenuOpen ? 'navbar--menu-open' : ''}`} ref={navRef}>
      <div className="nav-container">
        <button
          type="button"
          className="nav-hamburger"
          aria-label="Explore more"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <span className="nav-hamburger-label">≡</span>
        </button>

        <div className="nav-links" aria-label="Primary navigation">
          {navItems.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
              className={activeTab === item.id ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {isMenuOpen && (
        <div className="nav-dropdown" role="menu" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                onNavigate(item.id);
              }}
              className={activeTab === item.id ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
