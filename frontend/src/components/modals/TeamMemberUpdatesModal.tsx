import React, { useState } from 'react';
import {
  X,
  Mail,
  Briefcase,
  CheckCircle2,
  Clock,
  Send,
  Bell,
  AlertCircle,
  Plus,
  ChevronDown,
  Layers,
  Zap,
  Target,
  Calendar,
} from 'lucide-react';
import { TaskItem, ProjectItem, NotificationItem } from '../../types';

interface TeamMemberUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  } | null;
  project: ProjectItem;
  projectTasks: TaskItem[];
  currentUser?: any;
  notifications?: NotificationItem[];
  onUpdateTaskStatus?: (taskId: string, status: TaskItem['status']) => void;
  onLogTaskHours?: (taskId: string, hours: number, note: string) => void;
  onSendNotification?: (notif: {
    title: string;
    message: string;
    type: NotificationItem['type'];
    relatedEntityId?: string;
    senderName?: string;
    senderRole?: string;
  }) => void;
  onOpenCreateTask?: () => void;
}

export const TeamMemberUpdatesModal: React.FC<TeamMemberUpdatesModalProps> = ({
  isOpen,
  onClose,
  member,
  project,
  projectTasks,
  currentUser,
  notifications = [],
  onUpdateTaskStatus,
  onLogTaskHours,
  onSendNotification,
  onOpenCreateTask,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notify'>('tasks');

  // Notification form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationItem['type']>('ALERT');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  // Quick log work state for a task
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<string | null>(null);
  const [logHours, setLogHours] = useState<number>(1);
  const [logNote, setLogNote] = useState<string>('');

  if (!isOpen || !member) return null;

  // Filter tasks strictly assigned to this employee in this project
  const memberTasks = projectTasks.filter((t) => {
    const taskEmail = (t.assignee?.email || '').trim().toLowerCase();
    const taskName = (t.assignee?.name || '').trim().toLowerCase();
    const memEmail = (member.email || '').trim().toLowerCase();
    const memName = member.name.trim().toLowerCase();
    return (memEmail && taskEmail === memEmail) || (memName && taskName === memName);
  });

  const completedCount = memberTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = memberTasks.filter((t) => t.status === 'In Progress').length;
  const inReviewCount = memberTasks.filter((t) => t.status === 'In Review').length;

  const totalLoggedHours = memberTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
  const totalEstHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  // Related notifications sent for this project
  const relatedNotifs = notifications.filter(
    (n) =>
      n.relatedEntityId === project.id ||
      n.message.toLowerCase().includes(member.name.toLowerCase()) ||
      n.title.toLowerCase().includes(member.name.toLowerCase())
  );

  const handleSendNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = notifTitle.trim();
    const message = notifMessage.trim();
    if (!title || !message) {
      alert('Please fill in both the notification title and message.');
      return;
    }

    setIsSendingNotif(true);

    if (onSendNotification) {
      onSendNotification({
        title,
        message: `${message} (Project: ${project.name})`,
        type: notifType,
        relatedEntityId: project.id,
        senderName: currentUser?.full_name || 'Administrator',
        senderRole: currentUser?.role || 'Super Admin',
      });
    }

    setTimeout(() => {
      setIsSendingNotif(false);
      setSendSuccessMessage(`Notification successfully sent to ${member.name}!`);
      setNotifTitle('');
      setNotifMessage('');

      setTimeout(() => {
        setSendSuccessMessage(null);
      }, 4000);
    }, 400);
  };

  const handleSaveLog = (taskId: string) => {
    if (logHours <= 0) {
      alert('Please enter valid working hours.');
      return;
    }
    if (!logNote.trim()) {
      alert('Please enter a brief progress description.');
      return;
    }

    if (onLogTaskHours) {
      onLogTaskHours(taskId, logHours, logNote.trim());
    }

    setSelectedTaskForLog(null);
    setLogHours(1);
    setLogNote('');
  };

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'In Review':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'To Do':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* ========================================================================= */}
        {/* HEADER                                                                    */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10 sm:pr-12">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={
                    member.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={member.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-white tracking-tight">{member.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                    {member.role || 'Team Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{member.email || 'No email registered'}</span>
                </p>
              </div>
            </div>

            {/* Project Context Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 shrink-0 self-start sm:self-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                Active Project
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">{project.name}</span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/15 text-white">
                  {project.code}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-medium block">Allocated Tasks</span>
              <span className="text-base font-extrabold text-white font-mono">{memberTasks.length}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-medium block">Completed</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">{completedCount}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-medium block">In Progress / Review</span>
              <span className="text-base font-extrabold text-blue-400 font-mono">
                {inProgressCount + inReviewCount}
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-medium block">Logged Hours</span>
              <span className="text-base font-extrabold text-amber-300 font-mono">
                {totalLoggedHours}h <span className="text-[10px] text-slate-400 font-normal">/ {totalEstHours}h</span>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABS NAVIGATION                                                           */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Working Updates & Tasks</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'tasks' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {memberTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notify')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'notify'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Send Project Update / Notification</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Admin Direct
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: WORKING UPDATES & TASKS                                            */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Working Progress for {member.name}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Tasks, status updates, and logged working hours for {project.name}.
                </p>
              </div>

              {onOpenCreateTask && (
                <button
                  type="button"
                  onClick={onOpenCreateTask}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Assign Task</span>
                </button>
              )}
            </div>

            {memberTasks.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                <Clock className="w-10 h-10 text-slate-400 mx-auto" />
                <h5 className="text-sm font-bold text-slate-800">No Tasks Assigned Yet</h5>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {member.name} is currently a team member on {project.name} but has no active tasks
                  allocated.
                </p>
                {onOpenCreateTask && (
                  <button
                    type="button"
                    onClick={onOpenCreateTask}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign First Task to {member.name}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                {memberTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition space-y-3"
                  >
                    {/* Task Title & Code */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {task.code}
                        </span>
                        <h5 className="font-bold text-xs text-slate-900">{task.title}</h5>
                      </div>

                      {/* Interactive Status Changer */}
                      <div className="flex items-center gap-2">
                        {onUpdateTaskStatus ? (
                          <div className="relative">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                onUpdateTaskStatus(task.id, e.target.value as TaskItem['status'])
                              }
                              className={`text-[11px] font-bold py-1 pl-2.5 pr-6 rounded-lg border appearance-none cursor-pointer focus:outline-none transition ${getStatusBadge(
                                task.status
                              )}`}
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="In Review">In Review</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
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
                      </div>
                    </div>

                    {/* Task Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      {task.workType && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200 font-bold">
                          <Target className="w-3 h-3 text-pink-600" />
                          <span>{task.workType}</span>
                        </span>
                      )}
                      {task.module && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                          <Layers className="w-3 h-3 text-purple-600" />
                          <span>{task.module}</span>
                        </span>
                      )}
                      {task.sprint && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>{task.sprint}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: {task.dueDate || 'No deadline'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {task.loggedHours || 0}h logged / {task.estimatedHours || 0}h est
                        </span>
                      </span>
                    </div>

                    {/* Daily Work Logs / Progress Notes */}
                    {task.dailyLogs && task.dailyLogs.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Recent Work Logs / Daily Updates:
                        </span>
                        <div className="space-y-1">
                          {task.dailyLogs.slice(0, 3).map((log, idx) => (
                            <div
                              key={log.id || idx}
                              className="text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <p className="font-semibold text-slate-800">{log.description}</p>
                                <p className="text-[10px] text-slate-400">
                                  {log.date} • Logged by {log.loggedBy || member.name}
                                </p>
                              </div>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                                +{log.hoursSpent}h
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Working Update Logger */}
                    {selectedTaskForLog === task.id ? (
                      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-900">
                            Log Working Update for {task.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForLog(null)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              Hours Spent
                            </label>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={logHours}
                              onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-mono font-bold"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              Progress Note / Update Description
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Worked on database schema, resolved login token issue..."
                              value={logNote}
                              onChange={(e) => setLogNote(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskForLog(null)}
                            className="px-3 py-1 rounded-lg text-slate-600 text-xs font-semibold hover:bg-white cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveLog(task.id)}
                            className="px-3.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Save Work Update
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTaskForLog(task.id);
                            setLogHours(1);
                            setLogNote('');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Add Work Update Note</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEND PROJECT UPDATE / NOTIFICATION                                 */}
        {/* ========================================================================= */}
        {activeTab === 'notify' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Send Project Notification & Directive</span>
              </h4>
              <p className="text-xs text-slate-500">
                Notify <strong className="text-slate-700">{member.name}</strong> directly regarding work,
                deadlines, or updates for <strong className="text-slate-700">{project.name}</strong>.
              </p>
            </div>

            {sendSuccessMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sendSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSendNotificationSubmit} className="space-y-4">
              {/* Notification Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notification Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'ALERT', label: 'Priority Alert', icon: AlertCircle, color: 'text-amber-600' },
                    { type: 'ASSIGNMENT', label: 'Work Directive', icon: CheckCircle2, color: 'text-indigo-600' },
                    { type: 'DELIVERY', label: 'Delivery Milestone', icon: Zap, color: 'text-emerald-600' },
                    { type: 'EXTENSION_REQUEST', label: 'Schedule Notice', icon: Clock, color: 'text-purple-600' },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = notifType === cat.type;
                    return (
                      <button
                        key={cat.type}
                        type="button"
                        onClick={() => setNotifType(cat.type as NotificationItem['type'])}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cat.color} shrink-0`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notification Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. [${project.name}] Please prioritize Sprint 1 API modules...`}
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Message Details */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Message / Update Directive *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={`Write the exact instructions or project notice for ${member.name}. E.g.: "Please review the payment endpoints and complete the tests before the upcoming release."`}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Direct message from: <strong className="text-slate-700">{currentUser?.full_name || 'Admin'}</strong>
                </span>

                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingNotif ? 'Sending...' : `Send Notification to ${member.name}`}</span>
                </button>
              </div>
            </form>

            {/* Past Directives / Notifications */}
            {relatedNotifs.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Past Directives & Notifications for this Project:
                </span>
                <div className="space-y-2">
                  {relatedNotifs.slice(0, 3).map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* FOOTER                                                                    */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            {memberTasks.length} project tasks allocated to {member.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
