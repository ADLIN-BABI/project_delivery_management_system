import React, { useState } from 'react';
import { ProjectItem, AdminUserItem, TaskItem, MasterPlanItem, NotificationItem } from '../types';
import {
  FolderPlus,
  Search,
  Building,
  Calendar,
  Globe,
  Smartphone,
  Server,
  ShoppingCart,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserPlus,
  X,
  ChevronDown,
  Users,
  Check,
  Edit2,
  LayoutDashboard,
} from 'lucide-react';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { ProjectDashboardView } from '../components/project/ProjectDashboardView';

interface ProjectsPageProps {
  projects: ProjectItem[];
  tasks?: TaskItem[];
  masterPlans?: MasterPlanItem[];
  initialSelectedProjectId?: string | null;
  currentUser?: any;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  onOpenCreateProject: () => void;
  onSelectProjectForTasks?: (project: ProjectItem) => void;
  onUpdateProjectStatus?: (projectId: string, newStatus: ProjectItem['status']) => void;
  adminsList?: AdminUserItem[];
  onAssignEmployee?: (projectId: string, employee: AdminUserItem) => void;
  onUpdateProject?: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenCreateProjectTask?: () => void;
  onUpdateTask?: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskItem['status']) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
  notifications?: NotificationItem[];
  onSendNotification?: (notif: any) => void;
  onCreateMasterPlan?: (data: { project_id?: string; project_name?: string; work_type: string }) => Promise<void>;
  onDeleteMasterPlan?: (id: string) => Promise<void>;
  onAddTasks?: (tasks: TaskItem[]) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  tasks = [],
  masterPlans = [],
  notifications = [],
  initialSelectedProjectId,
  currentUser,
  userRole = 'SUPER_ADMIN',
  onOpenCreateProject,
  onSelectProjectForTasks: _onSelectProjectForTasks,
  onUpdateProjectStatus,
  adminsList = [],
  onAssignEmployee,
  onUpdateProject,
  onDeleteProject,
  onOpenCreateProjectTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onLogTaskHours,
  onSendNotification,
  onCreateMasterPlan,
  onDeleteMasterPlan,
  onAddTasks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const viewMode: 'grid' | 'table' = 'table';

  // Dropdown open states and refs for outside click handling
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const projectsDropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectsDropdownRef.current &&
        !projectsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectsDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected Project for Dashboard
  const [selectedProjectForDashboard, setSelectedProjectForDashboard] = useState<ProjectItem | null>(() => {
    if (initialSelectedProjectId && initialSelectedProjectId !== 'ALL') {
      return (
        projects.find(
          (p) =>
            p.id === initialSelectedProjectId ||
            p.name.trim().toLowerCase() === initialSelectedProjectId.trim().toLowerCase()
        ) || null
      );
    }
    return null;
  });

  React.useEffect(() => {
    if (initialSelectedProjectId && initialSelectedProjectId !== 'ALL') {
      const matched = projects.find(
        (p) =>
          p.id === initialSelectedProjectId ||
          p.name.trim().toLowerCase() === initialSelectedProjectId.trim().toLowerCase()
      );
      if (matched) {
        setSelectedProjectForDashboard(matched);
      }
    }
  }, [initialSelectedProjectId, projects]);

  // Assign Employee Modal State
  const [assignProject, setAssignProject] = useState<ProjectItem | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<AdminUserItem | null>(null);
  const [assignedMap, setAssignedMap] = useState<Record<string, AdminUserItem[]>>({});

  // Edit / Delete Project Modal State
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  const filteredProjects = projects.filter((p) => {
    const searchMatch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.technologies && p.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const projectMatch =
      selectedProjectIdFilter === 'ALL' || p.id === selectedProjectIdFilter;

    const statusMatch = statusFilter === 'ALL' || p.status === statusFilter;

    return searchMatch && projectMatch && statusMatch;
  });

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPlatformIcon = (plat?: string) => {
    switch (plat) {
      case 'Mobile App':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'API / Backend':
      case 'Cloud / Server':
        return <Server className="w-4 h-4 text-emerald-600" />;
      case 'E-Commerce':
        return <ShoppingCart className="w-4 h-4 text-orange-600" />;
      case 'Website':
      case 'Web Application':
      default:
        return <Globe className="w-4 h-4 text-blue-600" />;
    }
  };

  const handleConfirmAssign = () => {
    if (!assignProject || !selectedEmployee) return;
    setAssignedMap((prev) => ({
      ...prev,
      [assignProject.id]: [...(prev[assignProject.id] || []), selectedEmployee],
    }));
    if (onAssignEmployee) onAssignEmployee(assignProject.id, selectedEmployee);
    setAssignProject(null);
    setSelectedEmployee(null);
    setAssignSearch('');
  };

  const filteredEmployees = adminsList.filter(
    (e) =>
      e.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
      e.email.toLowerCase().includes(assignSearch.toLowerCase()) ||
      e.role.toLowerCase().includes(assignSearch.toLowerCase())
  );

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectIdFilter);

  // If a project is selected/touched, render its dedicated Project Dashboard
  if (selectedProjectForDashboard) {
    const found = projects.find((p) => p.id === selectedProjectForDashboard.id);
    const activeProject: ProjectItem = {
      ...(found || selectedProjectForDashboard),
      modules: selectedProjectForDashboard.modules !== undefined ? selectedProjectForDashboard.modules : (found?.modules || []),
      sprints: selectedProjectForDashboard.sprints !== undefined ? selectedProjectForDashboard.sprints : (found?.sprints || []),
      workTypes: selectedProjectForDashboard.workTypes !== undefined ? selectedProjectForDashboard.workTypes : (found?.workTypes || []),
    };

    return (
      <ProjectDashboardView
        project={activeProject}
        tasks={tasks}
        adminsList={adminsList}
        masterPlans={masterPlans}
        currentUser={currentUser}
        userRole={userRole}
        onBack={() => setSelectedProjectForDashboard(null)}
        onUpdateProject={(updated) => {
          setSelectedProjectForDashboard(updated);
          if (onUpdateProject) onUpdateProject(updated);
        }}
        onDeleteProject={(pId) => {
          if (onDeleteProject) onDeleteProject(pId);
          setSelectedProjectForDashboard(null);
        }}
        onAssignEmployee={onAssignEmployee}
        onOpenCreateProjectTask={onOpenCreateProjectTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onUpdateTaskStatus={onUpdateTaskStatus}
        onLogTaskHours={onLogTaskHours}
        onSendNotification={onSendNotification}
        notifications={notifications}
        onCreateMasterPlan={onCreateMasterPlan}
        onDeleteMasterPlan={onDeleteMasterPlan}
        onAddTasks={onAddTasks}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {/* <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Projects Directory
          </h2> */}
          {/* <p className="text-sm text-slate-500">
            Manage enterprise client delivery tracks, platforms, technology stacks, and milestones
          </p> */}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateProject}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition"
          >
            <FolderPlus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Projects</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{projects.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Active In Progress</p>
            <p className="text-2xl font-bold text-purple-600 font-mono">
              {projects.filter((p) => p.status === 'In Progress').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Pending Review</p>
            <p className="text-2xl font-bold text-orange-600 font-mono">
              {projects.filter((p) => p.status === 'Pending' || p.status === 'On Hold').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 font-mono">
              {projects.filter((p) => p.status === 'Completed').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search project name, code, client, or technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Projects Dropdown */}
          <div className="relative" ref={projectsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsProjectsDropdownOpen(!isProjectsDropdownOpen);
                setIsStatusDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap border shadow-2xs ${selectedProjectIdFilter !== 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
            >
              <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[140px] truncate">
                {selectedProjectObj ? selectedProjectObj.name : 'Projects'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProjectsDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
              />
            </button>

            {isProjectsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-60 max-h-80 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    SELECT PROJECT
                  </span>
                </div>
                <div className="py-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectIdFilter('ALL');
                      setIsProjectsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-medium transition ${selectedProjectIdFilter === 'ALL'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>All Projects</span>
                    </span>
                    {selectedProjectIdFilter === 'ALL' && (
                      <Check className="w-4 h-4 text-slate-800" />
                    )}
                  </button>
                  {projects.map((proj) => {
                    const dotColor =
                      proj.status === 'Completed'
                        ? 'bg-emerald-500'
                        : proj.status === 'Pending'
                          ? 'bg-orange-500'
                          : proj.status === 'On Hold'
                            ? 'bg-amber-500'
                            : 'bg-blue-600';

                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectIdFilter(proj.id);
                          setIsProjectsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-medium transition ${selectedProjectIdFilter === proj.id
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        <span className="flex items-center gap-3 truncate">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                          <span className="truncate">{proj.name}</span>
                        </span>
                        {selectedProjectIdFilter === proj.id && (
                          <Check className="w-4 h-4 text-slate-800 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                setIsProjectsDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap border shadow-2xs ${statusFilter !== 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
            >
              <span>{statusFilter !== 'ALL' ? statusFilter : 'Status'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 ${statusFilter !== 'ALL' ? 'text-blue-600' : 'text-slate-400'
                  } transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
              />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    SELECT STATUS
                  </span>
                </div>
                <div className="py-1.5 space-y-0.5">
                  {[
                    { label: 'All Statuses', value: 'ALL', color: 'bg-slate-400' },
                    { label: 'In Progress', value: 'In Progress', color: 'bg-blue-600' },
                    { label: 'Pending', value: 'Pending', color: 'bg-orange-500' },
                    { label: 'Completed', value: 'Completed', color: 'bg-emerald-500' },
                    { label: 'On Hold', value: 'On Hold', color: 'bg-amber-500' },
                  ].map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(st.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-medium transition ${statusFilter === st.value
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                        <span>{st.label}</span>
                      </span>
                      {statusFilter === st.value && (
                        <Check className="w-4 h-4 text-slate-800" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE VIEW (Default) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Platform & Stack</th>
                  <th className="py-3.5 px-4">Modules</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Manager</th>
                  <th className="py-3.5 px-4">Assigned Team</th>
                  <th className="py-3.5 px-4">Actions</th>
                  <th className="py-3.5 px-4 text-center">Progress</th>
                  <th className="py-3.5 px-4 text-center">status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p, idx) => {
                  // Merge project's built-in assignedEmployees with locally assigned ones
                  const builtIn = (p.assignedEmployees || []).map((e) => ({
                    id: e.id,
                    name: e.name,
                    email: e.email || '',
                    avatar: e.avatar,
                    role: (e.role as any) || 'EMPLOYEE',
                    phone: '',
                    status: 'ACTIVE' as const,
                    lastLogin: '',
                    createdAt: '',
                  }));
                  const locallyAdded = assignedMap[p.id] || [];
                  const assignedAll: typeof locallyAdded = [...builtIn];
                  locallyAdded.forEach((la) => {
                    if (!assignedAll.some((a) => a.id === la.id)) assignedAll.push(la);
                  });
                  const assigned = assignedAll;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                      {/* # */}
                      <td className="py-4 px-4 text-slate-400 font-mono text-[11px] font-semibold">
                        {idx + 1}
                      </td>

                      {/* Project */}
                      <td className="py-4 px-4 min-w-[180px]">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectForDashboard(p)}
                          className="text-left group/p cursor-pointer w-full"
                          title={`Open ${p.name} Dashboard`}
                        >
                          <p className="font-bold text-slate-900 text-xs leading-tight group-hover/p:text-indigo-600 transition flex items-center gap-1">
                            <span>{p.name}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover/p:opacity-100 transition text-indigo-500" />
                          </p>
                          {p.projectType && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{p.projectType}</p>
                          )}
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            <Calendar className="w-3 h-3 inline mr-0.5 text-slate-400" />
                            {p.startDate} → {p.endDate}
                          </p>
                        </button>
                      </td>

                      {/* Client */}
                      <td className="py-4 px-4 min-w-[150px]">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <p className="font-semibold text-slate-800 text-xs">{p.client}</p>
                        </div>
                        {p.clientDetails && (
                          <p className="text-[10px] text-slate-400 mt-0.5 ml-5">
                            {p.clientDetails.contactPerson}
                          </p>
                        )}
                      </td>

                      {/* Platform & Stack */}
                      <td className="py-4 px-4 min-w-[140px]">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 text-[11px]">
                          {getPlatformIcon(p.platform)}
                          {p.platform || 'Web Application'}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(p.technologies || []).slice(0, 3).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-semibold text-slate-600 border border-slate-200">
                              {t}
                            </span>
                          ))}
                          {(p.technologies || []).length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-semibold text-slate-500">
                              +{(p.technologies || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Modules */}
                      <td className="py-4 px-4 min-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {(p.modules || []).slice(0, 3).map((m) => (
                            <span key={m} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              {m}
                            </span>
                          ))}
                          {(p.modules || []).length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
                              +{(p.modules || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {p.durationDays ? `${p.durationDays} Days` : '45 Days'}
                      </td>

                      {/* Manager */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <img src={p.manager.avatar} alt={p.manager.name} className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800 text-[11px]">{p.manager.name}</p>
                            <p className="text-[9px] text-slate-400">{p.manager.role}</p>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Team */}
                      <td className="py-4 px-4 min-w-[120px]">
                        {assigned.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {assigned.slice(0, 2).map((emp) => (
                              <div key={emp.id} className="flex items-center gap-1.5">
                                <img src={emp.avatar} alt={emp.name} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                                <span className="text-[10px] font-medium text-slate-700 truncate max-w-[90px]">{emp.name}</span>
                              </div>
                            ))}
                            {assigned.length > 2 && (
                              <span className="text-[10px] text-slate-400">+{assigned.length - 2} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No employees yet</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4">
                        {onUpdateProjectStatus ? (
                          <div className="relative">
                            <select
                              value={p.status}
                              onChange={(e) => onUpdateProjectStatus(p.id, e.target.value as ProjectItem['status'])}
                              className={`py-1 pl-2.5 pr-6 rounded-lg text-[10px] font-bold border cursor-pointer appearance-none ${getStatusBadge(p.status)}`}
                            >
                              <option value="In Progress">In Progress</option>
                              <option value="Pending">Pending</option>
                              <option value="Completed">Completed</option>
                              <option value="On Hold">On Hold</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(p.status)}`}>
                            {p.status}
                          </span>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs font-mono">{p.progress}%</span>
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${p.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* satat */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 justify-center">
                          <button
                            onClick={() => {
                              setAssignProject(p);
                              setSelectedEmployee(null);
                              setAssignSearch('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition whitespace-nowrap"
                            title="Assign Employee to Project"
                          >
                            <UserPlus className="w-3 h-3" />
                            Assign
                          </button>
                          <button
                            onClick={() => setSelectedProjectForDashboard(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition whitespace-nowrap cursor-pointer"
                            title="Open Project Dashboard"
                          >
                            <LayoutDashboard className="w-3 h-3 text-indigo-600" />
                            Dashboard
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingProject(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProjects.length === 0 && (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Projects Found</h4>
                <p className="text-xs text-slate-400">Try a different search or filter, or create a new project.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const builtInGrid = (project.assignedEmployees || []).map((e) => ({
              id: e.id, name: e.name, email: e.email || '', avatar: e.avatar,
              role: (e.role as any) || 'EMPLOYEE', phone: '', status: 'ACTIVE' as const, lastLogin: '', createdAt: '',
            }));
            const locallyAddedGrid = assignedMap[project.id] || [];
            const assignedAllGrid: typeof locallyAddedGrid = [...builtInGrid];
            locallyAddedGrid.forEach((la) => { if (!assignedAllGrid.some((a) => a.id === la.id)) assignedAllGrid.push(la); });
            const assigned = assignedAllGrid;
            return (
              <div
                key={project.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header Badge Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {project.projectType && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                          {project.projectType}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Project Title */}
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForDashboard(project)}
                    className="text-left w-full group/cardtitle cursor-pointer"
                    title={`Open ${project.name} Dashboard`}
                  >
                    <h3 className="text-base font-bold text-slate-900 leading-tight group-hover/cardtitle:text-indigo-600 transition flex items-center gap-1.5">
                      <span>{project.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/cardtitle:opacity-100 transition text-indigo-500" />
                    </h3>
                  </button>
                  <p className="text-xs text-slate-500 font-medium">Client: {project.client}</p>
                  {project.clientDetails && (
                    <p className="text-[11px] text-slate-400">
                      Contact: {project.clientDetails.contactPerson} ({project.clientDetails.email})
                    </p>
                  )}

                  {/* Platform & Technologies */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        {getPlatformIcon(project.platform)}
                        {project.platform || 'Web Application'}
                      </span>
                      {project.durationDays && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3 text-blue-600" />
                          {project.durationDays} Days
                        </span>
                      )}
                    </div>

                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.technologies.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modules */}
                  {project.modules && project.modules.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Active Modules ({project.modules.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {project.modules.slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200"
                          >
                            {m}
                          </span>
                        ))}
                        {project.modules.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            +{project.modules.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Employees in Grid */}
                  {assigned.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        <Users className="w-3 h-3 inline mr-1" />Assigned Team ({assigned.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {assigned.map((emp) => (
                          <div key={emp.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1">
                            <img src={emp.avatar} alt={emp.name} className="w-4 h-4 rounded-full object-cover" />
                            <span className="text-[10px] font-semibold text-indigo-700">{emp.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress & Footer */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={project.manager.avatar}
                        alt={project.manager.name}
                        className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-semibold text-slate-700">{project.manager.name}</span>
                    </div>
                    <span className="font-mono font-bold text-blue-600">{project.progress}%</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Due: {project.endDate}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAssignProject(project);
                          setSelectedEmployee(null);
                          setAssignSearch('');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign
                      </button>
                      <button
                        onClick={() => setSelectedProjectForDashboard(project)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        title="Open Project Dashboard"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dashboard
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingProject(project)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== ASSIGN EMPLOYEE MODAL ===== */}
      {assignProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Assign Employee</h3>
                  <p className="text-[11px] text-slate-500">
                    to <strong className="text-slate-700">{assignProject.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignProject(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Project Info Banner */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(assignProject.status)}`}>
                  {assignProject.status}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  <Calendar className="w-3 h-3 inline mr-0.5" />
                  Due: {assignProject.endDate}
                </span>
              </div>
            </div>

            {/* Search Employees */}
            <div className="px-6 pt-5 pb-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Search & Select Employee
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50"
                  autoFocus
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="px-6 pb-4 max-h-[380px] overflow-y-auto space-y-2">
              <div className="flex items-center justify-between pb-1 text-[11px] text-slate-400 font-medium">
                <span>All Registered Members ({filteredEmployees.length})</span>
                <span>Select to allocate</span>
              </div>
              {filteredEmployees.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No matching employees found in database.</p>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployee?.id === emp.id;
                  const alreadyAssigned =
                    (assignProject.assignedEmployees || []).some((e) => e.id === emp.id || (e.email && e.email.toLowerCase() === emp.email.toLowerCase())) ||
                    (assignedMap[assignProject.id] || []).some((e) => e.id === emp.id || (e.email && e.email.toLowerCase() === emp.email.toLowerCase()));
                  return (
                    <button
                      key={emp.id}
                      onClick={() => !alreadyAssigned && setSelectedEmployee(isSelected ? null : emp)}
                      disabled={alreadyAssigned}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${alreadyAssigned
                        ? 'bg-emerald-50 border-emerald-200 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40'
                        }`}
                    >
                      <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{emp.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{emp.email}</p>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${emp.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700' :
                          emp.role === 'ADMIN' ? 'bg-blue-50 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                          {emp.role === 'SUPER_ADMIN' ? 'Super Admin' : emp.role === 'ADMIN' ? 'Admin' : 'Employee'}
                        </span>
                      </div>
                      {alreadyAssigned ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Preview */}
            {selectedEmployee && (
              <div className="px-6 pb-3">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="w-7 h-7 rounded-full object-cover border border-indigo-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-900 truncate">{selectedEmployee.name}</p>
                    <p className="text-[10px] text-indigo-600 truncate">{selectedEmployee.email}</p>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)}>
                    <X className="w-3.5 h-3.5 text-indigo-400 hover:text-indigo-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <button
                onClick={() => setAssignProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={!selectedEmployee}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${selectedEmployee
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign to {assignProject.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT PROJECT MODAL ===== */}
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onUpdateProject={(upd) => {
            if (onUpdateProject) onUpdateProject(upd);
            setEditingProject(null);
          }}
          onDeleteProject={(pId) => {
            if (onDeleteProject) onDeleteProject(pId);
            setEditingProject(null);
          }}
          managersList={adminsList}
          employeesList={adminsList}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
