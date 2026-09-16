import React from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Edit2,
  Layers,
  Sparkles,
  Ban,
  PauseCircle,
} from 'lucide-react';
import { AdminUserItem, TaskItem, ProjectItem } from '../../types';

interface AdminDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminUserItem | null;
  tasks?: TaskItem[];
  projects?: ProjectItem[];
  onOpenEdit?: (admin: AdminUserItem) => void;
  onUpdateAdminStatus?: (adminId: string, status: AdminUserItem['status']) => void;
}

export const AdminDetailsModal: React.FC<AdminDetailsModalProps> = ({
  isOpen,
  onClose,
  admin,
  tasks = [],
  projects = [],
  onOpenEdit,
  onUpdateAdminStatus,
}) => {
  if (!isOpen || !admin) return null;

  const isSuper = admin.role === 'SUPER_ADMIN';

  // Filter tasks assigned to this admin/employee
  const assignedTasks = tasks.filter((t) => {
    const taskEmail = (t.assignee?.email || '').toLowerCase().trim();
    const taskName = (t.assignee?.name || '').toLowerCase().trim();
    const userEmail = (admin.email || '').toLowerCase().trim();
    const userName = (admin.name || '').toLowerCase().trim();
    return (userEmail && taskEmail === userEmail) || (userName && taskName === userName);
  });

  // Filter projects where this user is assigned or is manager
  const assignedProjects = projects.filter((p) => {
    const userEmail = (admin.email || '').toLowerCase().trim();
    const userName = (admin.name || '').toLowerCase().trim();
    const isManager = (p.manager?.name || '').toLowerCase().trim() === userName;
    const isAssigned = (p.assignedEmployees || []).some((emp) => {
      const empEmail = (emp.email || '').toLowerCase().trim();
      const empName = (emp.name || '').toLowerCase().trim();
      return (userEmail && empEmail === userEmail) || (userName && empName === userName);
    });
    return isManager || isAssigned;
  });

  const completedCount = assignedTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = assignedTasks.filter((t) => t.status === 'In Progress').length;
  const totalLoggedHours = assignedTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
  const totalEstHours = assignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  const getStatusBadge = (s: TaskItem['status']) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Review':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'To Do':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-hidden"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={admin.avatar}
                  alt={admin.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-indigo-400/50 shadow-xl"
                />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  admin.status === 'ACTIVE' ? 'bg-emerald-400' : admin.status === 'BANNED' ? 'bg-red-400' : 'bg-slate-400'
                }`} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">{admin.name}</h3>
                  {isSuper && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      Root Super Admin
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="w-3.5 h-3.5 text-indigo-300" />
                    {admin.email}
                  </span>
                  {admin.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-indigo-300" />
                        {admin.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Role & Edit Button in Header */}
            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex items-center gap-2">
                {admin.role === 'SUPER_ADMIN' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    <ShieldCheck className="w-4 h-4 text-purple-300" />
                    Super Admin
                  </span>
                ) : admin.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    <Shield className="w-4 h-4 text-blue-300" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    <User className="w-4 h-4 text-emerald-300" />
                    Employee
                  </span>
                )}

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                  admin.status === 'ACTIVE'
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : admin.status === 'BANNED'
                    ? 'bg-red-400/20 text-red-300 border border-red-400/30'
                    : 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                }`}>
                  {admin.status}
                </span>
              </div>

              {onOpenEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEdit(admin);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-extrabold shadow-sm transition self-start sm:self-auto cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                  Edit Details
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-4 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">Assigned Projects</p>
              <p className="text-lg font-extrabold text-white mt-0.5">{assignedProjects.length}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">In Progress Tasks</p>
              <p className="text-lg font-extrabold text-amber-300 mt-0.5">{inProgressCount}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">Completed Tasks</p>
              <p className="text-lg font-extrabold text-emerald-300 mt-0.5">{completedCount}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <p className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">Hours Logged</p>
              <p className="text-lg font-extrabold text-purple-300 mt-0.5">{totalLoggedHours}/{totalEstHours}h</p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Account & Security Information */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Account & Security Overview</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Last Login Activity</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{admin.lastLogin || 'Recently'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Account Created On</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{admin.createdAt || '2026-09-03'}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Database Identity ID</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono truncate" title={admin.id}>{admin.id}</p>
              </div>
            </div>
          </div>

          {/* Assigned Tasks Vertical Table */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Assigned Tasks for {admin.name}</span>
              </h4>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {assignedTasks.length} task{assignedTasks.length !== 1 ? 's' : ''}
              </span>
            </div>

            {assignedTasks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-600">No tasks currently assigned to this user.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Task ID</th>
                      <th className="py-2.5 px-3">Project</th>
                      <th className="py-2.5 px-3">Work Type</th>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-center">Hours</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignedTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                            {t.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{t.project || 'Project'}</td>
                        <td className="py-2.5 px-3 font-semibold text-purple-700">{t.workType || 'Standard'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{t.module || 'General'}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{t.dueDate}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                          <span className="font-bold text-slate-800">{t.loggedHours || 0}</span>
                          <span className="text-slate-400">/{t.estimatedHours || 0}h</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {!isSuper && onUpdateAdminStatus && (
              admin.status === 'ACTIVE' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onUpdateAdminStatus(admin.id, 'INACTIVE')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition"
                  >
                    <PauseCircle className="w-4 h-4 text-amber-600" />
                    Deactivate
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateAdminStatus(admin.id, 'BANNED')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition"
                  >
                    <Ban className="w-4 h-4 text-red-600" />
                    Ban Account
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateAdminStatus(admin.id, 'ACTIVE')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Activate Account
                </button>
              )
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(admin);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                Edit Profile
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
