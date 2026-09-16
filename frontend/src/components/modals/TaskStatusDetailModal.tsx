import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  User,
  CheckCheck,
  Info,
} from 'lucide-react';
import { TaskItem, DailyWorkLog, TaskNotification, NotificationItem } from '../../types';
import { User as UserType } from '../../types';

interface TaskStatusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  currentUser?: UserType | null;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  onUpdateTask: (task: TaskItem) => void;
  onSendNotification?: (notif: {
    title: string;
    message: string;
    type: NotificationItem['type'];
    relatedEntityId?: string;
    senderName?: string;
    senderRole?: string;
  }) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskItem['status']) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
}

export const TaskStatusDetailModal: React.FC<TaskStatusDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  currentUser,
  userRole = 'EMPLOYEE',
  onUpdateTask,
  onSendNotification,
  onUpdateTaskStatus,
  onLogTaskHours,
}) => {
  if (!isOpen) return null;

  const currentUserName = currentUser?.full_name || 'System User';
  const currentUserRole = currentUser?.role || userRole;
  const currentUserAvatar = currentUser?.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  // Check if current user is the assignee of this task
  const isMyTask = React.useMemo(() => {
    if (!currentUser) return false;
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const userName = (currentUser.full_name || '').toLowerCase().trim();
    const taskAssigneeEmail = (task.assignee?.email || '').toLowerCase().trim();
    const taskAssigneeName = (task.assignee?.name || '').toLowerCase().trim();
    return (userEmail && taskAssigneeEmail === userEmail) || (userName && taskAssigneeName === userName);
  }, [currentUser, task]);

  // Main Tabs: 'daily-logs' (Daily Working Status Table) or 'notifications' (Task Notifications)
  const [activeTab, setActiveTab] = useState<'daily-logs' | 'notifications'>('daily-logs');

  // Overall Task Status
  const [overallStatus, setOverallStatus] = useState<TaskItem['status']>(task.status);

  // Editable Task Description
  const [taskDescription, setTaskDescription] = useState<string>(
    task.description || `${task.title} - Module: ${task.module || 'General'}. Deliver complete implementation according to sprint specifications.`
  );
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Daily Work Log Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState<string>(todayStr);
  const [startHour, setStartHour] = useState<string>('09:30 AM');
  const [endHour, setEndHour] = useState<string>('06:00 PM');
  const [hoursSpent, setHoursSpent] = useState<number>(8);
  const [dayStatus, setDayStatus] = useState<DailyWorkLog['status']>(task.status || 'In Progress');
  const [workDescription, setWorkDescription] = useState<string>('');

  // Task Notification Form State
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifDescription, setNotifDescription] = useState<string>('');
  const [notifPriority, setNotifPriority] = useState<TaskNotification['priority']>('High');
  const [notifType, setNotifType] = useState<NotificationItem['type']>('ALERT');


  // Helper for Status Badge Styling
  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Review':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'To Do':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Helper for Priority Badge
  const getPriorityBadgeClass = (p?: string) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Helper to calculate hours spent based on start & end time strings (e.g. 09:30 AM to 06:00 PM)
  const calculateHours = (start: string, end: string) => {
    try {
      const parseTime = (timeStr: string) => {
        const trimmed = timeStr.trim().toUpperCase();
        let hours = 0;
        let minutes = 0;
        const isPM = trimmed.includes('PM');
        const isAM = trimmed.includes('AM');
        const clean = trimmed.replace('AM', '').replace('PM', '').trim();
        const parts = clean.split(':');
        if (parts.length >= 2) {
          hours = parseInt(parts[0], 10);
          minutes = parseInt(parts[1], 10);
        } else if (parts.length === 1) {
          hours = parseInt(parts[0], 10);
        }
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return hours + minutes / 60;
      };

      const startH = parseTime(start);
      const endH = parseTime(end);
      let diff = endH - startH;
      if (diff < 0) diff += 24; // overnight
      return Math.round(diff * 10) / 10;
    } catch {
      return 8;
    }
  };

  // Handle Changing Overall Task Status
  const handleUpdateOverallStatus = (newStatus: TaskItem['status']) => {
    setOverallStatus(newStatus);
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(task.id, newStatus);
    }
    const updated: TaskItem = {
      ...task,
      status: newStatus,
      description: taskDescription,
    };
    onUpdateTask(updated);
  };

  // Handle Saving Task Description
  const handleSaveDescription = () => {
    const updated: TaskItem = {
      ...task,
      description: taskDescription,
      status: overallStatus,
    };
    onUpdateTask(updated);
    setIsEditingDescription(false);
  };

  // Handle Submitting Daily Work Log
  const handleAddDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDescription.trim()) {
      alert('Please enter a description of the work done for this day.');
      return;
    }

    const calculatedHrs = hoursSpent > 0 ? Number(hoursSpent) : calculateHours(startHour, endHour);

    const newLog: DailyWorkLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: logDate,
      startHour: startHour || '09:30 AM',
      endHour: endHour || '06:00 PM',
      hoursSpent: calculatedHrs,
      status: dayStatus,
      description: workDescription.trim(),
      loggedBy: currentUserName,
      loggedByAvatar: currentUserAvatar,
      loggedByRole: currentUserRole,
      createdAt: new Date().toISOString(),
    };

    const updatedLogs = [newLog, ...(task.dailyLogs || [])];
    const newTotalLoggedHours = (task.loggedHours || 0) + calculatedHrs;

    const updatedTask: TaskItem = {
      ...task,
      dailyLogs: updatedLogs,
      loggedHours: newTotalLoggedHours,
      status: dayStatus === 'Completed' ? 'Completed' : dayStatus === 'In Review' ? 'In Review' : overallStatus,
      description: taskDescription,
    };

    setOverallStatus(updatedTask.status);
    onUpdateTask(updatedTask);

    if (onLogTaskHours) {
      onLogTaskHours(task.id, calculatedHrs, `Daily Log: ${workDescription.trim()}`);
    }

    // Reset log form description
    setWorkDescription('');
    alert(`Daily work log for ${logDate} added successfully (${calculatedHrs}h logged).`);
  };

  // Handle Deleting Daily Log Entry
  const handleDeleteDailyLog = (logId: string) => {
    const targetLog = (task.dailyLogs || []).find((l) => l.id === logId);
    const updatedLogs = (task.dailyLogs || []).filter((l) => l.id !== logId);
    const deductedHours = targetLog ? targetLog.hoursSpent : 0;
    const newLoggedHours = Math.max(0, (task.loggedHours || 0) - deductedHours);

    const updatedTask: TaskItem = {
      ...task,
      dailyLogs: updatedLogs,
      loggedHours: newLoggedHours,
    };
    onUpdateTask(updatedTask);
  };

  // Handle Sending Notification from Modal Tab
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifDescription.trim()) {
      alert('Please fill out both the notification title and description.');
      return;
    }

    const newNotification: TaskNotification = {
      id: `task-notif-${Date.now()}`,
      taskId: task.id,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderAvatar: currentUserAvatar,
      title: notifTitle.trim(),
      description: notifDescription.trim(),
      priority: notifPriority,
      isRead: false,
      status: 'Pending',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
    };

    const updatedTaskNotifications = [newNotification, ...(task.taskNotifications || [])];
    const updatedTask: TaskItem = {
      ...task,
      taskNotifications: updatedTaskNotifications,
    };
    onUpdateTask(updatedTask);

    // Also dispatch to system-wide notifications
    if (onSendNotification) {
      onSendNotification({
        title: `[${task.code}] ${notifTitle.trim()}`,
        message: `${currentUserName} (${currentUserRole}): ${notifDescription.trim()}`,
        type: notifType,
        relatedEntityId: task.id,
        senderName: currentUserName,
        senderRole: currentUserRole,
      });
    }

    setNotifTitle('');
    setNotifDescription('');
    alert('Notification sent successfully to task channel and escalation system.');
  };

  // Handle Acknowledge Notification
  const handleAcknowledgeNotification = (notifId: string) => {
    const updatedNotifs = (task.taskNotifications || []).map((n) =>
      n.id === notifId ? { ...n, status: 'Acknowledged' as const, isRead: true } : n
    );
    const updatedTask: TaskItem = {
      ...task,
      taskNotifications: updatedNotifs,
    };
    onUpdateTask(updatedTask);
  };

  const totalLogsCount = (task.dailyLogs || []).length;
  const totalNotifsCount = (task.taskNotifications || []).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto max-h-[94vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-hidden"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {task.code}
                  </span>
                  <span className="text-xs text-indigo-300 font-semibold">
                    {task.project || 'Project Task'}
                  </span>
                  <span className="text-indigo-400">•</span>
                  <span className="text-xs font-bold text-amber-300">
                    {task.workType || 'General'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                  {task.title}
                </h3>
              </div>
            </div>

            {/* Overall Status Badge */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Overall Status</p>
                <p className="text-sm font-extrabold text-white">{overallStatus}</p>
              </div>
              <span className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold shadow-sm border ${getStatusBadgeClass(overallStatus)}`}>
                {overallStatus}
              </span>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('daily-logs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-2xs ${
                activeTab === 'daily-logs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Daily Working Status & Timeline</span>
              {totalLogsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                  {totalLogsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-2xs ${
                activeTab === 'notifications'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Task Notifications & Communication</span>
              {totalNotifsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {totalNotifsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* TAB 1: Daily Working Status & Schedule Timeline */}
          {activeTab === 'daily-logs' && (
            <div className="space-y-6">
              {/* Task Schedule & Meta Info Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Start Date */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Start Date</span>
                    <Calendar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 font-mono">
                    {task.startDate || '2026-09-01'}
                  </p>
                  <p className="text-[10px] text-slate-500">Initiated sprint date</p>
                </div>

                {/* Ending Date / Final Deadline */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Ending Date (Due)</span>
                    <Calendar className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-sm font-extrabold text-red-600 font-mono">
                    {task.dueDate || '2026-11-15'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {task.developerDeadline ? `Role: ${task.developerDeadline.split('T')[0]}` : 'Final target release'}
                  </p>
                </div>

                {/* Hours Tracking */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Hours Logged</span>
                    <Clock className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-sm font-extrabold text-purple-700 font-mono">
                    {task.loggedHours || 0} / {task.estimatedHours || 0} hrs
                  </p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(((task.loggedHours || 0) / Math.max(1, task.estimatedHours || 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Assignee Information */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Assigned To</span>
                    <User className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <img
                      src={task.assignee?.avatar || currentUserAvatar}
                      alt={task.assignee?.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {task.assignee?.name || 'Unassigned'}
                        {isMyTask && <span className="ml-1 text-[9px] text-emerald-600 font-extrabold">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{task.assignee?.role || 'Team Member'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Description (In Text Format) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Task Description (Text Format)</span>
                  </h4>
                  {!isEditingDescription ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      Edit Description
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      Save Description
                    </button>
                  )}
                </div>

                {isEditingDescription ? (
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
                    placeholder="Provide full description, specifications, and scope for this task..."
                  />
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {taskDescription}
                  </div>
                )}
              </div>

              {/* Overall Status Selector Buttons */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Quick Update Working Status:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['To Do', 'In Progress', 'In Review', 'Completed'] as TaskItem['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateOverallStatus(st)}
                      className={`p-3 rounded-2xl font-bold text-xs border transition flex items-center justify-center gap-2 ${
                        overallStatus === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          st === 'Completed'
                            ? 'bg-emerald-400'
                            : st === 'In Progress'
                            ? 'bg-blue-400'
                            : st === 'In Review'
                            ? 'bg-purple-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Today's Daily Work Log Form */}
              <div className="bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/60 rounded-3xl p-5 sm:p-6 border border-indigo-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Log Daily Working Status & Hours
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Record today's start hours, ending hours, daily status, and description of completed work
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddDailyLog} className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Date */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Work Date
                      </label>
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        required
                      />
                    </div>

                    {/* Starting Hours */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Starting Hours
                      </label>
                      <input
                        type="text"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        placeholder="09:30 AM"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        required
                      />
                    </div>

                    {/* Ending Hours */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Ending Hours
                      </label>
                      <input
                        type="text"
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        placeholder="06:00 PM"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        required
                      />
                    </div>

                    {/* Hours Spent */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Hours Spent (Hrs)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        value={hoursSpent}
                        onChange={(e) => setHoursSpent(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                        required
                      />
                    </div>

                    {/* Daily Working Status */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Day Status
                      </label>
                      <select
                        value={dayStatus}
                        onChange={(e) => setDayStatus(e.target.value as DailyWorkLog['status'])}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Blocked">Blocked</option>
                        <option value="To Do">To Do</option>
                      </select>
                    </div>
                  </div>

                  {/* Work Description (Text Format) */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Work Description (In Text Format):
                    </label>
                    <textarea
                      value={workDescription}
                      onChange={(e) => setWorkDescription(e.target.value)}
                      rows={2}
                      placeholder="Describe the tasks, modules, bugs fixed, or features worked on during these hours..."
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-indigo-700 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Logging as: <strong>{currentUserName}</strong> ({currentUserRole})
                    </span>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Submit & Save Daily Work Log
                    </button>
                  </div>
                </form>
              </div>

              {/* Daily Working Status Table */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Daily Working Status Table</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comprehensive log of all daily hours, timings, and work descriptions for this task
                    </p>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto font-mono">
                    Total: {task.dailyLogs?.length || 0} entries
                  </span>
                </div>

                {(!task.dailyLogs || task.dailyLogs.length === 0) ? (
                  <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">
                      No daily work logs recorded yet for this task.
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Use the "Log Daily Working Status & Hours" form above to submit your first work entry with timings and descriptions.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-3.5">Date</th>
                          <th className="py-3 px-3.5">Starting Hours</th>
                          <th className="py-3 px-3.5">Ending Hours</th>
                          <th className="py-3 px-3.5 text-center">Hours Spent</th>
                          <th className="py-3 px-3.5 text-center">Day Status</th>
                          <th className="py-3 px-4 min-w-[240px]">Work Description (Text Format)</th>
                          <th className="py-3 px-3.5">Logged By</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {task.dailyLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition">
                            {/* Date */}
                            <td className="py-3 px-3.5 font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                              {log.date}
                            </td>

                            {/* Starting Hours */}
                            <td className="py-3 px-3.5 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                              {log.startHour || '09:30 AM'}
                            </td>

                            {/* Ending Hours */}
                            <td className="py-3 px-3.5 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                              {log.endHour || '06:00 PM'}
                            </td>

                            {/* Hours Spent */}
                            <td className="py-3 px-3.5 text-center font-mono text-xs font-bold text-indigo-700 whitespace-nowrap">
                              {log.hoursSpent}h
                            </td>

                            {/* Day Status */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(
                                  log.status
                                )}`}
                              >
                                {log.status}
                              </span>
                            </td>

                            {/* Work Description (Text Format) */}
                            <td className="py-3 px-4 text-slate-800 text-xs font-medium leading-relaxed">
                              <p className="whitespace-pre-wrap">{log.description}</p>
                            </td>

                            {/* Logged By */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img
                                  src={log.loggedByAvatar || currentUserAvatar}
                                  alt={log.loggedBy}
                                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                                />
                                <span className="text-xs font-bold text-slate-700">{log.loggedBy}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteDailyLog(log.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="Delete this work log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Task Notifications & Communications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Send Notification Form */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      Send Task Notification / Communication
                    </h4>
                    <p className="text-xs text-indigo-200">
                      Super Admin, Admin, and Employee can send and update notifications for <strong>{task.code}</strong>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendNotification} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Title */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
                        Notification Subject / Title
                      </label>
                      <input
                        type="text"
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g., Code Review Requested / Deployment Alert / Status Inquiry"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs font-semibold focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                        required
                      />
                    </div>

                    {/* Priority / Type */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
                        Priority Level
                      </label>
                      <select
                        value={notifPriority}
                        onChange={(e) => {
                          const p = e.target.value as TaskNotification['priority'];
                          setNotifPriority(p);
                          setNotifType(p === 'Urgent' ? 'ALERT' : 'ASSIGNMENT');
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/20 text-white text-xs font-bold focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                      >
                        <option value="Urgent">Urgent Alert</option>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low / Informational</option>
                      </select>
                    </div>
                  </div>

                  {/* Notification Description (Text Format) */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
                      Notification Message / Description (Text Format):
                    </label>
                    <textarea
                      value={notifDescription}
                      onChange={(e) => setNotifDescription(e.target.value)}
                      rows={3}
                      placeholder="Write detailed notification description, update instructions, blockers, or feedback for the team..."
                      className="w-full p-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-hidden leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs text-indigo-300">
                      <span>Sender:</span>
                      <span className="font-bold text-white">{currentUserName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-[10px] font-bold border border-indigo-400/30">
                        {currentUserRole}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Send Task Notification
                    </button>
                  </div>
                </form>
              </div>

              {/* Notifications Timeline & Communications Feed */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Task Notifications History ({task.taskNotifications?.length || 0})</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Notifications sent by Super Admin, Admin, and Employee for this task
                  </p>
                </div>

                {(!task.taskNotifications || task.taskNotifications.length === 0) ? (
                  <div className="text-center py-12 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">
                      No notifications sent yet for this task.
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Use the notification sender form above to send an update, query, or urgent alert regarding this task.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {task.taskNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-3 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={notif.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                              alt={notif.senderName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-900">{notif.senderName}</span>
                                <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {notif.senderRole}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">{notif.timestamp}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getPriorityBadgeClass(notif.priority)}`}>
                              {notif.priority} Priority
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              notif.status === 'Acknowledged'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {notif.status || 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Notification Subject & Description Text */}
                        <div className="pl-9 space-y-1">
                          <h5 className="text-xs font-extrabold text-slate-900">{notif.title}</h5>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {notif.description}
                          </p>
                        </div>

                        {/* Actions for Employee / Admin to update notification */}
                        <div className="pl-9 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Task Channel • {task.code}
                          </span>
                          {notif.status !== 'Acknowledged' && (
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeNotification(notif.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Acknowledge & Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              All daily status updates and task notifications are synchronized with database.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition shadow-sm"
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
