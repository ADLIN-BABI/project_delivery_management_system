import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  Users,
  Check,
} from 'lucide-react';
import { ProjectItem, AdminUserItem } from '../../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem | null;
  onUpdateProject: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
  managersList?: AdminUserItem[];
  employeesList?: AdminUserItem[];
}

const PROJECT_TYPES = [
  'New Development',
  'Existing System',
  'Redesign',
  'Maintenance',
  'Bug Fixing',
  'Upgrade',
  'Migration',
  'Integration',
  'Customization',
  'Support',
  'Other',
];

const PLATFORMS = [
  'Website',
  'Mobile App',
  'Web Application',
  'Desktop Application',
  'API / Backend',
  'E-Commerce',
  'Cloud / Server',
  'Software / SaaS',
  'Other',
];

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onDeleteProject,
  managersList = [],
  employeesList = [],
}) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [platform, setPlatform] = useState('Website');
  const [projectType, setProjectType] = useState('New Development');
  const [priority, setPriority] = useState<ProjectItem['priority']>('High');
  const [status, setStatus] = useState<ProjectItem['status']>('In Progress');
  const [progress, setProgress] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [managerName, setManagerName] = useState('');
  const [assignedEmployees, setAssignedEmployees] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
    role: string;
    email?: string;
  }>>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Combine employeesList and managersList for complete DB user pool and filter ONLY employees
  const allAvailableEmployees = useMemo(() => {
    const combined = [...employeesList, ...managersList];
    const unique = new Map<string, AdminUserItem>();
    combined.forEach((u) => {
      if (!unique.has(u.id) && u.role === 'EMPLOYEE') unique.set(u.id, u);
    });
    return Array.from(unique.values());
  }, [employeesList, managersList]);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClient(project.client || '');
      setPlatform(project.platform || 'Website');
      setProjectType(project.projectType || 'New Development');
      setPriority(project.priority || 'High');
      setStatus(project.status || 'In Progress');
      setProgress(project.progress ?? 5);
      setStartDate(project.startDate || '');
      setEndDate(project.endDate || '');
      setDescription(project.description || '');
      setManagerName(project.manager?.name || '');
      setAssignedEmployees(project.assignedEmployees || []);
      setConfirmDelete(false);
      setEmployeeSearch('');
    }
  }, [project]);

  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return project?.durationDays || 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diffTime = end - start;
    if (diffTime <= 0) return 1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, endDate, project]);

  if (!isOpen || !project) return null;

  const handleToggleEmployee = (emp: AdminUserItem) => {
    const isAlready = assignedEmployees.some(
      (e) => e.id === emp.id || (e.email && e.email.toLowerCase() === emp.email.toLowerCase())
    );
    if (isAlready) {
      setAssignedEmployees(
        assignedEmployees.filter(
          (e) => e.id !== emp.id && (!e.email || e.email.toLowerCase() !== emp.email.toLowerCase())
        )
      );
    } else {
      setAssignedEmployees([
        ...assignedEmployees,
        {
          id: emp.id,
          name: emp.name,
          avatar: emp.avatar,
          role: emp.role === 'SUPER_ADMIN' ? 'Super Admin' : emp.role === 'ADMIN' ? 'Project Lead' : 'Team Member',
          email: emp.email,
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedManager = managersList.find((m) => m.name === managerName);

    const updated: ProjectItem = {
      ...project,
      name: name.trim(),
      client: client.trim() || project.client,
      platform,
      projectType,
      priority,
      status,
      progress: Number(progress),
      startDate,
      endDate,
      durationDays,
      description: description.trim() || undefined,
      assignedEmployees,
      manager: matchedManager
        ? {
            name: matchedManager.name,
            avatar: matchedManager.avatar,
            role: matchedManager.role === 'SUPER_ADMIN' ? 'Super Admin' : matchedManager.role === 'ADMIN' ? 'Project Lead' : 'Team Member',
          }
        : project.manager,
    };

    onUpdateProject(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteProject && project) {
      onDeleteProject(project.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              {project.code.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Edit Project</h3>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {project.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">Modify project delivery parameters and milestones</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              placeholder="e.g. Enterprise CRM Portal"
            />
          </div>

          {/* Client & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client / Organization
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Client name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Track Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectItem['priority'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectItem['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
                <span>Progress</span>
                <span className="font-mono text-blue-600 font-bold">{progress}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                min={getTodayStr()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target End Date ({durationDays} Days)
              </label>
              <input
                type="date"
                min={startDate || getTodayStr()}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Manager */}
          {managersList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Lead / Manager
              </label>
              <select
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                {managersList.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assigned Employees Management */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Assigned Team Members ({assignedEmployees.length})
              </label>
              <span className="text-[10px] text-indigo-700 font-semibold">
                Click to add or remove
              </span>
            </div>

            {/* Currently assigned chips */}
            {assignedEmployees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white border border-indigo-200/60">
                {assignedEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium"
                  >
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-bold">{emp.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAssignedEmployees(assignedEmployees.filter((e) => e.id !== emp.id))
                      }
                      className="text-indigo-400 hover:text-indigo-700 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search employees */}
            <input
              type="text"
              placeholder="Search team member to add/remove..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs focus:outline-none focus:border-indigo-500"
            />

            {/* Available list */}
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {allAvailableEmployees
                .filter(
                  (emp) =>
                    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                    emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
                )
                .map((emp) => {
                  const isAssigned = assignedEmployees.some(
                    (e) => e.id === emp.id || (e.email && e.email.toLowerCase() === emp.email.toLowerCase())
                  );
                  return (
                    <button
                      type="button"
                      key={emp.id}
                      onClick={() => handleToggleEmployee(emp)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition border ${
                        isAssigned
                          ? 'bg-indigo-100/70 border-indigo-300 font-bold text-indigo-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="truncate">
                          <span className="truncate">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{emp.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {emp.role}
                        </span>
                        {isAssigned ? (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300" />
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Description / Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Summary of deliverables..."
            />
          </div>

          {/* Delete Danger Zone */}
          {onDeleteProject && (
            <div className="pt-4 border-t border-slate-100">
              {confirmDelete ? (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Are you sure you want to delete &quot;{project.name}&quot;?</span>
                  </div>
                  <p className="text-[11px] text-red-600">
                    This will permanently remove the project and its associated tasks from PostgreSQL.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      Yes, Delete Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 p-1 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete this Project
                </button>
              )}
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
