import React, { useState } from 'react';
import { AdminUserItem, TaskItem, ProjectItem } from '../types';
import {
  ShieldCheck,
  ShieldPlus,
  Search,
  CheckCircle2,
  Ban,
  PauseCircle,
  Shield,
  User,
  Eye,
  Edit2,
  Trash2,
  Mail,
} from 'lucide-react';
import { EditAdminModal } from '../components/modals/EditAdminModal';
import { AdminDetailsModal } from '../components/modals/AdminDetailsModal';

interface AdminManagementPageProps {
  admins: AdminUserItem[];
  tasks?: TaskItem[];
  projects?: ProjectItem[];
  onOpenCreateAdmin: () => void;
  onUpdateAdmin?: (updatedAdmin: AdminUserItem) => void;
  onDeleteAdmin?: (adminId: string) => void;
  onUpdateAdminStatus: (
    adminId: string,
    newStatus: AdminUserItem['status']
  ) => void;
}

export const AdminManagementPage: React.FC<AdminManagementPageProps> = ({
  admins,
  tasks = [],
  projects = [],
  onOpenCreateAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
  onUpdateAdminStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAdminForDetails, setSelectedAdminForDetails] = useState<AdminUserItem | null>(null);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUserItem | null>(null);

  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone && a.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Admin & User Management
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Super Admin Exclusive
            </span>
          </h2>
          <p className="text-sm text-slate-500">
            Control access privileges, view user profiles, edit details, and manage roles & status
          </p>
        </div>

        <button
          onClick={onOpenCreateAdmin}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-500/25 transition cursor-pointer"
        >
          <ShieldPlus className="w-4 h-4" />
          Create Administrator
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === 'SUPER_ADMIN' ? 'ALL' : 'SUPER_ADMIN')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-purple-300 flex items-center gap-4 text-left transition"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Super Admins & Admins</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              {admins.filter((a) => a.role !== 'EMPLOYEE').length}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 flex items-center gap-4 text-left transition"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Active Accounts</p>
            <p className="text-2xl font-bold text-emerald-600 font-mono">
              {admins.filter((a) => a.status === 'ACTIVE').length}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'BANNED' ? 'ALL' : 'BANNED')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-red-300 flex items-center gap-4 text-left transition"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Banned Accounts</p>
            <p className="text-2xl font-bold text-red-600 font-mono">
              {admins.filter((a) => a.status === 'BANNED').length}
            </p>
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${roleFilter === r
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>

          {(roleFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setRoleFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 overflow-x-auto space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500">
            Showing {filteredAdmins.length} registered user{filteredAdmins.length !== 1 ? 's' : ''}
          </p>
          <span className="text-[11px] text-slate-400">
            Click on any user row or name to view complete details & assigned tasks
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Administrator Details</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Last Login</th>
              <th className="py-3 px-3">Created Date</th>
              <th className="py-3 px-3 text-right">Actions & Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAdmins.map((admin) => {
              const isSuper = admin.role === 'SUPER_ADMIN';

              return (
                <tr key={admin.id} className="hover:bg-slate-50/80 transition group">
                  {/* Administrator Details Column (Clickable) */}
                  <td className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={() => setSelectedAdminForDetails(admin)}
                      className="flex items-center gap-3 text-left group-hover:opacity-90 transition cursor-pointer"
                      title="Click to view full administrator profile and assigned tasks"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={admin.avatar}
                          alt={admin.name}
                          className="w-10 h-10 rounded-2xl object-cover border-2 border-slate-200 group-hover:border-purple-400 transition shadow-xs"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${admin.status === 'ACTIVE'
                              ? 'bg-emerald-400'
                              : admin.status === 'BANNED'
                                ? 'bg-red-400'
                                : 'bg-slate-400'
                            }`}
                        />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 group-hover:text-purple-700 transition flex items-center gap-1.5">
                          <span>{admin.name}</span>
                          {isSuper && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-md border border-purple-200">
                              Root
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{admin.email}</span>
                        </p>
                      </div>
                    </button>
                  </td>

                  {/* Role Column */}
                  <td className="py-3.5 px-3">
                    {admin.role === 'SUPER_ADMIN' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        Super Admin
                      </span>
                    ) : admin.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        Employee
                      </span>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="py-3.5 px-3">
                    {admin.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : admin.status === 'BANNED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        <Ban className="w-3.5 h-3.5 text-red-500" />
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Last Login */}
                  <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                    {admin.lastLogin || 'Recently'}
                  </td>

                  {/* Created Date */}
                  <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                    {admin.createdAt || '2026-09-03'}
                  </td>

                  {/* Actions & Controls */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedAdminForDetails(admin)}
                        className="p-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                        title="View Full Administrator Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedAdminForEdit(admin)}
                        className="p-1.5 rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
                        title="Edit Administrator / User Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Status Control Buttons */}
                      {!isSuper ? (
                        <>
                          {admin.status === 'ACTIVE' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onUpdateAdminStatus(admin.id, 'INACTIVE')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                                title="Deactivate account"
                              >
                                Deactivate
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateAdminStatus(admin.id, 'BANNED')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
                                title="Ban account from logging in"
                              >
                                Ban
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onUpdateAdminStatus(admin.id, 'ACTIVE')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                            >
                              Activate
                            </button>
                          )}

                          {/* Delete Button */}
                          {onDeleteAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete user "${admin.name}" (${admin.email})?`)) {
                                  onDeleteAdmin(admin.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic px-2">Protected Root</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Admin Details Modal */}
      {selectedAdminForDetails && (
        <AdminDetailsModal
          isOpen={!!selectedAdminForDetails}
          onClose={() => setSelectedAdminForDetails(null)}
          admin={selectedAdminForDetails}
          tasks={tasks}
          projects={projects}
          onOpenEdit={(adm) => setSelectedAdminForEdit(adm)}
          onUpdateAdminStatus={onUpdateAdminStatus}
        />
      )}

      {/* Edit Admin Modal */}
      {selectedAdminForEdit && (
        <EditAdminModal
          isOpen={!!selectedAdminForEdit}
          onClose={() => setSelectedAdminForEdit(null)}
          admin={selectedAdminForEdit}
          onUpdateAdmin={(updated) => {
            if (onUpdateAdmin) onUpdateAdmin(updated);
            setSelectedAdminForEdit(null);
            if (selectedAdminForDetails && selectedAdminForDetails.id === updated.id) {
              setSelectedAdminForDetails(updated);
            }
          }}
          onDeleteAdmin={(adminId) => {
            if (onDeleteAdmin) onDeleteAdmin(adminId);
            setSelectedAdminForEdit(null);
            if (selectedAdminForDetails && selectedAdminForDetails.id === adminId) {
              setSelectedAdminForDetails(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default AdminManagementPage;
