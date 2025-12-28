import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProjectsSection from './components/ProjectsSection';
import ExperiencesSection from './components/ExperiencesSection';
import ContactSection from './components/ContactSection';

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
      case 'contact':
        return <ContactSection />;
      default:
        return <HeroSection />;
    }
  };

  return (
    <div className="App">
      <Navbar onNavigate={switchTab} activeTab={activeTab} />
      <main className="main-content">
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;
