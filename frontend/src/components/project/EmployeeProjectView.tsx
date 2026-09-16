import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Zap,
  Target,
  Briefcase,
  Plus,
  Search,
  FileText,
} from 'lucide-react';
import { TaskItem, ProjectItem } from '../../types';
import { TaskWorkingUpdatesView } from './TaskWorkingUpdatesView';

interface EmployeeProjectViewProps {
  project: ProjectItem;
  tasks: TaskItem[];
  currentUser?: any;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  onBack: () => void;
  onUpdateTask?: (task: TaskItem) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskItem['status']) => void;
}

export const EmployeeProjectView: React.FC<EmployeeProjectViewProps> = ({
  project,
  tasks,
  currentUser,
  userRole = 'EMPLOYEE',
  onBack,
  onUpdateTask,
  onLogTaskHours,
  onUpdateTaskStatus,
}) => {
  const isEmployee = userRole === 'EMPLOYEE';

  // Navigation: if user clicks a task, show its updates view
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Table filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const employeeName = currentUser?.full_name || '';
  const employeeEmail = currentUser?.email || '';

  // Filter tasks for this employee in this project
  const myProjectTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Match project
      const projectMatch =
        !t.project ||
        t.project.trim().toLowerCase() === project.name.trim().toLowerCase() ||
        t.project.trim().toLowerCase() === project.code?.trim().toLowerCase();

      // Match assignee (only filter by employee if it's employee role)
      const assigneeMatch = isEmployee
        ? (employeeEmail && (t.assignee?.email || '').toLowerCase() === employeeEmail.toLowerCase()) ||
          (employeeName && (t.assignee?.name || '').toLowerCase().includes(employeeName.toLowerCase()))
        : true; // Admin/SuperAdmin see all tasks

      return projectMatch && assigneeMatch;
    });
  }, [tasks, project, isEmployee, employeeName, employeeEmail]);

  // Filtered tasks by search + status
  const filteredTasks = useMemo(() => {
    return myProjectTasks.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.module && t.module.toLowerCase().includes(q)) ||
        (t.sprint && t.sprint.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myProjectTasks, searchQuery, statusFilter]);

  // Metrics
  const completedCount = myProjectTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = myProjectTasks.filter((t) => t.status === 'In Progress').length;
  const totalLoggedHours = myProjectTasks.reduce((s, t) => s + (t.loggedHours || 0), 0);
  const totalEstHours = myProjectTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const progressPercent = totalEstHours > 0 ? Math.min(100, Math.round((totalLoggedHours / totalEstHours) * 100)) : 0;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'In Review': return 'bg-purple-50 text-purple-700 border-purple-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // --- If a task is selected, show the working updates view ---
  if (selectedTask) {
    // Always use fresh task data (in case it was updated)
    const freshTask = tasks.find((t) => t.id === selectedTask.id) || selectedTask;
    return (
      <TaskWorkingUpdatesView
        task={freshTask}
        project={project}
        currentUser={currentUser}
        userRole={userRole}
        onBack={() => setSelectedTask(null)}
        onUpdateTask={onUpdateTask}
        onLogTaskHours={onLogTaskHours}
        onUpdateTaskStatus={onUpdateTaskStatus}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* ================================================================ */}
      {/* BACK NAVIGATION                                                  */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600" />
            Back to My Projects
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>My Projects</span>
            <span>/</span>
            <span className="text-indigo-600 font-bold">{project.name}</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Viewing as: <strong className="text-slate-800">{isEmployee ? currentUser?.full_name : 'Administrator'}</strong>
          {isEmployee && <span className="ml-1.5 text-indigo-600 font-bold">(Employee View)</span>}
        </div>
      </div>

      {/* ================================================================ */}
      {/* PROJECT BANNER                                                   */}
      {/* ================================================================ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{project.name}</h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Client: <strong className="text-white">{project.client}</strong>
                  {project.code && (
                    <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded bg-white/15 text-white">{project.code}</span>
                  )}
                </p>
              </div>
            </div>

            {project.description && (
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{project.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                project.status === 'In Progress' ? 'bg-blue-500/20 border-blue-400/30 text-blue-200' :
                project.status === 'Completed' ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200' :
                'bg-slate-500/20 border-slate-400/30 text-slate-300'
              }`}>
                {project.status}
              </span>
              {project.endDate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-slate-300">
                  <Calendar className="w-3 h-3" />
                  Deadline: {project.endDate}
                </span>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-[480px]">
            <div className="bg-white/8 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-400 font-medium block">My Tasks</span>
              <span className="text-2xl font-black text-white font-mono">{myProjectTasks.length}</span>
            </div>
            <div className="bg-white/8 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-400 font-medium block">Completed</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{completedCount}</span>
            </div>
            <div className="bg-white/8 rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-400 font-medium block">In Progress</span>
              <span className="text-2xl font-black text-blue-400 font-mono">{inProgressCount}</span>
            </div>
            <div className="bg-white/8 rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Hours</span>
                <span className="text-[10px] font-bold text-amber-300">{progressPercent}%</span>
              </div>
              <span className="text-xl font-black text-amber-300 font-mono">{totalLoggedHours}h</span>
              <span className="text-[10px] text-slate-400">/ {totalEstHours}h</span>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TASKS TABLE                                                      */}
      {/* ================================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              {isEmployee ? 'My Assigned Tasks' : 'All Project Tasks'}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {myProjectTasks.length} tasks
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEmployee
                ? 'Tasks assigned to you in this project. Click any task to view details and submit your daily work update.'
                : `All tasks assigned in ${project.name}. Click any task to view the full work log history.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search task, module, sprint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 w-52"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              {['ALL', 'To Do', 'In Progress', 'In Review', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">
              {myProjectTasks.length === 0
                ? isEmployee
                  ? `No tasks assigned to you in ${project.name} yet`
                  : `No tasks created in ${project.name} yet`
                : 'No tasks match the current filter'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {myProjectTasks.length === 0
                ? 'Your Super Admin or Project Manager will assign tasks to this project. Check back soon.'
                : 'Adjust the filter or search query to see matching tasks.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-3 w-12">#</th>
                  <th className="py-3.5 px-3 min-w-[220px]">Task Code & Title</th>
                  <th className="py-3.5 px-3 min-w-[110px]">Work Type</th>
                  <th className="py-3.5 px-3 min-w-[110px]">Module</th>
                  <th className="py-3.5 px-3 min-w-[100px]">Sprint</th>
                  <th className="py-3.5 px-3 min-w-[100px]">Assigned Start</th>
                  <th className="py-3.5 px-3 min-w-[100px]">Due Date</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Est. Hours</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Logged Hours</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Status</th>
                  <th className="py-3.5 px-3 min-w-[80px]">Updates</th>
                  <th className="py-3.5 pl-3 pr-6 text-right min-w-[130px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task, idx) => {
                  const logCount = (task.dailyLogs || []).length;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-indigo-50/30 transition group cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                      title={`Click to view task details and ${isEmployee ? 'submit work updates' : 'view work log'}`}
                    >
                      {/* # */}
                      <td className="py-4 pl-6 pr-3 font-mono font-bold text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Task Code & Title */}
                      <td className="py-4 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {task.code}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getPriorityStyle(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 group-hover:text-indigo-600 transition max-w-xs">
                            {task.title}
                          </p>
                        </div>
                      </td>

                      {/* Work Type */}
                      <td className="py-4 px-3">
                        {task.workType ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                            <Target className="w-2.5 h-2.5" />
                            {task.workType}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Module */}
                      <td className="py-4 px-3">
                        {task.module ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[90px]">{task.module}</span>
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Sprint */}
                      <td className="py-4 px-3">
                        {task.sprint ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Zap className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{task.sprint}</span>
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Assigned Start (READ ONLY) */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1 text-slate-600 text-[11px] font-mono font-semibold">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {task.startDate || '—'}
                        </div>
                      </td>

                      {/* Due Date (READ ONLY) */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1 text-slate-700 text-[11px] font-mono font-bold">
                          <Calendar className="w-3 h-3 text-red-400" />
                          {task.dueDate || '—'}
                        </div>
                      </td>

                      {/* Est. Hours (READ ONLY) */}
                      <td className="py-4 px-3">
                        <span className="font-mono font-bold text-slate-700 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {task.estimatedHours}h
                        </span>
                      </td>

                      {/* Logged Hours (editable via work update) */}
                      <td className="py-4 px-3">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-indigo-700 text-[11px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {task.loggedHours || 0}h
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${task.estimatedHours > 0 ? Math.min(100, Math.round(((task.loggedHours || 0) / task.estimatedHours) * 100)) : 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(task.status)}`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Updates Count */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`font-mono font-extrabold text-sm ${logCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {logCount}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">{logCount === 1 ? 'update' : 'updates'}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 pl-3 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                            isEmployee
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                          }`}
                        >
                          {isEmployee ? (
                            <>
                              <Plus className="w-3 h-3" />
                              Update Work
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              View Log
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-800">{myProjectTasks.length}</strong> tasks
            {isEmployee && <> assigned to <strong className="text-indigo-600">{currentUser?.full_name}</strong></>}
          </span>
          <span className="font-mono text-slate-600 font-semibold">
            {totalLoggedHours}h logged / {totalEstHours}h estimated
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProjectView;
