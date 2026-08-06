import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Menu, Bell, Calendar as CalendarIcon, LogOut, Sun, Moon } from 'lucide-react';

const Navbar = ({ activeTab, user, logout, isCollapsed, setIsMobileOpen }) => {
  const { theme, toggleTheme } = useContext(AppContext);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Helper to format tab name for breadcrumbs
  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'patients': return 'Patients Directory';
      case 'doctors': return 'Doctors Roster';
      case 'appointments': return 'Appointments Scheduler';
      case 'billing': return 'Billing & Invoices';
      case 'prescriptions': return 'Prescriptions';
      case 'inventory': return 'Pharmacy & Inventory';
      case 'reports': return 'Reports & Analytics';
      case 'search': return 'Advanced Query Builder';
      case 'settings': return 'Hospital Settings';
      default: return 'Home';
    }
  };

  // Get current date string
  const formatDate = () => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header 
      className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 fixed top-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 transition-all duration-300 left-0 lg:left-auto no-print"
      style={{ left: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (isCollapsed ? '80px' : '264px') : '0px' }}
    >
      {/* Left side: Mobile Hamburger & breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Open Navigation"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 uppercase tracking-wider">
            <span className="hidden sm:inline">Subhan Care</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">{getBreadcrumb()}</span>
          </div>
        </div>
      </div>

      {/* Right side: Date, Theme Toggle, Notifications, and Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Dynamic Date display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
          <CalendarIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          <span>{formatDate()}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5 text-amber-400 hover:text-amber-300 animate-spin-slow" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center" 
            title="Notifications"
            aria-label="View Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

        {/* User Profile Block */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
            aria-label="User Profile Options"
          >
            <div className="h-9 w-9 bg-brand-100 dark:bg-brand-950 border border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-350 flex items-center justify-center rounded-full font-bold font-outfit shadow-xs">
              {user ? user.name.charAt(0) : 'A'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                {user ? user.name : 'Administrator'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 capitalize">
                {user ? user.role : 'Admin'}
              </p>
            </div>
          </button>

          {/* Profile Dropdown menu */}
          {showProfileDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowProfileDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400">Account Details</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors font-medium min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
