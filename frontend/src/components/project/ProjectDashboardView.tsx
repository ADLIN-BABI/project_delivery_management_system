import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Building,
  Users,
  Layers,
  Zap,
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  UserPlus,
  Search,
  Flag,
  Target,
  Briefcase,
  X,
} from 'lucide-react';
import {
  ProjectItem,
  TaskItem,
  AdminUserItem,
  MasterPlanItem,
  User,
  NotificationItem,
} from '../../types';
import { CreateProjectTaskModal } from '../modals/CreateProjectTaskModal';
import { EditProjectModal } from '../modals/EditProjectModal';
import { EditProjectTaskModal } from '../modals/EditProjectTaskModal';
import { PersonDashboardView } from './PersonDashboardView';

interface ProjectDashboardViewProps {
  project: ProjectItem;
  tasks: TaskItem[];
  adminsList: AdminUserItem[];
  masterPlans?: MasterPlanItem[];
  currentUser?: User;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  notifications?: NotificationItem[];
  onBack: () => void;
  onUpdateProject: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
  onAssignEmployee?: (projectId: string, employee: AdminUserItem) => void;
  onOpenCreateProjectTask?: () => void;
  onUpdateTask?: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskItem['status']) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
  onSendNotification?: (notif: any) => void;
  onCreateMasterPlan?: (data: { project_id?: string; project_name?: string; work_type: string }) => Promise<void>;
  onDeleteMasterPlan?: (id: string) => Promise<void>;
  onAddTasks?: (tasks: TaskItem[]) => void;
}

export const ProjectDashboardView: React.FC<ProjectDashboardViewProps> = ({
  project,
  tasks = [],
  adminsList = [],
  masterPlans: _masterPlans = [],
  currentUser,
  userRole = 'SUPER_ADMIN',
  notifications = [],
  onBack,
  onUpdateProject,
  onDeleteProject,
  onAssignEmployee,
  onUpdateTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onLogTaskHours,
  onSendNotification,
  onCreateMasterPlan: _onCreateMasterPlan,
  onDeleteMasterPlan: _onDeleteMasterPlan,
  onAddTasks,
}) => {
  // --- Modals State ---
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState<'tasks' | 'work-type' | 'modules' | 'sprints'>('tasks');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [selectedMemberForDashboard, setSelectedMemberForDashboard] = useState<{
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  } | null>(null);

  // --- Assign Team Modal State ---
  const [isAssignTeamOpen, setIsAssignTeamOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState<AdminUserItem | null>(null);

  // --- Local Reactive State (Optimistic & Synced with Database) ---
  const [localModules, setLocalModules] = useState<string[]>(() => project.modules || []);
  const [newModuleName, setNewModuleName] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);

  // --- Sprints State (No Start/End Dates needed) ---
  const [localSprints, setLocalSprints] = useState<any[]>(() => project.sprints || []);
  const [isAddingSprint, setIsAddingSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');

  // --- Work Type / Full Work State ---
  const [localWorkTypes, setLocalWorkTypes] = useState<string[]>(() => project.workTypes || []);
  const [isAddingWorkType, setIsAddingWorkType] = useState(false);
  const [newWorkTypeName, setNewWorkTypeName] = useState('');

  // Keep local states strictly synchronized with incoming project updates
  useEffect(() => {
    if (project.modules) setLocalModules(project.modules);
  }, [project.modules]);

  useEffect(() => {
    if (project.sprints) setLocalSprints(project.sprints);
  }, [project.sprints]);

  useEffect(() => {
    if (project.workTypes) setLocalWorkTypes(project.workTypes);
  }, [project.workTypes]);

  const currentWorkTypes = localWorkTypes;
  const currentModules = localModules;
  const currentSprints = localSprints;

  // --- Task Filters State ---
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL');
  const [taskWorkTypeFilter, setTaskWorkTypeFilter] = useState<string>('ALL');
  const [taskModuleFilter, setTaskModuleFilter] = useState<string>('ALL');
  const [taskSprintFilter, setTaskSprintFilter] = useState<string>('ALL');

  // Filter tasks belonging strictly to this project
  const projectTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        (t.project && t.project.trim().toLowerCase() === project.name.trim().toLowerCase()) ||
        (t.id && (t as any).projectId === project.id)
    );
  }, [tasks, project.name, project.id]);

  // Derived Project Tasks with Filters
  const filteredProjectTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(taskSearch.toLowerCase()) ||
        (t.assignee?.name || '').toLowerCase().includes(taskSearch.toLowerCase()) ||
        (t.workType || '').toLowerCase().includes(taskSearch.toLowerCase());

      const matchesStatus = taskStatusFilter === 'ALL' || t.status === taskStatusFilter;
      const matchesWorkType =
        taskWorkTypeFilter === 'ALL' ||
        (t.workType || '').trim().toLowerCase() === taskWorkTypeFilter.trim().toLowerCase();
      const matchesModule =
        taskModuleFilter === 'ALL' ||
        (t.module || '').trim().toLowerCase() === taskModuleFilter.trim().toLowerCase();
      const matchesSprint =
        taskSprintFilter === 'ALL' ||
        (t.sprint || '').trim().toLowerCase() === taskSprintFilter.trim().toLowerCase();

      return matchesSearch && matchesStatus && matchesWorkType && matchesModule && matchesSprint;
    });
  }, [projectTasks, taskSearch, taskStatusFilter, taskWorkTypeFilter, taskModuleFilter, taskSprintFilter]);

  // Metrics
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = projectTasks.filter((t) => t.status === 'In Progress').length;
  const inReviewTasks = projectTasks.filter((t) => t.status === 'In Review').length;
  const toDoTasks = projectTasks.filter((t) => t.status === 'To Do').length;

  // Assigned Team Members
  const assignedTeam = project.assignedEmployees || [];

  // Registered Employees that can be added
  const availableEmployeesToAssign = useMemo(() => {
    const assignedIds = new Set(assignedTeam.map((e) => e.id));
    const assignedEmails = new Set(assignedTeam.map((e) => (e.email || '').toLowerCase()));

    return adminsList
      .filter((emp) => emp.status === 'ACTIVE' || emp.status !== 'BANNED')
      .filter((emp) => !assignedIds.has(emp.id) && !assignedEmails.has((emp.email || '').toLowerCase()))
      .filter((emp) => {
        if (!teamSearch) return true;
        return (
          emp.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
          emp.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
          emp.role.toLowerCase().includes(teamSearch.toLowerCase())
        );
      });
  }, [adminsList, assignedTeam, teamSearch]);

  // --- Module Actions ---
  const handleAddModule = () => {
    const name = newModuleName.trim();
    if (!name) return;
    if (currentModules.some((m) => m.toLowerCase() === name.toLowerCase())) {
      alert('This module already exists in this project.');
      return;
    }
    const updatedModules = [...currentModules, name];
    setLocalModules(updatedModules);
    onUpdateProject({
      ...project,
      modules: updatedModules,
    });
    setNewModuleName('');
    setIsAddingModule(false);
  };

  const handleRemoveModule = (moduleToRemove: string) => {
    if (confirm(`Remove module "${moduleToRemove}" from this project?`)) {
      const updatedModules = currentModules.filter((m) => m !== moduleToRemove);
      setLocalModules(updatedModules);
      onUpdateProject({
        ...project,
        modules: updatedModules,
      });
    }
  };

  // --- Sprint Actions ---
  const handleAddSprint = () => {
    const name = newSprintName.trim();
    if (!name) return;
    if (currentSprints.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      alert('A sprint with this name already exists in this project.');
      return;
    }
    const newSprint = {
      id: `sp-${Date.now()}`,
      name,
      status: 'Active' as const,
    };
    const updatedSprints = [...currentSprints, newSprint];
    setLocalSprints(updatedSprints);
    onUpdateProject({
      ...project,
      sprints: updatedSprints,
    });
    setNewSprintName('');
    setIsAddingSprint(false);
  };

  const handleRemoveSprint = (sprintId: string, sprintName: string) => {
    if (confirm(`Remove sprint "${sprintName}"?`)) {
      const updatedSprints = currentSprints.filter((s) => s.id !== sprintId);
      setLocalSprints(updatedSprints);
      onUpdateProject({
        ...project,
        sprints: updatedSprints,
      });
    }
  };

  // --- Work Type / Full Work Actions ---
  const handleAddWorkType = () => {
    const name = newWorkTypeName.trim();
    if (!name) return;
    if (currentWorkTypes.some((wt) => wt.toLowerCase() === name.toLowerCase())) {
      alert('This work type already exists in this project.');
      return;
    }
    const updatedWorkTypes = [...currentWorkTypes, name];
    setLocalWorkTypes(updatedWorkTypes);
    onUpdateProject({
      ...project,
      workTypes: updatedWorkTypes,
    });
    setNewWorkTypeName('');
    setIsAddingWorkType(false);
  };

  const handleRemoveWorkType = (workTypeName: string) => {
    if (confirm(`Remove Work Type "${workTypeName}" from this project?`)) {
      const updatedWorkTypes = currentWorkTypes.filter((w) => w !== workTypeName);
      setLocalWorkTypes(updatedWorkTypes);
      onUpdateProject({
        ...project,
        workTypes: updatedWorkTypes,
      });
    }
  };


  // --- Team Actions ---
  const handleConfirmAssignMember = () => {
    if (!selectedEmployeeForAssign) return;
    if (onAssignEmployee) {
      onAssignEmployee(project.id, selectedEmployeeForAssign);
    } else {
      const updatedTeam = [
        ...assignedTeam,
        {
          id: selectedEmployeeForAssign.id,
          name: selectedEmployeeForAssign.name,
          avatar: selectedEmployeeForAssign.avatar,
          role: selectedEmployeeForAssign.role,
          email: selectedEmployeeForAssign.email,
        },
      ];
      onUpdateProject({
        ...project,
        assignedEmployees: updatedTeam,
      });
    }
    setSelectedEmployeeForAssign(null);
    setIsAssignTeamOpen(false);
  };

  const handleRemoveTeamMember = (empId: string, empName: string) => {
    if (confirm(`Remove ${empName} from ${project.name}?`)) {
      const updatedTeam = assignedTeam.filter((e) => e.id !== empId);
      onUpdateProject({
        ...project,
        assignedEmployees: updatedTeam,
      });
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Review':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Pending':
      case 'To Do':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // If an employee/team member is touched, navigate into their dedicated Person Dashboard
  if (selectedMemberForDashboard) {
    return (
      <>
        <PersonDashboardView
          member={selectedMemberForDashboard}
          project={project}
          tasks={projectTasks}
          currentUser={currentUser}
          userRole={userRole}
          notifications={notifications}
          onBack={() => setSelectedMemberForDashboard(null)}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onLogTaskHours={onLogTaskHours}
          onSendNotification={onSendNotification}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
        />
        {isCreateTaskOpen && (
          <CreateProjectTaskModal
            isOpen={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            onAddTasks={(newTasks) => {
              if (onAddTasks) onAddTasks(newTasks);
              setIsCreateTaskOpen(false);
            }}
            projects={[project]}
            adminsList={adminsList}
            masterPlans={_masterPlans}
            onUpdateProject={onUpdateProject}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-16">
      {/* ===== TOP NAVIGATION / BREADCRUMB BAR ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition group"
            title="Back to Projects Directory"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Projects</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Project Task</span>
          </button>
          <button
            onClick={() => setIsEditProjectOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Project</span>
          </button>
        </div>
      </div>

      {/* ===== PROJECT OVERVIEW HERO CARD ===== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/5 via-blue-500/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main info */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(project.status)}`}>
                {project.status}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Client: <strong className="text-slate-900">{project.client}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Platform: <strong className="text-slate-900">{project.platform || 'Website'}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {project.startDate || '—'} → {project.endDate || '—'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {project.description ||
                'Complete enterprise project dashboard tracking team allocations, modules, sprints, and task execution.'}
            </p>

            {/* Quick KPI stats */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                <Users className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Size</p>
                  <p className="text-sm font-bold text-slate-800">{assignedTeam.length} Members</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                <Layers className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modules</p>
                  <p className="text-sm font-bold text-slate-800">{currentModules.length} Modules</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                <Zap className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprints</p>
                  <p className="text-sm font-bold text-slate-800">{currentSprints.length} Sprints</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                <Target className="w-4 h-4 text-pink-600" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Types</p>
                  <p className="text-sm font-bold text-slate-800">{currentWorkTypes.length} Types</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks</p>
                  <p className="text-sm font-bold text-slate-800">{completedTasks} / {totalTasks} Done</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="lg:col-span-4 bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Progress</span>
              <span className="text-xl font-black text-indigo-600 font-mono">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${project.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                  }`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{completedTasks} Tasks Completed</span>
              <span>{toDoTasks + inProgressTasks + inReviewTasks} Remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VERTICAL SECTION 1: TEAM OF PROJECTS (SHOW TEAM OF PROJECTS IN DASHBOARD) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Project Team & Members</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {assignedTeam.length}
              </span>
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedEmployeeForAssign(null);
              setTeamSearch('');
              setIsAssignTeamOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Assign Employee</span>
          </button>
        </div>

        {assignedTeam.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No team members assigned to this project yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Click "+ Assign Employee" to allocate staff from your registered database members.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {assignedTeam.map((emp) => {
              const empTasks = projectTasks.filter(
                (t) =>
                  (t.assignee?.email && t.assignee.email.toLowerCase() === (emp.email || '').toLowerCase()) ||
                  (t.assignee?.name && t.assignee.name.toLowerCase() === emp.name.toLowerCase())
              );
              const empTasksCount = empTasks.length;
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedMemberForDashboard(emp)}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-400 hover:shadow-md transition group relative flex flex-col justify-between cursor-pointer"
                  title={`Touch to open ${emp.name}'s Person Dashboard, working updates & send project notifications`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          emp.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={emp.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate group-hover:text-indigo-600 transition flex items-center gap-1">
                          <span>{emp.name}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{emp.email || 'No email'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTeamMember(emp.id, emp.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Remove from project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {emp.role}
                    </span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-1 group-hover:underline">
                      <span>{empTasksCount} {empTasksCount === 1 ? 'task' : 'tasks'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold">Person Dashboard →</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PROJECT TASKS & WORK SPECIFICATIONS HUB                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveProjectTab('tasks')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeProjectTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Project Tasks</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                activeProjectTab === 'tasks' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {filteredProjectTasks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProjectTab('work-type')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeProjectTab === 'work-type'
                  ? 'bg-pink-600 text-white shadow-sm shadow-pink-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Work Type / Full Work</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                activeProjectTab === 'work-type' ? 'bg-pink-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {currentWorkTypes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProjectTab('modules')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeProjectTab === 'modules'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Modules</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                activeProjectTab === 'modules' ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {currentModules.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProjectTab('sprints')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeProjectTab === 'sprints'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Sprints / Spirit</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                activeProjectTab === 'sprints' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {currentSprints.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Assign Project Task</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-PAGE 1: WORK TYPE / FULL WORK PAGE                                    */}
        {/* ========================================================================= */}
        {activeProjectTab === 'work-type' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-pink-50/50 rounded-2xl border border-pink-200/80">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveProjectTab('tasks')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Tasks</span>
                </button>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-pink-600" />
                    <span>Work Type / Full Work Management</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                      {currentWorkTypes.length} Types
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add work specifications for {project.name}. Only what you add here appears in Assign Project Tasks.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingWorkType(!isAddingWorkType)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Work Type / Full Work</span>
              </button>
            </div>

            {/* Inline Add Form */}
            {isAddingWorkType && (
              <div className="p-4 rounded-2xl bg-white border border-pink-300 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-900 uppercase">
                    Add New Work Type / Full Work
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingWorkType(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Frontend Development, Core API Systems, QA & Testing Signoff..."
                    value={newWorkTypeName}
                    onChange={(e) => setNewWorkTypeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddWorkType();
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-pink-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-pink-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddWorkType}
                    className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm transition whitespace-nowrap cursor-pointer"
                  >
                    Confirm Add Work Type
                  </button>
                </div>
              </div>
            )}

            {/* Work Types Table */}
            {currentWorkTypes.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <Target className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Work Types Added Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "+ Add Work Type / Full Work" to add your first work type for this project.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingWorkType(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Work Type / Full Work</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Work Type / Full Work Name</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Tasks Assigned</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentWorkTypes.map((wt, idx) => {
                      const tasksCount = projectTasks.filter(
                        (t) => (t.workType || '').trim().toLowerCase() === wt.trim().toLowerCase()
                      ).length;
                      return (
                        <tr key={wt} className="hover:bg-pink-50/20 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-pink-600 flex-shrink-0" />
                              <span className="font-bold text-slate-900 text-xs">{wt}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">{project.name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {tasksCount} {tasksCount === 1 ? 'task' : 'tasks'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveWorkType(wt)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete work type"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-PAGE 2: MODULES PAGE                                                  */}
        {/* ========================================================================= */}
        {activeProjectTab === 'modules' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-200/80">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveProjectTab('tasks')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Tasks</span>
                </button>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <span>Project Modules Management</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      {currentModules.length} Modules
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add feature modules for {project.name}. Only what you add here appears in Assign Project Tasks.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingModule(!isAddingModule)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Module</span>
              </button>
            </div>

            {/* Inline Add Form */}
            {isAddingModule && (
              <div className="p-4 rounded-2xl bg-white border border-purple-300 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase">
                    Add New Module
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingModule(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Authentication & Security, Checkout & Payments, UI/UX Lead..."
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddModule();
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition whitespace-nowrap cursor-pointer"
                  >
                    Confirm Add Module
                  </button>
                </div>
              </div>
            )}

            {/* Modules Table */}
            {currentModules.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <Layers className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Modules Added Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "+ Add Module" to define feature components for this project.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingModule(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Module</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Module Name</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Tasks Assigned</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentModules.map((mod, idx) => {
                      const tasksCount = projectTasks.filter(
                        (t) => (t.module || '').trim().toLowerCase() === mod.trim().toLowerCase()
                      ).length;
                      return (
                        <tr key={mod} className="hover:bg-purple-50/20 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              <span className="font-bold text-slate-900 text-xs">{mod}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">{project.name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {tasksCount} {tasksCount === 1 ? 'task' : 'tasks'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveModule(mod)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete module"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-PAGE 3: SPRINTS / SPIRIT PAGE                                         */}
        {/* ========================================================================= */}
        {activeProjectTab === 'sprints' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveProjectTab('tasks')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Tasks</span>
                </button>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>Project Sprints / Spirit Management</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {currentSprints.length} Sprints
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add milestone sprints for {project.name}. Only what you add here appears in Assign Project Tasks.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingSprint(!isAddingSprint)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Sprint</span>
              </button>
            </div>

            {/* Inline Add Form */}
            {isAddingSprint && (
              <div className="p-4 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 uppercase">
                    Create New Sprint
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingSprint(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Sprint 1 - Foundation & Delivery..."
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSprint();
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSprint}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition whitespace-nowrap cursor-pointer"
                  >
                    Confirm Add Sprint
                  </button>
                </div>
              </div>
            )}

            {/* Sprints Table */}
            {currentSprints.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <Zap className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Sprints Added Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "+ Add Sprint" to create delivery milestone sprints for this project.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingSprint(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Sprint</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Sprint Name</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentSprints.map((sp) => (
                      <tr key={sp.id} className="hover:bg-amber-50/20 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span className="font-bold text-slate-900 text-xs">{sp.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSprint(sp.id, sp.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete sprint"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DEFAULT VIEW: PROJECT TASKS TABLE + THE SCREENSHOT SELECTION TABLE        */}
        {/* ========================================================================= */}
        {activeProjectTab === 'tasks' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* ===================================================================== */}
            {/* VERTICAL TABLE FORMAT FOR WORK TYPE, MODULES, SPRINTS                */}
            {/* Click anyone to go to that page and add something!                   */}
            {/* ===================================================================== */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs bg-white">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Work Specifications & Module Breakdown (Click Row to Open Page & Add)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  3 Vertical Specification Tracks
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Track / Category</th>
                      <th className="py-2.5 px-4">Added Items</th>
                      <th className="py-2.5 px-4">Task Coverage</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {/* 1. Work Type / Full Work Row */}
                    <tr
                      onClick={() => setActiveProjectTab('work-type')}
                      className="hover:bg-pink-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center font-bold">
                            <Target className="w-4 h-4 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-pink-600 transition">
                              Work Type / Full Work
                            </p>
                            <p className="text-[10px] text-slate-400">Work specifications & deliverables for this project</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {currentWorkTypes.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic">None added yet (Click to add)</span>
                          ) : (
                            currentWorkTypes.map((wt) => (
                              <span
                                key={wt}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-bold"
                              >
                                {wt}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-slate-700">
                          {currentWorkTypes.length} Types
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProjectTab('work-type');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Open Page & Add +</span>
                        </button>
                      </td>
                    </tr>

                    {/* 2. Modules Row */}
                    <tr
                      onClick={() => setActiveProjectTab('modules')}
                      className="hover:bg-purple-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                            <Layers className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-purple-600 transition">
                              Modules
                            </p>
                            <p className="text-[10px] text-slate-400">Functional components for this project</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {currentModules.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic">None added yet (Click to add)</span>
                          ) : (
                            currentModules.map((mod) => (
                              <span
                                key={mod}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold"
                              >
                                {mod}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-slate-700">
                          {currentModules.length} Modules
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProjectTab('modules');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Open Page & Add +</span>
                        </button>
                      </td>
                    </tr>

                    {/* 3. Sprints Row */}
                    <tr
                      onClick={() => setActiveProjectTab('sprints')}
                      className="hover:bg-amber-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                            <Zap className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-amber-600 transition">
                              Sprints / Spirit
                            </p>
                            <p className="text-[10px] text-slate-400">Delivery milestones and execution cycles</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {currentSprints.length === 0 ? (
                            <span className="text-slate-400 text-[11px] italic">None added yet (Click to add)</span>
                          ) : (
                            currentSprints.map((sp) => (
                              <span
                                key={sp.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold"
                              >
                                {sp.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-slate-700">
                          {currentSprints.length} Sprints
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProjectTab('sprints');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Open Page & Add +</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Task Search & Filter Controls (The Screenshot Filter Bar) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search tasks, code, or assignee..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Work Type Filter */}
                <select
                  value={taskWorkTypeFilter}
                  onChange={(e) => setTaskWorkTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL">All Work Types</option>
                  {currentWorkTypes.map((wt) => (
                    <option key={wt} value={wt}>
                      {wt}
                    </option>
                  ))}
                </select>

                {/* Module Filter */}
                <select
                  value={taskModuleFilter}
                  onChange={(e) => setTaskModuleFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL">All Modules</option>
                  {currentModules.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Sprint Filter */}
                <select
                  value={taskSprintFilter}
                  onChange={(e) => setTaskSprintFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL">All Sprints</option>
                  {currentSprints.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{filteredProjectTasks.length}</span> of {totalTasks} tasks
              </div>
            </div>

        {/* Tasks Table */}
        {filteredProjectTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Project Tasks Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {taskSearch || taskStatusFilter !== 'ALL' || taskModuleFilter !== 'ALL' || taskSprintFilter !== 'ALL'
                ? 'No tasks match the selected filters. Try clearing your search.'
                : 'Get started by assigning the first task to this project using Master Plan work types.'}
            </p>
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Project Task</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4"># / Code</th>
                  <th className="py-3 px-4">Task Title & Details</th>
                  <th className="py-3 px-4">Work Type / Full Work</th>
                  <th className="py-3 px-4">Module & Sprint</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredProjectTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/60 transition group">
                    {/* Task Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 text-xs whitespace-nowrap">
                      {task.code}
                    </td>

                    {/* Task Title */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <p className="font-bold text-slate-900 text-xs leading-snug">{task.title}</p>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>

                    {/* Work Type (from Master Plan) */}
                    <td className="py-3.5 px-4">
                      {task.workType ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-900 font-bold text-[10px] whitespace-nowrap shadow-2xs">
                          <Target className="w-3 h-3 text-indigo-600" />
                          <span>{task.workType}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Module & Sprint */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        {task.module && (
                          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                            {task.module}
                          </span>
                        )}
                        {task.sprint && (
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Flag className="w-2.5 h-2.5 text-amber-500" />
                            <span className="truncate max-w-[140px]">{task.sprint}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={task.assignee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={task.assignee.name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-[11px] leading-tight">
                              {task.assignee.name}
                            </p>
                            <p className="text-[9px] text-slate-400">{task.assignee.role || 'Member'}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {onUpdateTaskStatus ? (
                        <div className="relative">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              onUpdateTaskStatus(task.id, e.target.value as TaskItem['status'])
                            }
                            className={`py-1 pl-2 pr-5 rounded-lg text-[10px] font-bold border cursor-pointer appearance-none ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {task.dueDate || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTaskToDelete(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS: CREATE / EDIT PROJECT TASKS & ASSIGN TEAM MEMBER                 */}
      {/* ========================================================================= */}

      {/* 1. Create Project Task Modal pre-selected with this Project */}
      {isCreateTaskOpen && (
        <CreateProjectTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          onAddTasks={(newTasks) => {
            if (onAddTasks) {
              onAddTasks(newTasks);
            } else if (onUpdateTask) {
              newTasks.forEach((t) => onUpdateTask(t));
            }
            setIsCreateTaskOpen(false);
          }}
          projects={[project]}
          adminsList={adminsList}
          masterPlans={_masterPlans}
          onCreateMasterPlan={_onCreateMasterPlan}
          onUpdateProject={onUpdateProject}
        />
      )}

      {/* 2. Edit Project Task Modal */}
      {editingTask && (
        <EditProjectTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onUpdateTask={(upd: TaskItem) => {
            if (onUpdateTask) onUpdateTask(upd);
            setEditingTask(null);
          }}
          adminsList={adminsList}
          projects={[project]}
          masterPlans={_masterPlans}
        />
      )}

      {/* 3. Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Project Task?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{taskToDelete.title}"</span> ({taskToDelete.code})?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTask) onDeleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Project Modal */}
      {isEditProjectOpen && (
        <EditProjectModal
          isOpen={isEditProjectOpen}
          onClose={() => setIsEditProjectOpen(false)}
          project={project}
          onUpdateProject={(upd: ProjectItem) => {
            onUpdateProject(upd);
            setIsEditProjectOpen(false);
          }}
          onDeleteProject={(pId: string) => {
            if (onDeleteProject) onDeleteProject(pId);
            setIsEditProjectOpen(false);
            onBack();
          }}
          managersList={adminsList}
          employeesList={adminsList}
        />
      )}

      {/* 5. Assign Team Member Modal */}
      {isAssignTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign Member to {project.name}</h3>
                  <p className="text-xs text-slate-400">Select an employee from your database</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignTeamOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Employee */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee by name or role..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Employee List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {availableEmployeesToAssign.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No additional employees available to assign.
                </p>
              ) : (
                availableEmployeesToAssign.map((emp) => {
                  const isSelected = selectedEmployeeForAssign?.id === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployeeForAssign(emp)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition text-left cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.email || emp.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {emp.role}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignTeamOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedEmployeeForAssign}
                onClick={handleConfirmAssignMember}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
              >
                Assign Member
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDashboardView;
