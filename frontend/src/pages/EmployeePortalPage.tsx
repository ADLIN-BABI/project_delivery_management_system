import React, { useState } from 'react';
import { TaskItem, ProjectItem } from '../types';
import {
  CheckSquare,
  Clock,
  Layers,
  Folder,
  Hourglass,
  ArrowRight,
  Briefcase,
  Star,
  Zap,
  FolderOpen,
} from 'lucide-react';
import { LogHoursModal } from '../components/modals/LogHoursModal';
import { RequestExtensionModal } from '../components/modals/RequestExtensionModal';
import { User as UserType } from '../types';

interface EmployeePortalPageProps {
  tasks: TaskItem[];
  projects: ProjectItem[];
  currentUser: UserType | null;
  onUpdateTaskStatus?: (taskId: string, newStatus: TaskItem['status']) => void;
  onLogTaskHours: (taskId: string, hours: number, note: string) => void;
  onRequestExtension: (taskId: string, extraDays: number, reason: string) => void;
  onNavigateToProjects?: () => void;
}

export const EmployeePortalPage: React.FC<EmployeePortalPageProps> = ({
  tasks,
  projects,
  currentUser,
  onLogTaskHours,
  onRequestExtension,
  onNavigateToProjects,
}) => {
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<TaskItem | null>(null);
  const [selectedTaskForExt, setSelectedTaskForExt] = useState<TaskItem | null>(null);

  const employeeName = currentUser?.full_name || 'Team Member';
  const employeeEmail = currentUser?.email || '';

  // Projects assigned to this employee
  const myProjects = projects.filter((p) => {
    const assigned = p.assignedEmployees || [];
    return assigned.some((emp) =>
      (employeeEmail && (emp.email || '').toLowerCase() === employeeEmail.toLowerCase()) ||
      (employeeName && emp.name.toLowerCase().includes(employeeName.toLowerCase()))
    );
  });

  // Tasks assigned to this employee
  const myTasks = tasks.filter((t) =>
    (employeeEmail && (t.assignee?.email || '').toLowerCase() === employeeEmail.toLowerCase()) ||
    (employeeName && (t.assignee?.name || '').toLowerCase().includes(employeeName.toLowerCase()))
  );

  const projectTasks = myTasks.filter((t) => t.project);
  const completedCount = myTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = myTasks.filter((t) => t.status === 'In Progress').length;
  const totalLogged = myTasks.reduce((s, t) => s + (t.loggedHours || 0), 0);
  const totalEstimated = myTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

  const getStatusBadge = (s: TaskItem['status']) => {
    switch (s) {
      case 'In Progress': return 'bg-blue-600 text-white';
      case 'In Review': return 'bg-purple-600 text-white';
      case 'Completed': return 'bg-emerald-600 text-white';
      default: return 'bg-slate-200 text-slate-800';
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ================================================================ */}
      {/* TOP BANNER                                                       */}
      {/* ================================================================ */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-indigo-950 rounded-3xl p-6 sm:p-8 border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Employee Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting()}, {employeeName.split(' ')[0]}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              You're assigned to <strong className="text-white">{myProjects.length} project{myProjects.length !== 1 ? 's' : ''}</strong> with{' '}
              <strong className="text-white">{myTasks.length} tasks</strong>. Open your projects to submit daily work updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-300">Logged Hours</p>
              <p className="text-xl font-mono font-extrabold text-blue-300 mt-0.5">{totalLogged}h</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[90px]">
              <p className="text-[10px] uppercase font-bold text-slate-300">Completed</p>
              <p className="text-xl font-mono font-extrabold text-emerald-300 mt-0.5">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* METRICS                                                          */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Projects', value: myProjects.length, icon: Briefcase, color: 'blue' },
          { label: 'Project Tasks', value: projectTasks.length, icon: Layers, color: 'indigo' },
          { label: 'In Progress', value: inProgressCount, icon: Hourglass, color: 'orange' },
          { label: 'Time Logged', value: `${totalLogged}/${totalEstimated}h`, icon: Clock, color: 'emerald' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-50 text-${color}-600`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">{label}</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* PRIMARY CTA: GO TO MY PROJECTS                                   */}
      {/* ================================================================ */}
      <div
        onClick={onNavigateToProjects}
        className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-700/20 cursor-pointer hover:shadow-xl hover:shadow-indigo-700/30 transition-all group"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20">
              <Zap className="w-3.5 h-3.5" />
              Quick Access
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Open My Projects
            </h3>
            <p className="text-sm text-indigo-100 max-w-lg leading-relaxed">
              View your assigned projects, browse your task list, and <strong className="text-white">submit daily work updates</strong> with
              start time, end time, and progress notes. Admins can see your full history.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-20 h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderOpen className="w-10 h-10 text-white" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 font-extrabold text-xs shadow-sm group-hover:shadow-md transition">
              View Projects
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Mini project list preview */}
        {myProjects.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap gap-2">
            {myProjects.slice(0, 4).map((p) => (
              <div key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white">
                <Briefcase className="w-3 h-3 text-indigo-200" />
                {p.name}
              </div>
            ))}
            {myProjects.length > 4 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white/70">
                +{myProjects.length - 4} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* RECENT TASKS QUICK VIEW                                          */}
      {/* ================================================================ */}
      {myTasks.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Recent Active Tasks
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Your latest in-progress tasks — click "Open My Projects" to manage updates</p>
            </div>
            {onNavigateToProjects && (
              <button
                onClick={onNavigateToProjects}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                See all tasks
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {myTasks
              .filter((t) => t.status !== 'Completed')
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                      {task.project ? (
                        <Folder className="w-4 h-4 text-blue-600" />
                      ) : (
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-extrabold text-slate-500">{task.code}</span>
                        {task.project && (
                          <span className="text-[10px] font-bold text-blue-600">• {task.project}</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-xs truncate mt-0.5">{task.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Due: {task.dueDate} • {task.loggedHours}h/{task.estimatedHours}h logged
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                    <button
                      onClick={() => onNavigateToProjects?.()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold hover:bg-indigo-100 transition cursor-pointer border border-indigo-200"
                    >
                      Update Work
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {myTasks.filter((t) => t.status !== 'Completed').length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              🎉 All tasks completed! Great work.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <LogHoursModal
        isOpen={!!selectedTaskForLog}
        onClose={() => setSelectedTaskForLog(null)}
        task={selectedTaskForLog}
        onLogHours={onLogTaskHours}
      />
      <RequestExtensionModal
        isOpen={!!selectedTaskForExt}
        onClose={() => setSelectedTaskForExt(null)}
        task={selectedTaskForExt}
        onRequestExtension={onRequestExtension}
      />
    </div>
  );
};

export default EmployeePortalPage;
