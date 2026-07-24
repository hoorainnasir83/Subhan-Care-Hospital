import React, { useState, useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import AdvancedSearch from './pages/AdvancedSearch';
import SettingsPage from './pages/SettingsPage';

import LandingPage from './pages/LandingPage';

function AppContent() {
  const { user, logout, theme } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // If the user is not authenticated, display the landing page or login page.
  if (!user) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowLogin(true)} />;
  }

  // Router switcher mapping tabs to pages
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'patients':
        return <Patients />;
      case 'doctors':
        return <Doctors />;
      case 'appointments':
        return <Appointments />;
      case 'billing':
        return <Billing />;
      case 'reports':
        return <Reports />;
      case 'search':
        return <AdvancedSearch />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen theme-transition flex w-full ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        logout={logout}
        user={user}
      />

      {/* Main Panel Content Area */}
      <div 
        className="transition-all duration-300 min-h-screen flex flex-col flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
        style={{ paddingLeft: isCollapsed ? '80px' : '264px' }}
      >
        {/* Sticky Top Navbar */}
        <Navbar 
          activeTab={activeTab} 
          user={user} 
          logout={logout} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-6 md:p-8 mt-16 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
        
        {/* Footer */}
        <footer className="py-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 no-print">
          &copy; {new Date().getFullYear()} Subhan Care HMS. Built with React & Tailwind CSS.
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
