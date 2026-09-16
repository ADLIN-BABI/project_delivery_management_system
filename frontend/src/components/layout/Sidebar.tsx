import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Bell,
  Settings,
  ShieldCheck,
  FileText,
  Boxes,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'general-tasks'
  | 'project-tasks'
  | 'clients'
  | 'projects'
  | 'admin-management'
  | 'audit-logs'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  unreadCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  unreadCount = 3,
  isOpen,
  onClose,
}) => {
  const isEmployee = userRole === 'EMPLOYEE';

  const navItems = isEmployee
    ? [
      { id: 'dashboard' as NavTab, label: 'My Workspace', icon: LayoutDashboard },
      { id: 'projects' as NavTab, label: 'Projects', icon: Boxes },
      { id: 'general-tasks' as NavTab, label: 'My General Tasks', icon: CheckSquare },
    ]
    : [
      { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
      { id: 'projects' as NavTab, label: 'Projects', icon: Boxes },
      { id: 'general-tasks' as NavTab, label: 'General Tasks', icon: CheckSquare },
      { id: 'clients' as NavTab, label: 'Clients', icon: Users },
    ];

  const superAdminItems = [
    { id: 'admin-management' as NavTab, label: 'Admin Management', icon: ShieldCheck },
    { id: 'audit-logs' as NavTab, label: 'Audit Logs', icon: FileText },
  ];

  const bottomItems = [
    {
      id: 'notifications' as NavTab,
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d172a] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Boxes className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Super Admin
              </h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Project Delivery System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const href = item.id === 'dashboard' ? '/dashboard' : `/${item.id}`;

            return (
              <a
                key={item.id}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}

          {/* Super Admin Section */}
          {userRole === 'SUPER_ADMIN' && (
            <div className="pt-4 mt-4 border-t border-slate-800/60">
              <div className="px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Super Admin Controls
              </div>
              {superAdminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const href = `/${item.id}`;

                return (
                  <a
                    key={item.id}
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800/60 space-y-1.5">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const href = `/${item.id}`;

            return (
              <a
                key={item.id}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-md shadow-red-500/40">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </aside>
    </>
  );
};
