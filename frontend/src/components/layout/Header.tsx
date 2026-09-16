import React, { useState } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { User as UserType } from '../../types';

interface HeaderProps {
  activeTab: NavTab;
  onOpenSidebar: () => void;
  onSelectTab: (tab: NavTab) => void;
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  unreadNotificationsCount?: number;
  currentUser?: UserType | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenSidebar,
  onSelectTab,
  userRole,
  unreadNotificationsCount = 3,
  currentUser,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getPageTitle = (tab: NavTab): string => {
    if (userRole === 'EMPLOYEE') {
      switch (tab) {
        case 'dashboard':
          return 'My Workspace & Assigned Tasks';
        case 'project-tasks':
          return 'My Assigned Project Tasks';
        case 'general-tasks':
          return 'My Assigned General Tasks';
        case 'notifications':
          return 'Notifications & Approvals';
        case 'settings':
          return 'My Profile & Preferences';
        default:
          return 'Employee Portal';
      }
    }

    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'general-tasks':
        return 'General Tasks';
      case 'project-tasks':
        return 'Project Tasks & Sprints';
      case 'clients':
        return 'Clients Directory';
      case 'projects':
        return 'Projects Directory';
      case 'admin-management':
        return 'Admin & User Management';
      case 'audit-logs':
        return 'Security & Audit Logs';
      case 'notifications':
        return 'Notifications & Alerts';
      case 'settings':
        return 'System & Portal Settings';
      default:
        return 'Dashboard';
    }
  };

  const displayName =
    currentUser?.full_name ||
    (userRole === 'SUPER_ADMIN'
      ? 'Super Admin'
      : userRole === 'EMPLOYEE'
        ? 'Employee Member'
        : 'Admin');

  const displayEmail =
    currentUser?.email ||
    (userRole === 'SUPER_ADMIN'
      ? 'superadmin@wenoxo.com'
      : userRole === 'EMPLOYEE'
        ? 'employee@wenoxo.com'
        : 'admin@wenoxo.com');

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          {getPageTitle(activeTab)}
        </h2>
      </div>

      {/* Right Search, Notification & Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Search Bar */}
        {/* <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, tasks, clients..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div> */}


        {/* Notifications Bell */}
        <button
          onClick={() => onSelectTab('notifications')}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition text-left"
          >
            <img
              src={currentUser?.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
            <span className="text-sm font-semibold text-slate-800 hidden sm:block">
              {displayName}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 font-mono truncate">
                  {displayEmail}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  Role: {userRole}
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    onSelectTab('settings');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Portal Settings
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
