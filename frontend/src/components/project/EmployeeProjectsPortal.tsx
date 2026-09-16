import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Calendar,
  Layers,
  Search,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { ProjectItem, TaskItem } from '../../types';
import { EmployeeProjectView } from './EmployeeProjectView';

interface EmployeeProjectsPortalProps {
  projects: ProjectItem[];
  tasks: TaskItem[];
  currentUser?: any;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  onUpdateTask?: (task: TaskItem) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskItem['status']) => void;
}

export const EmployeeProjectsPortal: React.FC<EmployeeProjectsPortalProps> = ({
  projects,
  tasks,
  currentUser,
  userRole = 'EMPLOYEE',
  onUpdateTask,
  onLogTaskHours,
  onUpdateTaskStatus,
}) => {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const employeeName = currentUser?.full_name || '';
  const employeeEmail = currentUser?.email || '';

  // Filter to only projects where this employee is assigned
  const myProjects = useMemo(() => {
    return projects.filter((p) => {
      const assigned = p.assignedEmployees || [];
      return assigned.some((emp) =>
        (employeeEmail && (emp.email || '').toLowerCase() === employeeEmail.toLowerCase()) ||
        (employeeName && emp.name.toLowerCase().includes(employeeName.toLowerCase()))
      );
    });
  }, [projects, employeeName, employeeEmail]);

  // Filtered projects by search and status
  const filteredProjects = useMemo(() => {
    return myProjects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myProjects, searchQuery, statusFilter]);

  // Get tasks assigned to this employee for a given project
  const getMyTasksForProject = (project: ProjectItem) => {
    return tasks.filter((t) => {
      const projectMatch =
        !t.project ||
        t.project.trim().toLowerCase() === project.name.trim().toLowerCase() ||
        t.project.trim().toLowerCase() === (project.code || '').trim().toLowerCase();

      const assigneeMatch =
        (employeeEmail && (t.assignee?.email || '').toLowerCase() === employeeEmail.toLowerCase()) ||
        (employeeName && (t.assignee?.name || '').toLowerCase().includes(employeeName.toLowerCase()));

      return projectMatch && assigneeMatch;
    });
  };

  // Aggregate metrics
  const totalMyTasks = useMemo(() => {
    return tasks.filter((t) => {
      const inMyProject = myProjects.some((p) =>
        !t.project || t.project.toLowerCase() === p.name.toLowerCase()
      );
      const isAssigned =
        (employeeEmail && (t.assignee?.email || '').toLowerCase() === employeeEmail.toLowerCase()) ||
        (employeeName && (t.assignee?.name || '').toLowerCase().includes(employeeName.toLowerCase()));
      return inMyProject && isAssigned;
    }).length;
  }, [tasks, myProjects, employeeName, employeeEmail]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'In Progress': return { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'Completed': return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'Pending': return { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
      case 'On Hold': return { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
      default: return { badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  // --- If a project is selected, show the employee project view ---
  if (selectedProject) {
    const freshProject = projects.find((p) => p.id === selectedProject.id) || selectedProject;
    return (
      <EmployeeProjectView
        project={freshProject}
        tasks={tasks}
        currentUser={currentUser}
        userRole={userRole}
        onBack={() => setSelectedProject(null)}
        onUpdateTask={onUpdateTask}
        onLogTaskHours={onLogTaskHours}
        onUpdateTaskStatus={onUpdateTaskStatus}
      />
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-200 pb-16">
      {/* ================================================================ */}
      {/* TOP BANNER                                                       */}
      {/* ================================================================ */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Employee Project Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Projects, {currentUser?.full_name?.split(' ')[0] || 'Team Member'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Below are the projects you've been assigned to. Touch any project to view your assigned tasks,
              track your work hours, and submit daily progress updates.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">My Projects</p>
              <p className="text-xl font-mono font-extrabold text-white mt-0.5">{myProjects.length}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">My Tasks</p>
              <p className="text-xl font-mono font-extrabold text-blue-300 mt-0.5">{totalMyTasks}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-400">Active</p>
              <p className="text-xl font-mono font-extrabold text-emerald-300 mt-0.5">
                {myProjects.filter((p) => p.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEARCH AND FILTERS                                               */}
      {/* ================================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your projects by name, code, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['ALL', 'In Progress', 'Completed', 'Pending', 'On Hold'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/* NO PROJECTS EMPTY STATE                                         */}
      {/* ================================================================ */}
      {myProjects.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
            <FolderOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Projects Assigned Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You haven't been added to any projects yet. Your Super Admin or Project Manager will assign you to
            projects and allocate tasks. Check back shortly.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            Waiting for project assignment
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* PROJECT CARDS                                                    */}
      {/* ================================================================ */}
      {filteredProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Your Assigned Projects
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {filteredProjects.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500">Click any project to view your tasks and submit updates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const myTasks = getMyTasksForProject(project);
              const myCompleted = myTasks.filter((t) => t.status === 'Completed').length;
              const myInProgress = myTasks.filter((t) => t.status === 'In Progress').length;
              const myLoggedHours = myTasks.reduce((s, t) => s + (t.loggedHours || 0), 0);
              const myEstHours = myTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
              const myProgress = myEstHours > 0 ? Math.min(100, Math.round((myLoggedHours / myEstHours) * 100)) : 0;
              const statusStyle = getStatusStyle(project.status);
              const totalUpdates = myTasks.reduce((s, t) => s + (t.dailyLogs?.length || 0), 0);

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all group cursor-pointer flex flex-col justify-between"
                  title={`Click to view your tasks in ${project.name}`}
                >
                  {/* Header */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <Briefcase className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                            {project.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono">{project.code}</p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {project.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Client: <strong className="text-slate-700">{project.client}</strong></p>
                      {project.endDate && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Deadline: <strong className="text-slate-700">{project.endDate}</strong></span>
                        </p>
                      )}
                    </div>

                    {/* Sprints/Modules pills */}
                    {((project.sprints?.length || 0) > 0 || (project.modules?.length || 0) > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.sprints?.slice(0, 2).map((s) => (
                          <span key={s.id} className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <Zap className="w-2.5 h-2.5" />{s.name}
                          </span>
                        ))}
                        {project.modules?.slice(0, 2).map((m) => (
                          <span key={m} className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="w-2.5 h-2.5" />{m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* My Task Summary */}
                    <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">My Tasks</p>
                          <p className="text-base font-black text-slate-900 font-mono">{myTasks.length}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Done</p>
                          <p className="text-base font-black text-emerald-600 font-mono">{myCompleted}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Active</p>
                          <p className="text-base font-black text-blue-600 font-mono">{myInProgress}</p>
                        </div>
                      </div>

                      {/* Hours progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium">My Hours</span>
                          <span className="font-mono font-bold text-slate-800">{myLoggedHours}h / {myEstHours}h — {myProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${myProgress}%` }}
                          />
                        </div>
                      </div>

                      {totalUpdates > 0 && (
                        <p className="text-[10px] text-indigo-600 font-bold text-center">
                          {totalUpdates} work update{totalUpdates !== 1 ? 's' : ''} submitted
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      {myTasks.length === 0 ? (
                        <span className="text-amber-600 font-semibold">No tasks assigned yet</span>
                      ) : (
                        <span>{myTasks.length} task{myTasks.length !== 1 ? 's' : ''} assigned to you</span>
                      )}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-bold text-xs transition border border-indigo-200 group-hover:border-indigo-600">
                      {myTasks.length === 0 ? 'View Project' : 'View My Tasks'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No results from filter */}
      {myProjects.length > 0 && filteredProjects.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <Search className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">No matching projects found</p>
          <p className="text-xs text-slate-500">Adjust your search or status filter to find your projects.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeProjectsPortal;
