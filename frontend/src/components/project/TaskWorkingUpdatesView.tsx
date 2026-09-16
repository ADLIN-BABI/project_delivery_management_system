import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  Send,
  CheckSquare,
  Eye,
  Lock,
} from 'lucide-react';
import { TaskItem, ProjectItem, DailyWorkLog } from '../../types';

interface TaskWorkingUpdatesViewProps {
  task: TaskItem;
  project: ProjectItem;
  currentUser?: any;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  onBack: () => void;
  onUpdateTask?: (task: TaskItem) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskItem['status']) => void;
}

export const TaskWorkingUpdatesView: React.FC<TaskWorkingUpdatesViewProps> = ({
  task,
  project,
  currentUser,
  userRole = 'EMPLOYEE',
  onBack,
  onUpdateTask,
  onLogTaskHours,
  onUpdateTaskStatus,
}) => {
  const isEmployee = userRole === 'EMPLOYEE';

  // Work update form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formStatus, setFormStatus] = useState<DailyWorkLog['status']>('In Progress');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local copy of daily logs (for optimistic UI)
  const [localLogs, setLocalLogs] = useState<DailyWorkLog[]>(() => task.dailyLogs || []);

  // Computed hours from start/end times
  const computedHours = useMemo(() => {
    try {
      const [sh, sm] = formStartTime.split(':').map(Number);
      const [eh, em] = formEndTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? parseFloat((diff / 60).toFixed(1)) : 0;
    } catch {
      return 0;
    }
  }, [formStartTime, formEndTime]);

  // Total logged hours (from all logs)
  const totalLoggedHours = useMemo(() => {
    return localLogs.reduce((sum, l) => sum + (l.hoursSpent || 0), 0);
  }, [localLogs]);

  const progressPercent = task.estimatedHours > 0
    ? Math.min(100, Math.round((totalLoggedHours / task.estimatedHours) * 100))
    : 0;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'In Review': return 'bg-purple-50 text-purple-700 border-purple-300';
      case 'Blocked': return 'bg-red-50 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formDescription.trim()) {
      setFormError('Please describe what you worked on today.');
      return;
    }
    if (computedHours <= 0) {
      setFormError('End time must be after start time. Please fix the times.');
      return;
    }

    setIsSaving(true);

    const newLog: DailyWorkLog = {
      id: `log-${Date.now()}`,
      date: formDate,
      startHour: formStartTime,
      endHour: formEndTime,
      hoursSpent: computedHours,
      status: formStatus,
      description: formDescription.trim(),
      loggedBy: currentUser?.full_name || 'Employee',
      loggedByAvatar: currentUser?.profile_image || undefined,
      loggedByRole: currentUser?.role || 'EMPLOYEE',
      createdAt: new Date().toLocaleString(),
    };

    const updatedLogs = [newLog, ...localLogs];
    setLocalLogs(updatedLogs);

    // Persist via callbacks
    if (onLogTaskHours) {
      onLogTaskHours(task.id, computedHours, formDescription.trim());
    }
    if (onUpdateTask) {
      onUpdateTask({
        ...task,
        status: formStatus === 'Completed' ? 'Completed' : (formStatus === 'In Progress' ? 'In Progress' : task.status),
        loggedHours: (task.loggedHours || 0) + computedHours,
        dailyLogs: updatedLogs,
      });
    }
    if (onUpdateTaskStatus && formStatus === 'Completed') {
      onUpdateTaskStatus(task.id, 'Completed');
    }

    // Reset form
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage('✓ Work update submitted successfully!');
      setFormDescription('');
      setFormStartTime('09:00');
      setFormEndTime('17:00');
      setFormStatus('In Progress');
      setShowAddForm(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* ================================================================ */}
      {/* BACK NAVIGATION + BREADCRUMB                                     */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600" />
            <span>Back to {project.name} Tasks</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Projects</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{project.name}</span>
            <span>/</span>
            <span className="text-indigo-600 font-bold">{task.code} Working Updates</span>
          </div>
        </div>

        {isEmployee && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + Submit Today's Work Update
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* TASK HEADER CARD - READ ONLY INFO (assigned by admin)            */}
      {/* ================================================================ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          {/* Left: Task Identity */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-white/15 text-white border border-white/20">
                {task.code}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(task.status)}`}>
                {task.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-slate-300 border border-white/15">
                {task.priority} Priority
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {task.title}
            </h1>

            {task.description && (
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                {task.description}
              </p>
            )}

            {/* Read-Only Admin-Set Fields */}
            <div className="flex items-center gap-1.5 mt-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Assigned by Admin – Read Only
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
              {task.workType && (
                <div className="bg-white/8 rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-medium block">Work Type</span>
                  <span className="text-xs font-bold text-pink-300 flex items-center gap-1 mt-0.5">
                    <Target className="w-3 h-3" />
                    {task.workType}
                  </span>
                </div>
              )}
              {task.module && (
                <div className="bg-white/8 rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-medium block">Module</span>
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1 mt-0.5">
                    <Layers className="w-3 h-3" />
                    {task.module}
                  </span>
                </div>
              )}
              {task.sprint && (
                <div className="bg-white/8 rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-medium block">Sprint</span>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                    <Zap className="w-3 h-3" />
                    {task.sprint}
                  </span>
                </div>
              )}
              <div className="bg-white/8 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-medium block">Due Date</span>
                <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {task.dueDate}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Progress Summary */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[220px] space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block">
              Hours Progress
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{totalLoggedHours}h</span>
              <span className="text-sm text-slate-300">/ {task.estimatedHours}h est</span>
            </div>

            <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{progressPercent}% complete</span>
              <span>{localLogs.length} updates logged</span>
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assignee:</span>
                <span className="font-bold text-white">{task.assignee.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Project:</span>
                <span className="font-bold text-white truncate max-w-[120px]">{project.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SUCCESS / ERROR ALERTS                                           */}
      {/* ================================================================ */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* ================================================================ */}
      {/* EMPLOYEE ADD WORK UPDATE FORM                                    */}
      {/* ================================================================ */}
      {isEmployee && showAddForm && (
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-sm p-6 sm:p-7 space-y-5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Submit Today's Work Update
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record your working hours, progress description, and completion status for today.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setFormError(null); }}
              className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer p-1"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmitUpdate} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {formError}
              </div>
            )}

            {/* Row 1: Date + Start + End */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Date *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work End Time *
                </label>
                <input
                  type="time"
                  required
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Computed hours display */}
            {computedHours > 0 && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Total hours this session: <strong className="font-mono">{computedHours}h</strong>
              </div>
            )}

            {/* Row 2: Status */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Task Progress Status After Today's Work *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['In Progress', 'In Review', 'Completed', 'Blocked'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormStatus(s)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                      formStatus === s
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Description */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Description / Progress Note *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe exactly what you worked on today. E.g. 'Completed the user login API endpoint, wrote unit tests, fixed pagination bug in the product listing component...'"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">{formDescription.length} characters</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setFormError(null); }}
                className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || computedHours <= 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSaving ? 'Submitting...' : 'Submit Work Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================ */}
      {/* WORK UPDATES HISTORY TABLE (visible to ALL roles)                */}
      {/* ================================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>
                {isEmployee ? 'My Work Updates History' : `${task.assignee.name}'s Work Updates Log`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Table Format
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEmployee
                ? 'All your daily progress submissions for this task – visible to Super Admin and Admin.'
                : `Full working log history submitted by ${task.assignee.name} for this task.`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              {totalLoggedHours}h logged / {task.estimatedHours}h est
            </div>
          </div>
        </div>

        {localLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">
              No work updates submitted yet
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isEmployee
                ? 'Click "+ Submit Today\'s Work Update" to record your daily working hours and progress for this task.'
                : `${task.assignee.name} has not submitted any work updates for this task yet.`}
            </p>
            {isEmployee && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit First Work Update
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-3 w-12">#</th>
                  <th className="py-3.5 px-3 min-w-[110px]">Date</th>
                  <th className="py-3.5 px-3 min-w-[100px]">Start Time</th>
                  <th className="py-3.5 px-3 min-w-[100px]">End Time</th>
                  <th className="py-3.5 px-3 min-w-[90px]">Hours Logged</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Progress Status</th>
                  <th className="py-3.5 px-3 min-w-[320px]">Work Description / Progress Note</th>
                  <th className="py-3.5 px-3 min-w-[120px]">Logged By</th>
                  <th className="py-3.5 pl-3 pr-6 min-w-[110px]">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {localLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-indigo-50/30 transition ${index === 0 ? 'bg-indigo-50/10' : ''}`}
                  >
                    {/* 1. # */}
                    <td className="py-4 pl-6 pr-3 font-mono font-bold text-slate-400 text-[11px]">
                      {localLogs.length - index}
                    </td>

                    {/* 2. Date */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 font-semibold">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {log.date}
                      </div>
                    </td>

                    {/* 3. Start Time */}
                    <td className="py-4 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-[11px]">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {log.startHour}
                      </div>
                    </td>

                    {/* 4. End Time */}
                    <td className="py-4 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.endHour}
                      </div>
                    </td>

                    {/* 5. Hours Logged */}
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200 text-xs">
                        +{log.hoursSpent}h
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(log.status)}`}>
                        {log.status}
                      </span>
                    </td>

                    {/* 7. Description */}
                    <td className="py-4 px-3">
                      <p className="text-slate-800 text-xs leading-relaxed font-medium bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 max-w-lg">
                        {log.description}
                      </p>
                    </td>

                    {/* 8. Logged By */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-1.5">
                        {log.loggedByAvatar ? (
                          <img
                            src={log.loggedByAvatar}
                            alt={log.loggedBy}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-extrabold border border-indigo-200">
                            {log.loggedBy.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-slate-700 font-semibold text-[11px]">
                          {log.loggedBy}
                        </span>
                      </div>
                    </td>

                    {/* 9. Submitted At */}
                    <td className="py-4 pl-3 pr-6 text-[10px] text-slate-400 font-mono">
                      {log.createdAt || 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {localLogs.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              <strong className="text-slate-800">{localLogs.length}</strong> work session{localLogs.length !== 1 ? 's' : ''} logged •{' '}
              <strong className="text-indigo-600">{totalLoggedHours}h</strong> total hours worked
            </span>
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-medium">
                Visible to Super Admin, Admin, and assigned Employee
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* ADMIN NOTE: Task Info Reference                                  */}
      {/* ================================================================ */}
      {!isEmployee && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            Admin View – Full Task Reference (Read-Only Assigned Details)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium block">Task Code</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{task.code}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium block">Assignee</span>
              <span className="font-bold text-slate-900">{task.assignee.name}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium block">Est. Hours</span>
              <span className="font-mono font-bold text-slate-900">{task.estimatedHours}h</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-500 font-medium block">Current Status</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStatusBadgeStyle(task.status)}`}>
                {task.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskWorkingUpdatesView;
