import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Menu, Bell, User, Calendar as CalendarIcon, LogOut, Sun, Moon } from 'lucide-react';

const Navbar = ({ activeTab, user, logout, isCollapsed, setIsCollapsed }) => {
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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 fixed top-0 right-0 z-20 flex items-center justify-between px-6 transition-all duration-300 left-0 md:left-auto no-print"
      style={{ left: isCollapsed ? '80px' : '264px' }}
    >
      {/* Left side: Hamburger (on mobile) & breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 md:hidden transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 uppercase tracking-wider">
            <span>Subhan Care</span>
            <span>/</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">{getBreadcrumb()}</span>
          </div>
        </div>
      </div>

      {/* Right side: Date, Theme Toggle, Notifications, and Profile */}
      <div className="flex items-center gap-4">
        {/* Dynamic Date display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
          <CalendarIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          <span>{formatDate()}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5 text-amber-400 hover:text-amber-300 animate-spin-slow" />
          )}
        </button>

        {/* Notifications Mock */}
        <div className="relative">
          <button className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative" title="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-850"></div>

        {/* User Profile Block */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 p-1.5 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
          >
            <div className="h-9 w-9 bg-brand-100 dark:bg-brand-950 border border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-350 flex items-center justify-center rounded-full font-bold font-outfit shadow-sm">
              {user ? user.name.charAt(0) : 'A'}
            </div>
            <div className="hidden lg:block animate-in fade-in">
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
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-250 truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors"
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
