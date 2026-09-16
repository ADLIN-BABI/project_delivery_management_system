import React, { useState, useEffect } from 'react';
import { ProjectItem, TaskItem, AdminUserItem, MasterPlanItem } from '../types';
import {
  Plus,
  Globe,
  Calendar,
  FolderKanban,
  Edit2,
  Trash2,
  Search,
  Building,
  ChevronDown,
  Layers,
  Sparkles,
  Clock,
  X,
  Users,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { EditProjectTaskModal } from '../components/modals/EditProjectTaskModal';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { LogHoursModal } from '../components/modals/LogHoursModal';
import { TaskStatusDetailModal } from '../components/modals/TaskStatusDetailModal';
import { User as UserType } from '../types';

interface ProjectTasksPageProps {
  projects: ProjectItem[];
  tasks: TaskItem[];
  currentUser?: UserType | null;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  onOpenCreateProjectTask: () => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateProject?: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
  onUpdateTaskStatus?: (taskId: string, newStatus: TaskItem['status']) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
  onSendNotification?: (notif: any) => void;
  adminsList?: AdminUserItem[];
  initialProjectId?: string;
  masterPlans?: MasterPlanItem[];
}

export const ProjectTasksPage: React.FC<ProjectTasksPageProps> = ({
  projects,
  tasks,
  currentUser,
  userRole = 'ADMIN',
  onOpenCreateProjectTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateProject,
  onDeleteProject,
  onUpdateTaskStatus,
  onLogTaskHours,
  onSendNotification,
  adminsList = [],
  initialProjectId = 'ALL',
  masterPlans = [],
}) => {
  const isEmployee = userRole === 'EMPLOYEE';

  // Filter projects available to the user
  // If employee: only show projects they are involved in (assigned to project or has assigned task)
  const availableProjects = React.useMemo(() => {
    if (!isEmployee || !currentUser) return projects;

    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userName = (currentUser.full_name || '').toLowerCase().trim();

    return projects.filter((project) => {
      // Check if employee is in project.assignedEmployees
      const isAssignedToProject = (project.assignedEmployees || []).some((emp) => {
        const empEmail = (emp.email || '').toLowerCase().trim();
        const empName = (emp.name || '').toLowerCase().trim();
        return (userEmail && empEmail === userEmail) || (userName && empName === userName);
      });

      if (isAssignedToProject) return true;

      // Check if employee has any task under this project
      const hasTaskInProject = tasks.some((t) => {
        const isThisProject =
          (t.project && (
            t.project.trim().toLowerCase() === project.name.trim().toLowerCase() ||
            t.project.trim().toLowerCase() === project.code.trim().toLowerCase() ||
            t.project.trim().toLowerCase().includes(project.name.trim().toLowerCase()) ||
            project.name.trim().toLowerCase().includes(t.project.trim().toLowerCase())
          )) ||
          (!t.project && project.id === projects[0]?.id);

        if (!isThisProject) return false;

        const taskAssigneeEmail = (t.assignee?.email || '').toLowerCase().trim();
        const taskAssigneeName = (t.assignee?.name || '').toLowerCase().trim();
        return (userEmail && taskAssigneeEmail === userEmail) || (userName && taskAssigneeName === userName);
      });

      return hasTaskInProject;
    });
  }, [projects, tasks, isEmployee, currentUser]);

  // 'ALL' for All Projects or specific project.id
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'ALL');

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [groupByMode, setGroupByMode] = useState<'module' | 'employee'>('employee');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string | null>(null);
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string | null>(null);
  const [taskToUpdateStatus, setTaskToUpdateStatus] = useState<TaskItem | null>(null);
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<TaskItem | null>(null);

  // Selected single project if not 'ALL'
  const currentSingleProject =
    selectedProjectId !== 'ALL'
      ? availableProjects.find((p) => p.id === selectedProjectId)
      : null;

  // Filter projects to display
  const displayedProjects =
    selectedProjectId === 'ALL'
      ? availableProjects
      : availableProjects.filter((p) => p.id === selectedProjectId);

  // Helper to check if task is assigned to current user
  const checkIsMyTask = (task: TaskItem) => {
    if (!currentUser) return false;
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userName = (currentUser.full_name || '').toLowerCase().trim();
    const taskAssigneeEmail = (task.assignee?.email || '').toLowerCase().trim();
    const taskAssigneeName = (task.assignee?.name || '').toLowerCase().trim();

    return (
      (userEmail && taskAssigneeEmail === userEmail) ||
      (userName && taskAssigneeName === userName)
    );
  };

  // When clicking on an employee name:
  // If clicking on my own name as employee: directly open the Working Status update modal for my task!
  // If clicking on another employee: open the read-only live updates table for that employee.
  const handleEmployeeClick = (empName: string, empEmail?: string | null, specificTask?: TaskItem | null) => {
    if (currentUser) {
      const userEmail = (currentUser.email || '').toLowerCase().trim();
      const userName = (currentUser.full_name || '').toLowerCase().trim();
      const targetEmail = (empEmail || '').toLowerCase().trim();
      const targetName = (empName || '').toLowerCase().trim();

      const isCurrentUser = (userEmail && targetEmail === userEmail) || (userName && targetName === userName);

      if (isCurrentUser) {
        if (specificTask) {
          setTaskToUpdateStatus(specificTask);
          return;
        }
        // Find user's task under current viewing context
        const myTask = tasks.find((t) => {
          const isMine = checkIsMyTask(t);
          if (!isMine) return false;
          if (selectedProjectId !== 'ALL') {
            return currentSingleProject && (
              (t.project && (
                t.project.trim().toLowerCase() === currentSingleProject.name.trim().toLowerCase() ||
                t.project.trim().toLowerCase() === currentSingleProject.code.trim().toLowerCase() ||
                t.project.trim().toLowerCase().includes(currentSingleProject.name.trim().toLowerCase()) ||
                currentSingleProject.name.trim().toLowerCase().includes(t.project.trim().toLowerCase())
              ))
            );
          }
          return true;
        });

        if (myTask) {
          setTaskToUpdateStatus(myTask);
          return;
        }
      }
    }

    // Default: open the Employee Work Updates view table
    setSelectedEmployeeName(empName);
    setSelectedEmployeeEmail(empEmail || null);
  };

  const getPriorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (s: TaskItem['status']) => {
    switch (s) {
      case 'In Progress':
        return 'bg-blue-600 text-white';
      case 'In Review':
        return 'bg-purple-600 text-white';
      case 'Completed':
        return 'bg-emerald-600 text-white';
      case 'To Do':
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-blue-600" />
            {isEmployee ? 'My Assigned Project Tasks' : 'Project Tasks & Multi-Tier Work Breakdown'}
          </h2>
          <p className="text-sm text-slate-500">
            {isEmployee
              ? 'View tasks and collaborate on projects you are involved in. Click your name to update your status or log time.'
              : 'Select a project from the dropdown to view related actions or choose "All Projects"'}
          </p>
        </div>

        {!isEmployee && (
          <button
            onClick={onOpenCreateProjectTask}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            Assign Tasks to Sprint
          </button>
        )}
      </div>

      {/* Modern Dropdown & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Project Select Dropdown */}
          <div className="md:col-span-6 lg:col-span-5 space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Select Project View
            </label>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition cursor-pointer appearance-none shadow-2xs"
              >
                <option value="ALL" className="font-bold text-blue-700">
                  {isEmployee
                    ? `🌟 All My Assigned Projects (${availableProjects.length} Projects)`
                    : `🌟 All Projects (${availableProjects.length} Total Projects)`}
                </option>
                {availableProjects.map((p) => {
                  const taskCount = tasks.filter((t) =>
                    t.project && (
                      t.project.trim().toLowerCase() === p.name.trim().toLowerCase() ||
                      t.project.trim().toLowerCase() === p.code.trim().toLowerCase() ||
                      t.project.trim().toLowerCase().includes(p.name.trim().toLowerCase()) ||
                      p.name.trim().toLowerCase().includes(t.project.trim().toLowerCase())
                    )
                  ).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Across Tasks */}
          <div className="md:col-span-6 lg:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Search Tasks & Assignees
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search task, module, sprint, assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition shadow-2xs"
              />
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="md:col-span-12 lg:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Task Status
            </label>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {['ALL', 'To Do', 'In Progress', 'In Review', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Selection Indicator Pill & View Mode Switch */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Currently Viewing:</span>
            {selectedProjectId === 'ALL' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                <Sparkles className="w-3 h-3" />
                {isEmployee ? `All My Projects (${availableProjects.length})` : `All Projects Combined (${availableProjects.length})`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                <span className="font-mono text-emerald-700">{currentSingleProject?.code}</span>
                <span>{currentSingleProject?.name}</span>
              </span>
            )}
            <span className="text-[11px] font-medium text-slate-400">
              ({displayedProjects.length} project{displayedProjects.length !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Group View Toggle: By Employee vs By Module */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setGroupByMode('employee')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                groupByMode === 'employee'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Employee Vertical Tables
            </button>
            <button
              type="button"
              onClick={() => setGroupByMode('module')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                groupByMode === 'module'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Module Slices
            </button>
          </div>
        </div>
      </div>

      {/* RENDER PROJECTS & ASSIGNED TASKS */}
      <div className="space-y-8">
        {displayedProjects.map((project) => {
          // Tasks belonging to this specific project matching filters
          const projectTasks = tasks.filter((t) => {
            const isThisProject =
              (t.project && (
                t.project.trim().toLowerCase() === project.name.trim().toLowerCase() ||
                t.project.trim().toLowerCase() === project.code.trim().toLowerCase() ||
                t.project.trim().toLowerCase().includes(project.name.trim().toLowerCase()) ||
                project.name.trim().toLowerCase().includes(t.project.trim().toLowerCase())
              )) ||
              (!t.project && project.id === projects[0]?.id);
            if (!isThisProject) return false;

            const matchesSearch =
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ((t.assignee.email || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
              (t.module && t.module.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (t.sprint && t.sprint.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

            return matchesSearch && matchesStatus;
          });

          // Unique modules with actual assigned tasks under this project
          const assignedModules = Array.from(
            new Set(projectTasks.map((t) => t.module || 'Core Module'))
          );

          // Unique assigned employees (identified by email, falling back to name)
          const uniqueEmployeesMap = new Map<string, { name: string; email: string; avatar: string; role: string }>();
          projectTasks.forEach((t) => {
            const emailKey = (t.assignee.email || t.assignee.name).toLowerCase();
            if (!uniqueEmployeesMap.has(emailKey)) {
              // Try to find matching user in adminsList for full details
              const dbUser = adminsList.find(
                (u) =>
                  (t.assignee.email && u.email.toLowerCase() === t.assignee.email.toLowerCase()) ||
                  u.name.toLowerCase() === t.assignee.name.toLowerCase()
              );
              uniqueEmployeesMap.set(emailKey, {
                name: t.assignee.name,
                email: t.assignee.email || dbUser?.email || '',
                avatar: t.assignee.avatar || dbUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                role: t.assignee.role || dbUser?.role || 'Team Member',
              });
            }
          });
          const uniqueAssignedEmployees = Array.from(uniqueEmployeesMap.values());

          const projectAssignedTeam = project.assignedEmployees || [];

          return (
            <section
              key={project.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8 transition hover:border-slate-300"
            >
              {/* Project Header Banner with Related Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {project.code}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {project.name}
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {project.priority} Priority
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Client: <strong className="text-slate-800">{project.client}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Manager: <strong className="text-slate-800">{project.manager.name}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      {project.platform || 'Web Application'}
                    </span>
                  </div>

                  {/* Assigned Team Members Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      Team ({projectAssignedTeam.length}):
                    </span>
                    {projectAssignedTeam.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {projectAssignedTeam.map((emp) => (
                          <button
                            type="button"
                            key={emp.id}
                            onClick={() => handleEmployeeClick(emp.name, emp.email)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-bold text-indigo-700 transition"
                            title={`Click to view ${emp.name}'s task updates & live status`}
                          >
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span>{emp.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        No employees assigned yet (click Edit Project to assign)
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Progress, Target Deadline & Related Actions */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-[140px]">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Progress</span>
                      <span className="text-blue-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Target Deadline
                    </span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {project.endDate}
                    </span>
                  </div>

                  {!isEmployee && (
                    <>
                      <button
                        onClick={onOpenCreateProjectTask}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        + Assign Tasks
                      </button>

                      <button
                        onClick={() => setEditingProject(project)}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition"
                        title="Edit Project Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Project
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tasks List for this Project */}
              {projectTasks.length > 0 ? (
                groupByMode === 'employee' ? (
                  /* ========================================================================= */
                  /* EMPLOYEE VERTICAL TABLE VIEW (ONE DEDICATED VERTICAL TABLE PER EMPLOYEE)  */
                  /* ========================================================================= */
                  <div className="space-y-6">
                    {uniqueAssignedEmployees.map((emp) => {
                      const empSpecificTasks = projectTasks.filter(
                        (t) =>
                          (emp.email && (t.assignee.email || '').toLowerCase() === emp.email.toLowerCase()) ||
                          t.assignee.name.toLowerCase() === emp.name.toLowerCase()
                      );

                      if (empSpecificTasks.length === 0) return null;

                      const completedTasks = empSpecificTasks.filter((t) => t.status === 'Completed').length;
                      const inProgressTasks = empSpecificTasks.filter((t) => t.status === 'In Progress').length;
                      const totalLoggedHours = empSpecificTasks.reduce((s, t) => s + (t.loggedHours || 0), 0);
                      const totalEstimatedHours = empSpecificTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

                      return (
                        <div
                          key={emp.email || emp.name}
                          className="rounded-2xl p-5 bg-white border border-indigo-100 shadow-sm space-y-4 overflow-hidden"
                        >
                          {/* Employee Banner Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                            <button
                              type="button"
                              onClick={() => handleEmployeeClick(emp.name, emp.email)}
                              className="flex items-center gap-3 text-left group/head hover:opacity-90 transition cursor-pointer"
                              title={`Click to ${currentUser && (currentUser.full_name?.toLowerCase() === emp.name.toLowerCase() || currentUser.email?.toLowerCase() === (emp.email || '').toLowerCase()) ? 'update your working status' : `view ${emp.name}'s task updates`}`}
                            >
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-10 h-10 rounded-2xl object-cover border-2 border-indigo-300 shadow-xs group-hover/head:border-indigo-500 transition"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900 group-hover/head:text-indigo-700 transition flex items-center gap-1.5">
                                    <span>{emp.name}</span>
                                    {currentUser && (currentUser.full_name?.toLowerCase() === emp.name.toLowerCase() || currentUser.email?.toLowerCase() === (emp.email || '').toLowerCase()) && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        You
                                      </span>
                                    )}
                                  </h4>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {emp.role}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                  {emp.email && (
                                    <span className="flex items-center gap-1 font-mono text-slate-600">
                                      <Mail className="w-3 h-3 text-slate-400" />
                                      {emp.email}
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span className="font-semibold text-indigo-700">
                                    {empSpecificTasks.length} assigned task{empSpecificTasks.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </button>

                            {/* Live Work Status Metrics & View Updates Button */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <span className="text-amber-600 font-bold">{inProgressTasks} In Progress</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-emerald-600 font-bold">{completedTasks} Done</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-indigo-600 font-bold">{totalLoggedHours}/{totalEstimatedHours}h</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEmployeeClick(emp.name, emp.email)}
                                className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition"
                              >
                                View Live Updates
                              </button>
                            </div>
                          </div>

                          {/* Employee Specific Vertical Tasks Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                  <th className="py-2.5 px-3">Task ID</th>
                                  <th className="py-2.5 px-3">Work Type (Tier 1)</th>
                                  <th className="py-2.5 px-3">Module (Tier 2)</th>
                                  <th className="py-2.5 px-3">Sprint / Strip (Tier 3)</th>
                                  <th className="py-2.5 px-3">Due / Role Deadline</th>
                                  <th className="py-2.5 px-3 text-center">Hours</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                  <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {empSpecificTasks.map((task) => (
                                  <tr key={task.id} className="hover:bg-slate-50/70 transition group">
                                    {/* Task ID */}
                                    <td className="py-3 px-3">
                                      <span className="font-mono text-[11px] font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                                        {task.code}
                                      </span>
                                    </td>

                                    {/* Work Type */}
                                    <td className="py-3 px-3">
                                      {task.workType ? (
                                        <div className="flex items-center gap-1.5">
                                          <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                          <span className="font-bold text-slate-800 text-[12px]">
                                            {task.workType}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-400 font-medium">—</span>
                                      )}
                                      <span
                                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border inline-block mt-0.5 ${getPriorityBadge(
                                          task.priority
                                        )}`}
                                      >
                                        {task.priority} Priority
                                      </span>
                                    </td>

                                    {/* Module */}
                                    <td className="py-3 px-3 font-semibold text-slate-800">
                                      {task.module ? (
                                        <span>{task.module}</span>
                                      ) : (
                                        <span className="text-xs text-slate-400 font-medium">—</span>
                                      )}
                                    </td>

                                    {/* Sprint / Strip */}
                                    <td className="py-3 px-3">
                                      {task.sprint ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 inline-block">
                                          {task.sprint}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-slate-400 font-medium">—</span>
                                      )}
                                    </td>

                                    {/* Deadlines */}
                                    <td className="py-3 px-3 space-y-0.5">
                                      <div className="flex items-center gap-1 text-[11px] text-slate-700 font-semibold">
                                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>{task.dueDate}</span>
                                      </div>
                                      {task.developerDeadline && (
                                        <p className="text-[10px] text-purple-700 font-medium">
                                          Dev: {task.developerDeadline.split('T')[0]}
                                        </p>
                                      )}
                                    </td>

                                    {/* Hours */}
                                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                                      <span className="font-bold text-slate-800">{task.loggedHours || 0}</span>
                                      <span className="text-slate-400"> / {task.estimatedHours || 0}h</span>
                                    </td>

                                    {/* Status */}
                                    <td className="py-3 px-3 text-center">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusBadge(
                                          task.status
                                        )}`}
                                      >
                                        {task.status}
                                      </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-3 text-right">
                                      {isEmployee ? (
                                        checkIsMyTask(task) ? (
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => setTaskToUpdateStatus(task)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition shadow-2xs"
                                              title="Update my working status"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                              Update Status
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setSelectedTaskForLog(task)}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition"
                                              title="Log work hours spent today"
                                            >
                                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                                              Log Time
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] font-medium text-slate-400 italic">
                                            View Only
                                          </span>
                                        )
                                      ) : (
                                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={() => setTaskToUpdateStatus(task)}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Update Status, Daily Logs & Notifications"
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => setEditingTask(task)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Edit Task"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => setTaskToDelete(task)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Delete Task"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ========================================================================= */
                  /* MODULE SLICES VIEW (TRADITIONAL GROUP BY MODULE)                           */
                  /* ========================================================================= */
                  <div className="space-y-6">
                    {assignedModules.map((modName, modIdx) => {
                      const tasksInModule = projectTasks.filter(
                        (t) => (t.module || 'Core Module').toLowerCase() === modName.toLowerCase()
                      );

                      if (tasksInModule.length === 0) return null;

                      return (
                        <div
                          key={modName}
                          className="rounded-2xl p-5 bg-slate-50/60 border border-slate-200/80 space-y-4 overflow-hidden"
                        >
                          {/* Module Sub-Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                M{modIdx + 1}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                  <span>{modName}</span>
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {tasksInModule.length} assigned task{tasksInModule.length !== 1 ? 's' : ''}
                                  </span>
                                </h4>
                              </div>
                            </div>

                            <div className="text-xs text-slate-500 font-mono">
                              Sprint Slices: {Array.from(new Set(tasksInModule.map((t) => t.sprint || 'Sprint 1'))).join(', ')}
                            </div>
                          </div>

                          {/* Tasks Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                  <th className="py-3 px-3">Task ID</th>
                                  <th className="py-3 px-3">Task Detail</th>
                                  <th className="py-3 px-3">Assignee</th>
                                  <th className="py-3 px-3">Deadlines</th>
                                  <th className="py-3 px-3 text-center">Sprint & Type</th>
                                  <th className="py-3 px-3 text-center">Status</th>
                                  <th className="py-3 px-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {tasksInModule.map((task) => (
                                  <tr key={task.id} className="hover:bg-white transition group">
                                    {/* Task ID */}
                                    <td className="py-3.5 px-3">
                                      <span className="font-mono text-[11px] font-bold text-blue-700 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                                        {task.code}
                                      </span>
                                    </td>

                                    {/* Task Detail */}
                                    <td className="py-3.5 px-3 min-w-[200px]">
                                      <p className="font-bold text-slate-900 text-[13px] leading-tight mb-1">
                                        {task.title}
                                      </p>
                                      <span
                                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border inline-block ${getPriorityBadge(
                                          task.priority
                                        )}`}
                                      >
                                        {task.priority} Priority
                                      </span>
                                    </td>

                                    {/* Assignee - Clickable to show employee updates */}
                                    <td className="py-3.5 px-3">
                                      <button
                                        type="button"
                                        onClick={() => handleEmployeeClick(task.assignee.name, task.assignee.email, task)}
                                        className="flex items-center gap-2 p-1 rounded-xl hover:bg-indigo-50 transition text-left group/emp"
                                        title="Click to view employee profile & work updates"
                                      >
                                        <img
                                          src={task.assignee.avatar}
                                          alt={task.assignee.name}
                                          className="w-7 h-7 rounded-full object-cover border border-slate-200 group-hover/emp:border-indigo-400 group-hover/emp:scale-105 transition"
                                        />
                                        <div>
                                          <p className="font-bold text-slate-800 text-[11px] group-hover/emp:text-indigo-700 underline decoration-indigo-200 underline-offset-2 transition flex items-center gap-1">
                                            {task.assignee.name}
                                          </p>
                                          <p className="text-[9px] text-slate-500 font-mono">
                                            {task.assignee.email || task.assignee.role}
                                          </p>
                                        </div>
                                      </button>
                                    </td>

                                    {/* Deadlines */}
                                    <td className="py-3.5 px-3 space-y-1">
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>Due: {task.dueDate}</span>
                                      </div>
                                      {task.developerDeadline && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-700">
                                          <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                                          <span>Est: {task.developerDeadline.split('T')[0]}</span>
                                        </div>
                                      )}
                                    </td>

                                    {/* Sprint & Type */}
                                    <td className="py-3.5 px-3 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        {task.sprint && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                                            {task.sprint}
                                          </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600 text-[9px] whitespace-nowrap">
                                          Type: {task.workType}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Status */}
                                    <td className="py-3.5 px-3 text-center">
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusBadge(
                                          task.status
                                        )}`}
                                      >
                                        {task.status}
                                      </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3.5 px-3 text-right">
                                      {isEmployee ? (
                                        checkIsMyTask(task) ? (
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => setTaskToUpdateStatus(task)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition shadow-2xs"
                                              title="Update my working status"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                              Update Status
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setSelectedTaskForLog(task)}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition"
                                              title="Log work hours spent today"
                                            >
                                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                                              Log Time
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[10px] font-medium text-slate-400 italic">
                                            View Only
                                          </span>
                                        )
                                      ) : (
                                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            type="button"
                                            onClick={() => setTaskToUpdateStatus(task)}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                            title="Update Status, Daily Logs & Notifications"
                                          >
                                            <CheckCircle2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => setEditingTask(task)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Edit Task"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => setTaskToDelete(task)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Delete Task"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-200/50">
                  <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">No Tasks Assigned Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    This project has no tasks matching your filters. Allocate tasks to assigned employees to kick off sprints.
                  </p>
                  <button
                    onClick={onOpenCreateProjectTask}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    + Assign Tasks to {project.name}
                  </button>
                </div>
              )}
            </section>
          );
        })}

        {displayedProjects.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900">No Projects Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
              There are no active projects matching the current dropdown selection.
            </p>
          </div>
        )}
      </div>


      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Task</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete task <strong className="text-slate-800">{taskToDelete.code}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Employee Work Updates Modal */}
      {(selectedEmployeeName || selectedEmployeeEmail) && (() => {
        const empTasks = tasks.filter((t) => {
          if (selectedEmployeeEmail && t.assignee.email) {
            return t.assignee.email.toLowerCase() === selectedEmployeeEmail.toLowerCase();
          }
          return (
            selectedEmployeeName &&
            t.assignee.name.toLowerCase() === selectedEmployeeName.toLowerCase()
          );
        });

        const empAdmin = adminsList.find((a) => {
          if (selectedEmployeeEmail && a.email) {
            return a.email.toLowerCase() === selectedEmployeeEmail.toLowerCase();
          }
          return (
            selectedEmployeeName &&
            a.name.toLowerCase() === selectedEmployeeName.toLowerCase()
          );
        });

        const completedCount = empTasks.filter((t) => t.status === 'Completed').length;
        const inProgressCount = empTasks.filter((t) => t.status === 'In Progress').length;
        const totalLogged = empTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
        const totalEst = empTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        const displayName = empAdmin?.name || selectedEmployeeName || empTasks[0]?.assignee?.name || 'Assigned Employee';
        const displayEmail = empAdmin?.email || selectedEmployeeEmail || empTasks[0]?.assignee?.email || '';
        const avatar = empAdmin?.avatar || empTasks[0]?.assignee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
        const role = empAdmin?.role || empTasks[0]?.assignee?.role || 'Employee';

        const handleCloseModal = () => {
          setSelectedEmployeeName(null);
          setSelectedEmployeeEmail(null);
        };

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
                <button
                  onClick={handleCloseModal}
                  className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-lg"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-white">{displayName}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                        {role}
                      </span>
                    </div>
                    {displayEmail && (
                      <p className="text-xs text-indigo-200 font-mono mt-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-300" />
                        {displayEmail}
                      </p>
                    )}
                    {empAdmin?.phone && <p className="text-xs text-slate-400">{empAdmin.phone}</p>}
                  </div>
                </div>

                {/* Quick Stats Banner */}
                <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/10">
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Tasks</p>
                    <p className="text-lg font-bold text-white mt-0.5">{empTasks.length}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-amber-400 uppercase font-semibold">In Progress</p>
                    <p className="text-lg font-bold text-amber-300 mt-0.5">{inProgressCount}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-emerald-400 uppercase font-semibold">Completed</p>
                    <p className="text-lg font-bold text-emerald-300 mt-0.5">{completedCount}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-purple-400 uppercase font-semibold">Hours Logged</p>
                    <p className="text-lg font-bold text-purple-300 mt-0.5">{totalLogged} / {totalEst}h</p>
                  </div>
                </div>
              </div>

              {/* Task Updates in Clean Vertical Table Format */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Assigned Tasks Table for {displayName}</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {empTasks.length} task{empTasks.length === 1 ? '' : 's'} assigned to {displayEmail || displayName}
                  </span>
                </div>

                {empTasks.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">
                      No tasks currently assigned to {displayName} ({displayEmail || 'No email registered'}).
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-3.5">Task ID</th>
                          <th className="py-3 px-3.5">Project</th>
                          <th className="py-3 px-3.5">Work Type (Tier 1)</th>
                          <th className="py-3 px-3.5">Module (Tier 2)</th>
                          <th className="py-3 px-3.5">Sprint (Tier 3)</th>
                          <th className="py-3 px-3.5">Deadlines</th>
                          <th className="py-3 px-3.5 text-center">Hours</th>
                          <th className="py-3 px-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {empTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-3.5">
                              <span className="font-mono text-[11px] font-bold text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                                {t.code}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 font-bold text-slate-900">
                              {t.project || 'Project'}
                            </td>
                            <td className="py-3 px-3.5 font-semibold text-purple-700">
                              {t.workType || 'Standard'}
                            </td>
                            <td className="py-3 px-3.5 text-slate-700">
                              {t.module || 'General'}
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                                {t.sprint || 'Sprint 1'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 space-y-0.5">
                              <div className="flex items-center gap-1 text-[11px] text-slate-700 font-semibold">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{t.dueDate}</span>
                              </div>
                              {t.developerDeadline && (
                                <p className="text-[10px] text-purple-700">
                                  Role: {t.developerDeadline.split('T')[0]}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-center font-mono text-[11px]">
                              <span className="font-bold text-slate-800">{t.loggedHours || 0}</span>
                              <span className="text-slate-400"> / {t.estimatedHours || 0}h</span>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${getStatusBadge(t.status)}`}>
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

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                >
                  Close Table View
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Project Modal */}
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

      {/* Comprehensive Working Status, Daily Logs Table & Task Notifications Modal */}
      {taskToUpdateStatus && (
        <TaskStatusDetailModal
          isOpen={!!taskToUpdateStatus}
          onClose={() => setTaskToUpdateStatus(null)}
          task={taskToUpdateStatus}
          currentUser={currentUser}
          userRole={userRole}
          onUpdateTask={(updatedTask) => {
            onUpdateTask(updatedTask);
            setTaskToUpdateStatus(updatedTask);
          }}
          onSendNotification={onSendNotification}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onLogTaskHours={onLogTaskHours}
        />
      )}

      {/* Log Hours Modal */}
      {selectedTaskForLog && (
        <LogHoursModal
          isOpen={!!selectedTaskForLog}
          onClose={() => setSelectedTaskForLog(null)}
          task={selectedTaskForLog}
          onLogHours={(tId, hrs, note) => {
            if (onLogTaskHours) {
              onLogTaskHours(tId, hrs, note);
            } else {
              const updated = {
                ...selectedTaskForLog,
                loggedHours: (selectedTaskForLog.loggedHours || 0) + hrs,
              };
              onUpdateTask(updated);
            }
            setSelectedTaskForLog(null);
          }}
        />
      )}

      {/* Edit Project Task Modal */}
      {editingTask && (
        <EditProjectTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          onUpdateTask={(updated) => {
            onUpdateTask(updated);
            setEditingTask(null);
          }}
          adminsList={adminsList}
          projects={projects}
          masterPlans={masterPlans}
          onUpdateProject={onUpdateProject}
        />
      )}
    </div>
  );
};

export default ProjectTasksPage;
