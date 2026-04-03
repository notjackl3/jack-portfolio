import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProjectsSection from './components/ProjectsSection';
import ExperiencesSection from './components/ExperiencesSection';
import ContactSection from './components/ContactSection';
import SkillsSection from './components/SkillsSection';
import HackathonsSection from './components/HackathonsSection';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HeroSection />;
      case 'projects':
        return <ProjectsSection />;
      case 'experiences':
        return <ExperiencesSection />;
      case 'hackathons':
        return <HackathonsSection />;
      case 'contact':
        return <ContactSection />;
      case 'skills':
        return <SkillsSection />;
      default:
        return <HeroSection />;
    }
  };

  return (
    <div className="App">
      <Navbar onNavigate={switchTab} activeTab={activeTab} />
      <main className={`main-content${activeTab === 'hackathons' ? ' main-content--full' : ''}`}>
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;
