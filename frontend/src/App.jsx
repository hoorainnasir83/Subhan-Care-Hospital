import React, { useState, useContext } from 'react';
import { AppProvider, AppContext, ROLE_ACCESS } from './context/AppContext';
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
import Inventory from './pages/Inventory';
import Prescriptions from './pages/Prescriptions';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary'; // ✅ NEW

function AppContent() {
  const { user, logout, theme } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // If user not authenticated
  if (!user) {
    if (showLogin) {
      return (
        <ErrorBoundary>
          <Login onBack={() => setShowLogin(false)} />
        </ErrorBoundary>
      );
    }
    return (
      <ErrorBoundary>
        <LandingPage onLoginClick={() => setShowLogin(true)} />
      </ErrorBoundary>
    );
  }

  // ✅ Filter tabs allowed for current user's role
  const role = user?.role || 'Staff';
  const allowedTabs = ROLE_ACCESS[role] || ROLE_ACCESS.Staff;

  // Router switcher with role-based permission check
  const renderContent = () => {
    // If activeTab is not allowed for user's role, show Access Denied
    if (!allowedTabs.includes(activeTab)) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-12 text-center shadow-sm my-8 max-w-lg mx-auto">
          <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">Access Denied</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
            Your role (<strong className="text-slate-700 dark:text-slate-300">{role}</strong>) does not have permission to view this page.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/10 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

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
      case 'inventory':
        return <Inventory />;
      case 'prescriptions':
        return <Prescriptions />;
      case 'reports':
        return <Reports />;
      case 'search':
        return <AdvancedSearch />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <NotFound onGoHome={() => setActiveTab('dashboard')} />;
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

      {/* Main Panel */}
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

        {/* Page Body - ✅ Wrapped with ErrorBoundary */}
        <main className="flex-1 p-6 md:p-8 mt-16 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
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
    // ✅ Top Level ErrorBoundary
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;