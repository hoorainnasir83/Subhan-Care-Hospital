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
import HealthLibrary from './pages/HealthLibrary';
import Staff from './pages/Staff';
import Lab from './pages/Lab';
import MedicalRecords from './pages/MedicalRecords';
import NotFound from './pages/NotFound';
import ErrorPage from './pages/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AppContext);
  if (!allowedRoles.includes(user?.role)) {
    return <ErrorPage code={403} message="Unauthorized access" />;
  }
  return children;
};

function AppContent() {
  const { user, logout, theme } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [publicView, setPublicView] = useState('home'); // 'home' | 'health-library'

  // If user not authenticated
  if (!user) {
    if (showLogin) {
      return (
        <ErrorBoundary>
          <Login onBack={() => setShowLogin(false)} />
        </ErrorBoundary>
      );
    }
    
    if (publicView === 'health-library') {
      return (
        <ErrorBoundary>
          <HealthLibrary onBack={() => setPublicView('home')} />
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <LandingPage 
          onLoginClick={() => setShowLogin(true)} 
          onNavigate={setPublicView}
        />
      </ErrorBoundary>
    );
  }

  // Filter tabs allowed for current user's role
  const role = user?.role || 'Staff';
  const allowedTabs = ROLE_ACCESS[role] || ROLE_ACCESS.Staff;

  // Router switcher with role-based permission check
  const renderContent = () => {
    if (!allowedTabs.includes(activeTab)) {
      return (
        <ErrorPage
          code={403}
          message={`Your role (${role}) does not have permission to view this page.`}
          onGoHome={() => setActiveTab('dashboard')}
        />
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
      case 'staff':
        return (
          <ProtectedRoute allowedRoles={['Admin']}>
            <Staff />
          </ProtectedRoute>
        );
      case 'lab':
        return (
          <ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Staff']}>
            <Lab />
          </ProtectedRoute>
        );
      case 'medical-records':
        return (
          <ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Staff', 'Patient']}>
            <MedicalRecords />
          </ProtectedRoute>
        );
      default:
        return <NotFound onGoHome={() => setActiveTab('dashboard')} />;
    }
  };

  return (
    <div className={`min-h-screen theme-transition flex w-full overflow-x-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* Sidebar Navigation */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        logout={logout}
        user={user}
      />

      {/* Main Panel */}
      <div 
        className="transition-all duration-300 min-h-screen flex flex-col flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 w-full overflow-x-hidden"
        style={{
          paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (isCollapsed ? '80px' : '264px') : '0px'
        }}
      >
        {/* Sticky Top Navbar */}
        <Navbar 
          activeTab={activeTab} 
          user={user} 
          logout={logout} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Page Body - Wrapped with ErrorBoundary */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 mt-16 max-w-7xl w-full mx-auto overflow-x-hidden">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>
        
        {/* Footer */}
        <footer className="py-4 px-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 no-print">
          &copy; {new Date().getFullYear()} Subhan Care HMS. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;