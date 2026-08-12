import React from 'react';
import { ROLE_ACCESS } from '../context/AppContext';
import {
  LayoutDashboard, Users, Stethoscope, Calendar,
  ChevronLeft, ChevronRight, Activity, LogOut, X,
  Receipt, BarChart3, Search, Settings, Package, ClipboardList, Briefcase, FlaskConical
} from 'lucide-react';

const ALL_MENU_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'patients',     label: 'Patients',            icon: Users           },
  { id: 'doctors',      label: 'Doctors',             icon: Stethoscope     },
  { id: 'staff',        label: 'Staff & HR',          icon: Briefcase       },
  { id: 'appointments', label: 'Appointments',        icon: Calendar        },
  { id: 'billing',      label: 'Billing & Invoice',   icon: Receipt         },
  { id: 'prescriptions',label: 'Prescriptions',        icon: ClipboardList   },
  { id: 'inventory',    label: 'Inventory',           icon: Package         },
  { id: 'lab',           label: 'Lab & Diagnostics',   icon: FlaskConical    },
  { id: 'reports',      label: 'Reports & Analytics', icon: BarChart3       },
  { id: 'search',       label: 'Advanced Search',     icon: Search          },
  { id: 'settings',     label: 'Settings',            icon: Settings        },
];

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, activeTab, setActiveTab, logout, user }) => {
  const role      = user?.role || 'Staff';
  const allowed   = ROLE_ACCESS[role] || ROLE_ACCESS.Staff;
  const menuItems = ALL_MENU_ITEMS.filter(item => allowed.includes(item.id));

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`bg-slate-900 dark:bg-slate-950 text-white h-screen fixed left-0 top-0 z-50 lg:z-30 flex flex-col justify-between transition-all duration-300 shadow-xl border-r border-slate-800
          ${/* Mobile drawer positioning */ ''}
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${/* Desktop width sizing */ ''}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-brand-600 p-2 rounded-lg text-white flex-shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div className={`${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <span className="font-semibold text-base font-outfit tracking-wide bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent block truncate">
                  Subhan Care
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{role}</span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close Navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-4 px-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {menuItems.map((item) => {
              const Icon     = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative min-h-[44px]
                    ${isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className={`font-outfit truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>{item.label}</span>

                  {/* Desktop Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="hidden lg:block absolute left-24 bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50 border border-slate-800 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div>
          {user && (
            <div className={`p-3 mx-3 mb-2 bg-slate-950/40 rounded-xl border border-slate-800/40 overflow-hidden ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Signed in as</p>
              <p className="text-xs font-bold truncate text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{role}</p>
            </div>
          )}

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={logout}
              className={`flex items-center justify-center p-2.5 rounded-lg text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors min-h-[44px] ${isCollapsed ? 'w-full lg:w-auto' : 'flex-1 gap-2 text-xs font-medium'}`}
              title="Log Out"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className={`font-outfit ${isCollapsed ? 'lg:hidden' : 'block'}`}>Logout</span>
            </button>

            {/* Desktop Collapse Toggle */}
            {!isCollapsed && (
              <button onClick={() => setIsCollapsed(true)} className="hidden lg:flex p-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors min-h-[44px] min-w-[44px] items-center justify-center" title="Collapse Sidebar">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {isCollapsed && (
              <button onClick={() => setIsCollapsed(false)} className="hidden lg:flex absolute bottom-3 right-[-14px] bg-brand-600 text-white rounded-full p-1 border-2 border-slate-900 hover:bg-brand-500 transition-colors shadow-md" title="Expand Sidebar">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
