import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProjectsSection from './components/ProjectsSection';
import WorkSection from './components/WorkSection';
import ExperiencesSection from './components/ExperiencesSection';
import ContactSection from './components/ContactSection';
import SkillsSection from './components/SkillsSection';
import HackathonsSection from './components/HackathonsSection';
import BackgroundMap from './components/BackgroundMap';
import { workProjects } from './data/work';

const TAB_IDS = ['home', 'projects', 'work', 'experiences', 'hackathons', 'contact'];

// Resolve the initial tab (and optional work-project deep link) from the URL,
// so paths like /work, /aucctus, or /teb open the right view directly.
const parseInitialRoute = () => {
  if (typeof window === 'undefined') return { tab: 'home', workSlug: null };
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!path) return { tab: 'home', workSlug: null };
  if (TAB_IDS.includes(path)) return { tab: path, workSlug: null };
  if (workProjects.some((p) => p.slug === path)) return { tab: 'work', workSlug: path };
  return { tab: 'home', workSlug: null };
};

const initialRoute = parseInitialRoute();

function App() {
  const [activeTab, setActiveTab] = useState(initialRoute.tab);
  const [workSlug, setWorkSlug] = useState(initialRoute.workSlug);
  const [isMapFocused, setIsMapFocused] = useState(false);
  const [focusRequest, setFocusRequest] = useState(null);

  const switchTab = (tabId, slug = null) => {
    setActiveTab(tabId);
    setWorkSlug(slug);
    window.history.replaceState(
      null,
      '',
      slug ? `/${slug}` : tabId === 'home' ? '/' : `/${tabId}`
    );
  };

  // Annotate the document body so global, non-React elements (e.g. the
  // webring widget embedded in index.html) can be shown / hidden per tab.
  useEffect(() => {
    document.body.dataset.activeTab = activeTab;
    return () => {
      delete document.body.dataset.activeTab;
    };
  }, [activeTab]);

  const focusOnLocation = (id) => {
    setIsMapFocused(true);
    setFocusRequest((prev) => ({ id, key: (prev?.key || 0) + 1 }));
  };

  useEffect(() => {
    if (!isMapFocused) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsMapFocused(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMapFocused]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HeroSection
            onMapEnter={() => setIsMapFocused(true)}
            onMemorySelect={focusOnLocation}
            onNavigate={switchTab}
          />
        );
      case 'projects':
        return <ProjectsSection />;
      case 'work':
        return <WorkSection initialSlug={workSlug} />;
      case 'experiences':
        return <ExperiencesSection />;
      case 'hackathons':
        return <HackathonsSection />;
      case 'contact':
        return (
          <div className="contact-stack">
            <ContactSection />
            <SkillsSection />
          </div>
        );
      default:
        return (
          <HeroSection
            onMapEnter={() => setIsMapFocused(true)}
            onMemorySelect={focusOnLocation}
            onNavigate={switchTab}
          />
        );
    }
  };

  return (
    <div className={`App${isMapFocused ? ' App--map-focused' : ''}`}>
      <BackgroundMap isFocused={isMapFocused} focusRequest={focusRequest} />
      <div className="background-tint" aria-hidden="true" />
      <Navbar onNavigate={switchTab} activeTab={activeTab} />
      <main className={`main-content${activeTab === 'hackathons' ? ' main-content--full' : ''}`}>
        {renderActiveTab()}
      </main>
      {isMapFocused ? (
        <button
          type="button"
          className="background-map-exit"
          onClick={() => setIsMapFocused(false)}
          aria-label="Exit map view (or press Escape)"
        >
          Esc · Exit
        </button>
      ) : null}
    </div>
  );
}

export default App;
