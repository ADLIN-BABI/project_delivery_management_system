import React, { useState, useMemo } from 'react';
import {
  X,
  FolderPlus,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import { ProjectItem, ClientItem, TaskItem, AdminUserItem } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: ProjectItem, autoTasks?: TaskItem[]) => void;
  clientsList: ClientItem[];
  onOpenAddClient?: () => void;
  managersList?: AdminUserItem[];
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


export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject,
  clientsList,
  onOpenAddClient,
  managersList = [],
}) => {
  const [name, setName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>(clientsList[0]?.id || '');
  const [platform, setPlatform] = useState<string>('Website');
  const [projectType, setProjectType] = useState<string>('New Development');
  const [managerIndex, setManagerIndex] = useState<number>(0);
  const [priority, setPriority] = useState<ProjectItem['priority']>('High');
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [description, setDescription] = useState('');

  // Assigned Employees State
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const availableManagers = useMemo(() => {
    return managersList
      .filter((m) => m.status === 'ACTIVE' || m.status !== 'BANNED')
      .map((m) => ({
        name: m.name,
        role: m.role === 'SUPER_ADMIN' ? 'Super Admin' : m.role === 'ADMIN' ? 'Project Lead' : 'Team Member',
        avatar: m.avatar,
      }));
  }, [managersList]);

  // All employees from managersList (includes EMPLOYEE role)
  const allEmployees = useMemo(() => {
    return managersList.filter(
      (m) => (m.status === 'ACTIVE' || m.status !== 'BANNED') && m.role === 'EMPLOYEE'
    );
  }, [managersList]);

  const filteredEmployees = allEmployees.filter(
    (e) =>
      e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.role.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Selected Client Details
  const selectedClient = useMemo(() => {
    return clientsList.find((c) => c.id === selectedClientId) || clientsList[0];
  }, [clientsList, selectedClientId]);

  // Dynamic duration calculation
  const durationDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const diffTime = end - start;
    if (diffTime <= 0) return 1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [startDate, endDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const managerObj =
      availableManagers[managerIndex] ||
      availableManagers[0] || {
        name: 'System Administrator',
        role: 'Super Admin',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };
    const projectCode = `PRJ-${name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Build assigned employees list
    const assignedEmps = managersList
      .filter((m) => selectedEmployeeIds.includes(m.id))
      .map((m) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        role: m.role === 'SUPER_ADMIN' ? 'Super Admin' : m.role === 'ADMIN' ? 'Admin' : 'Employee',
        email: m.email,
      }));

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      code: projectCode,
      client: selectedClient ? selectedClient.companyName : 'Direct Client',
      clientDetails: selectedClient
        ? {
            contactPerson: selectedClient.contactPerson,
            email: selectedClient.email,
            phone: selectedClient.phone,
          }
        : undefined,
      platform,
      technologies: [],
      projectType,
      modules: [],
      durationDays,
      description: description.trim() || undefined,
      manager: {
        name: managerObj.name,
        avatar: managerObj.avatar,
        role: managerObj.role,
      },
      assignedEmployees: assignedEmps,
      status: 'In Progress',
      progress: 5,
      startDate,
      endDate,
      priority,
      platforms: [platform.toUpperCase()],
      subPortals: ['ADMIN_PORTAL', 'CLIENT_PORTAL'],
    };

    // Tasks are only assigned explicitly through Assign Project Tasks
    const generatedTasks: TaskItem[] = [];

    onAddProject(newProject, generatedTasks);

    // Reset
    setName('');
    setSelectedEmployeeIds([]);
    setEmployeeSearch('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create New Project</h3>
              <p className="text-xs text-slate-500">Configure client, platform, team members, and schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">

          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. NextGen Omnichannel E-commerce Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            />
          </div>

          {/* 1. Client Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Client / Company *
              </label>
              {onOpenAddClient && (
                <button
                  type="button"
                  onClick={onOpenAddClient}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Add New Client
                </button>
              )}
            </div>

            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600 bg-white"
            >
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>

            {/* Auto-populated Client Card */}
            {selectedClient && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold shadow-xs">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedClient.companyName}</p>
                    <p className="text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Contact: <strong className="text-slate-800">{selectedClient.contactPerson}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {selectedClient.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {selectedClient.phone}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Platform & 3. Project Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                2. Platform *
              </label>
              <div className="relative">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white appearance-none pr-9"
                >
                  {PLATFORMS.map((plat) => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                3. Project Type *
              </label>
              <div className="relative">
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white appearance-none pr-9"
                >
                  {PROJECT_TYPES.map((pt) => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. Project Manager & 5. Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                4. Project Manager *
              </label>
              <div className="relative">
                <select
                  value={managerIndex}
                  onChange={(e) => setManagerIndex(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white appearance-none pr-9"
                >
                  {availableManagers.length > 0 ? (
                    availableManagers.map((mgr, i) => (
                      <option key={mgr.name} value={i}>
                        {mgr.name} ({mgr.role})
                      </option>
                    ))
                  ) : (
                    <option value={0}>No managers found in database</option>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                5. Priority Level *
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectItem['priority'])}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white appearance-none pr-9"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 6. Assign Employees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                6. Assign Employees to Project
              </label>
              {selectedEmployeeIds.length > 0 && (
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {selectedEmployeeIds.length} selected
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee by name, email, or role..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 bg-slate-50"
              />
            </div>

            {/* Employee List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              {allEmployees.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No employees found. Add employees via Admin Management first.
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No employees match your search.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <button
                        type="button"
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition text-left ${
                          isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{emp.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{emp.email}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          emp.role === 'SUPER_ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : emp.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {emp.role === 'SUPER_ADMIN' ? 'Super Admin' : emp.role === 'ADMIN' ? 'Admin' : 'Employee'}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Employee Chips */}
            {selectedEmployeeIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {managersList
                  .filter((m) => selectedEmployeeIds.includes(m.id))
                  .map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1"
                    >
                      <img src={emp.avatar} alt={emp.name} className="w-4 h-4 rounded-full object-cover" />
                      <span className="text-[11px] font-semibold text-indigo-700">{emp.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleEmployee(emp.id)}
                        className="text-indigo-400 hover:text-indigo-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 7. Timeline */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                7. Timeline & Schedule
              </label>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                <Calendar className="w-3.5 h-3.5" />
                Duration: {durationDays} Days ({Math.ceil(durationDays / 7)} Weeks)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  min={getTodayStr()}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Completion Date</label>
                <input
                  type="date"
                  required
                  min={startDate || getTodayStr()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 8. Project Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              8. Project Description & Requirements
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Build an e-commerce website with product catalog management, customer authentication, stripe payments, and delivery dispatch pipeline."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">
              {selectedEmployeeIds.length > 0 && (
                <span>
                  <strong className="text-indigo-700">{selectedEmployeeIds.length} employee{selectedEmployeeIds.length > 1 ? 's' : ''}</strong> assigned
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                Create Project & Initialize
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
