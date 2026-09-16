import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
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
  Search,
  CheckSquare,
  Trash2,
  FileText,
} from 'lucide-react';
import { TaskItem, ProjectItem, NotificationItem, DailyWorkLog } from '../../types';

interface PersonDashboardViewProps {
  member: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
    phone?: string;
    status?: string;
  };
  project: ProjectItem;
  tasks: TaskItem[];
  currentUser?: any;
  userRole?: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  notifications?: NotificationItem[];
  onBack: () => void;
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
  onUpdateTask?: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const PersonDashboardView: React.FC<PersonDashboardViewProps> = ({
  member,
  project,
  tasks = [],
  currentUser,
  userRole = 'SUPER_ADMIN',
  notifications = [],
  onBack,
  onUpdateTaskStatus,
  onLogTaskHours,
  onSendNotification,
  onOpenCreateTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  // Navigation tabs within Person Dashboard
  const [activeTab, setActiveTab] = useState<'table-updates' | 'daily-logs' | 'notifications'>('table-updates');

  // Search and filter for the tasks table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Quick Work Update Modal / Inline state
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<TaskItem | null>(null);
  const [logHours, setLogHours] = useState<number>(1);
  const [logNote, setLogNote] = useState<string>('');
  const [logNewStatus, setLogNewStatus] = useState<TaskItem['status'] | ''>('');

  // Notification form state
  const [notifCategory, setNotifCategory] = useState<NotificationItem['type']>('ALERT');
  const [notifSubject, setNotifSubject] = useState(`[${project.name}] `);
  const [notifMessage, setNotifMessage] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [localSentNotifs, setLocalSentNotifs] = useState<NotificationItem[]>([]);

  // Filter tasks strictly belonging to this employee in this project
  const memberTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Match project context
      const isProjectMatch =
        !t.project ||
        t.project.trim().toLowerCase() === project.name.trim().toLowerCase() ||
        t.project.trim().toLowerCase() === project.id.trim().toLowerCase() ||
        (project.code && t.project.trim().toLowerCase() === project.code.trim().toLowerCase());

      // 2. Match member assignee
      const taskEmail = (t.assignee?.email || '').trim().toLowerCase();
      const taskName = (t.assignee?.name || '').trim().toLowerCase();
      const memEmail = (member.email || '').trim().toLowerCase();
      const memName = (member.name || '').trim().toLowerCase();

      const isAssigneeMatch =
        (memEmail && taskEmail === memEmail) ||
        (memName && taskName === memName);

      return isProjectMatch && isAssigneeMatch;
    });
  }, [tasks, project, member]);

  // Filtered tasks for table based on search & status filter
  const filteredTasks = useMemo(() => {
    return memberTasks.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.module && t.module.toLowerCase().includes(q)) ||
        (t.sprint && t.sprint.toLowerCase().includes(q)) ||
        (t.workType && t.workType.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [memberTasks, searchQuery, statusFilter]);

  // Aggregate metrics
  const completedCount = memberTasks.filter((t) => t.status === 'Completed').length;
  const inProgressCount = memberTasks.filter((t) => t.status === 'In Progress').length;
  const inReviewCount = memberTasks.filter((t) => t.status === 'In Review').length;
  const todoCount = memberTasks.filter((t) => t.status === 'To Do').length;

  const totalLoggedHours = memberTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
  const totalEstHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const progressPercent = totalEstHours > 0 ? Math.min(100, Math.round((totalLoggedHours / totalEstHours) * 100)) : 0;

  // Aggregate all daily logs for this member in this project
  const allDailyLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      taskId: string;
      taskCode: string;
      taskTitle: string;
      date: string;
      hoursSpent: number;
      description: string;
      status: string;
      loggedBy: string;
      createdAt?: string;
    }> = [];

    memberTasks.forEach((t) => {
      if (t.dailyLogs && t.dailyLogs.length > 0) {
        t.dailyLogs.forEach((l) => {
          logs.push({
            id: l.id,
            taskId: t.id,
            taskCode: t.code,
            taskTitle: t.title,
            date: l.date || l.createdAt || 'Recent',
            hoursSpent: l.hoursSpent || 0,
            description: l.description,
            status: l.status || t.status,
            loggedBy: l.loggedBy || member.name,
            createdAt: l.createdAt,
          });
        });
      }
    });

    return logs.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [memberTasks, member]);

  // Filter project-specific notifications sent to this member
  const memberProjectNotifications = useMemo(() => {
    const combined = [...localSentNotifs, ...notifications];
    const uniqueMap = new Map<string, NotificationItem>();

    combined.forEach((n) => {
      const mentionsMember =
        n.message.toLowerCase().includes(member.name.toLowerCase()) ||
        n.title.toLowerCase().includes(member.name.toLowerCase()) ||
        (member.email && n.message.toLowerCase().includes(member.email.toLowerCase()));

      const matchesProject =
        n.relatedEntityId === project.id ||
        n.message.toLowerCase().includes(project.name.toLowerCase()) ||
        n.title.toLowerCase().includes(project.name.toLowerCase());

      if (mentionsMember || matchesProject) {
        if (!uniqueMap.has(n.id)) {
          uniqueMap.set(n.id, n);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [localSentNotifs, notifications, member, project]);

  // Status badge styling helper
  const getStatusBadgeStyle = (status: TaskItem['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-500/10';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-300 ring-blue-500/10';
      case 'In Review':
        return 'bg-purple-50 text-purple-700 border-purple-300 ring-purple-500/10';
      case 'To Do':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/10';
    }
  };

  // Priority badge styling helper
  const getPriorityBadgeStyle = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Work Type styling helper
  const getWorkTypeBadge = (wt?: string) => {
    if (!wt) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 shrink-0">
        <Target className="w-2.5 h-2.5 text-pink-600" />
        <span>{wt}</span>
      </span>
    );
  };

  // Status Change Handler with direct optimistic update
  const handleStatusChange = (taskId: string, newStatus: TaskItem['status']) => {
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, newStatus);
    }
    const targetTask = memberTasks.find((t) => t.id === taskId);
    if (targetTask && onUpdateTask) {
      onUpdateTask({
        ...targetTask,
        status: newStatus,
      });
    }
  };

  // Save Quick Work Update and Log Hours
  const handleSaveWorkUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForLog) return;
    if (logHours <= 0) {
      alert('Please enter valid working hours (e.g. 1.0 or 0.5).');
      return;
    }
    if (!logNote.trim()) {
      alert('Please write a brief progress update note describing the work done.');
      return;
    }

    const taskId = selectedTaskForLog.id;
    const finalStatus = logNewStatus || selectedTaskForLog.status;

    // Create daily log object
    const newLogEntry: DailyWorkLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      startHour: '09:00',
      endHour: '18:00',
      hoursSpent: logHours,
      status: finalStatus as any,
      description: logNote.trim(),
      loggedBy: currentUser?.full_name || 'Admin',
      loggedByRole: currentUser?.role || 'Admin',
      createdAt: new Date().toLocaleString(),
    };

    // 1. Call onLogTaskHours
    if (onLogTaskHours) {
      onLogTaskHours(taskId, logHours, logNote.trim());
    }

    // 2. Call onUpdateTask to persist full dailyLog array
    if (onUpdateTask) {
      const updatedDailyLogs = [newLogEntry, ...(selectedTaskForLog.dailyLogs || [])];
      onUpdateTask({
        ...selectedTaskForLog,
        status: finalStatus as TaskItem['status'],
        loggedHours: (selectedTaskForLog.loggedHours || 0) + logHours,
        dailyLogs: updatedDailyLogs,
      });
    }

    // 3. Update status if changed
    if (logNewStatus && onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, logNewStatus);
    }

    // Close modal
    setSelectedTaskForLog(null);
    setLogNote('');
    setLogHours(1);
    setLogNewStatus('');
  };

  // Send Notification Handler
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const title = notifSubject.trim();
    const msg = notifMessage.trim();

    if (!title || !msg) {
      alert('Please fill in both Notification Subject and Message.');
      return;
    }

    setIsSendingNotif(true);

    const newLocalNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message: `${msg} (For: ${member.name} • Project: ${project.name})`,
      type: notifCategory,
      isRead: false,
      timestamp: 'Just now',
      relatedEntityId: project.id,
      senderName: currentUser?.full_name || 'Super Admin',
      senderRole: currentUser?.role || 'Super Admin',
      status: 'Pending',
    };

    setLocalSentNotifs((prev) => [newLocalNotif, ...prev]);

    if (onSendNotification) {
      onSendNotification({
        title,
        message: `${msg} (For: ${member.name} • Project: ${project.name})`,
        type: notifCategory,
        relatedEntityId: project.id,
        senderName: currentUser?.full_name || 'Administrator',
        senderRole: currentUser?.role || 'Super Admin',
      });
    }

    setTimeout(() => {
      setIsSendingNotif(false);
      setSendSuccessMessage(`Project notification successfully dispatched to ${member.name}!`);
      setNotifMessage('');
      setNotifSubject(`[${project.name}] `);

      setTimeout(() => {
        setSendSuccessMessage(null);
      }, 5000);
    }, 450);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BREADCRUMB & BACK BUTTON                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs transition hover:border-slate-300 cursor-pointer"
            title={`Return to ${project.name} Project Dashboard`}
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600" />
            <span>Back to {project.name} Dashboard</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Projects</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{project.name}</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">Team Members</span>
            <span>/</span>
            <span className="text-indigo-600 font-bold">{member.name}'s Person Dashboard</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenCreateTask && (
            <button
              type="button"
              onClick={onOpenCreateTask}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Assign Task to {member.name}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Send Direct Notification</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXECUTIVE PERSON PROFILE & PROJECT CONTEXT BANNER                         */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Profile Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={
                  member.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={member.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-lg"
              />
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm"
                title="Active Team Member"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{member.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-500/25 text-indigo-200 border border-indigo-400/30">
                  {member.role || 'Team Member'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Online / Assigned
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{member.email || 'No email specified'}</span>
                </p>
                {member.phone && (
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <span>Tel: {member.phone}</span>
                  </p>
                )}
              </div>

              <p className="text-[11px] text-indigo-200/80 font-medium">
                Person Dashboard • Real-time project task allocation, daily progress updates, and admin notification dispatch.
              </p>
            </div>
          </div>

          {/* Active Project Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 min-w-[280px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block mb-1">
              Active Project Context
            </span>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 text-amber-300 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white shrink-0">
                    {project.code || 'PRJ'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  Client: <strong className="text-white">{project.client}</strong>
                </p>
              </div>
            </div>
            {((project as any).deliveryDate || project.endDate) && (
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span>Target Delivery:</span>
                <span className="font-mono font-bold text-amber-300">{(project as any).deliveryDate || project.endDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Executive Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium block">Allocated Project Tasks</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">{memberTasks.length}</span>
              <span className="text-[10px] text-slate-400">tasks total</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium block">Completed Deliverables</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">{completedCount}</span>
              <span className="text-[10px] text-emerald-300/80">completed</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-[11px] text-slate-400 font-medium block">Active (In Progress / Review)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-400 font-mono">
                {inProgressCount + inReviewCount}
              </span>
              <span className="text-[10px] text-blue-300/80">{todoCount} to-do</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Logged Working Hours</span>
              <span className="text-[10px] font-bold text-amber-300">{progressPercent}%</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-300 font-mono">{totalLoggedHours}h</span>
              <span className="text-xs text-slate-400 font-normal">/ {totalEstHours}h est</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION TABS NAVIGATION                                                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('table-updates')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'table-updates'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Project Tasks & Updates (Table Format)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'table-updates' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {memberTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('daily-logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'daily-logs'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Daily Work Logs History (Table Format)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'daily-logs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {allDailyLogs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Send Project Notification & Directives</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Admin Direct
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 pr-2">
          Project: <strong className="text-slate-800">{project.name}</strong> • Member:{' '}
          <strong className="text-indigo-600">{member.name}</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PARTICULAR PROJECT RELATED UPDATES IN TABLE FORMAT                  */}
      {/* ========================================================================= */}
      {activeTab === 'table-updates' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Working Progress & Tasks for {project.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Table Format
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of tasks assigned to <strong className="text-slate-700">{member.name}</strong> on {project.name}.
                Admins can update status directly or record progress notes.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tasks, module, sprint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 w-52 sm:w-60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                {['ALL', 'To Do', 'In Progress', 'In Review', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {onOpenCreateTask && (
                <button
                  type="button"
                  onClick={onOpenCreateTask}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Assign Task</span>
                </button>
              )}
            </div>
          </div>

          {/* THE DATA TABLE */}
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">
                {memberTasks.length === 0
                  ? `No tasks currently assigned to ${member.name} on ${project.name}`
                  : 'No tasks match the selected filter'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {memberTasks.length === 0
                  ? `Assign working tasks to ${member.name} under this project to track deliverables, working hours, and progress updates in this table.`
                  : 'Try adjusting your search query or status filter above to find matching deliverables.'}
              </p>
              {onOpenCreateTask && memberTasks.length === 0 && (
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-3 w-12">#</th>
                    <th className="py-3.5 px-3 min-w-[220px]">Task Code & Title</th>
                    <th className="py-3.5 px-3 min-w-[120px]">Work Type</th>
                    <th className="py-3.5 px-3 min-w-[110px]">Module</th>
                    <th className="py-3.5 px-3 min-w-[100px]">Sprint</th>
                    <th className="py-3.5 px-3 min-w-[120px]">Hours (Logged/Est)</th>
                    <th className="py-3.5 px-3 min-w-[110px]">Due Date</th>
                    <th className="py-3.5 px-3 min-w-[140px]">Status (Interactive)</th>
                    <th className="py-3.5 px-3 min-w-[260px]">Latest Work Update / Daily Log</th>
                    <th className="py-3.5 pl-3 pr-6 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task, idx) => {
                    // Latest daily work log for this task
                    const latestLog = task.dailyLogs && task.dailyLogs.length > 0 ? task.dailyLogs[0] : null;

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-indigo-50/30 transition group"
                      >
                        {/* 1. Index */}
                        <td className="py-3.5 pl-6 pr-3 font-mono font-bold text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* 2. Task Code & Title */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1 max-w-xs sm:max-w-sm">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {task.code}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getPriorityBadgeStyle(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 group-hover:text-indigo-600 transition">
                              {task.title}
                            </p>
                          </div>
                        </td>

                        {/* 3. Work Type (Full Work) */}
                        <td className="py-3.5 px-3">
                          {getWorkTypeBadge(task.workType) || (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* 4. Module */}
                        <td className="py-3.5 px-3">
                          {task.module ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Layers className="w-2.5 h-2.5 text-purple-600" />
                              <span className="truncate max-w-[100px]">{task.module}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* 5. Sprint */}
                        <td className="py-3.5 px-3">
                          {task.sprint ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Zap className="w-2.5 h-2.5 text-amber-600" />
                              <span className="truncate max-w-[90px]">{task.sprint}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* 6. Hours (Logged / Est) */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1 font-mono text-xs">
                              <strong className="text-slate-900 font-bold">{task.loggedHours || 0}h</strong>
                              <span className="text-slate-400 text-[10px]">/ {task.estimatedHours || 0}h</span>
                            </div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{
                                  width: `${
                                    task.estimatedHours
                                      ? Math.min(100, Math.round(((task.loggedHours || 0) / task.estimatedHours) * 100))
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 7. Due Date */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{task.dueDate || 'No date'}</span>
                          </div>
                        </td>

                        {/* 8. Status (Interactive Dropdown) */}
                        <td className="py-3.5 px-3">
                          <div className="relative inline-block">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(task.id, e.target.value as TaskItem['status'])
                              }
                              className={`text-[11px] font-bold py-1 pl-2.5 pr-6 rounded-lg border appearance-none cursor-pointer focus:outline-none transition shadow-2xs ${getStatusBadgeStyle(
                                task.status
                              )}`}
                              title="Click to update task status in real time"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="In Review">In Review</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60 text-current" />
                          </div>
                        </td>

                        {/* 9. Latest Work Update / Daily Log */}
                        <td className="py-3.5 px-3">
                          {latestLog ? (
                            <div className="space-y-1 max-w-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>+{latestLog.hoursSpent}h</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {latestLog.date}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 font-medium line-clamp-2 leading-relaxed bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                                {latestLog.description}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-[11px] italic">
                              <span>No updates recorded yet</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTaskForLog(task);
                                  setLogHours(1);
                                  setLogNote('');
                                  setLogNewStatus(task.status);
                                }}
                                className="not-italic text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                              >
                                + Add Log
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaskForLog(task);
                                setLogHours(1);
                                setLogNote('');
                                setLogNewStatus(task.status);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-[11px] transition cursor-pointer border border-slate-200"
                              title="Add working progress update / log hours"
                            >
                              <Plus className="w-3 h-3 text-indigo-600" />
                              <span>Update</span>
                            </button>

                            {onDeleteTask && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove task "${task.title}"?`)) {
                                    onDeleteTask(task.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer Summary */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Showing <strong className="text-slate-800">{filteredTasks.length}</strong> of{' '}
              <strong className="text-slate-800">{memberTasks.length}</strong> tasks allocated to{' '}
              <strong className="text-indigo-600">{member.name}</strong> on {project.name}.
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span>Total Hours: <strong className="text-slate-800">{totalLoggedHours}h</strong></span>
              <span>Est Target: <strong className="text-slate-800">{totalEstHours}h</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAILY WORK LOGS & PROGRESS HISTORY (TABLE FORMAT)                  */}
      {/* ========================================================================= */}
      {activeTab === 'daily-logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Daily Work Logs & Progress History</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Detailed Log Table
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every logged progress note and working hour record for <strong className="text-slate-700">{member.name}</strong> on project{' '}
                <strong className="text-slate-700">{project.name}</strong>.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-600">
              Total Records: <span className="font-mono text-indigo-600">{allDailyLogs.length}</span>
            </div>
          </div>

          {allDailyLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No Daily Work Logs Recorded Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When {member.name} or an admin submits progress updates on assigned tasks, the detailed log timeline will appear here in table format.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('table-updates')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <span>View Tasks to Add Work Update</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-3 w-12">#</th>
                    <th className="py-3.5 px-3 min-w-[110px]">Date / Time</th>
                    <th className="py-3.5 px-3 min-w-[200px]">Related Task</th>
                    <th className="py-3.5 px-3 min-w-[100px]">Hours Logged</th>
                    <th className="py-3.5 px-3 min-w-[280px]">Work Description / Progress Note</th>
                    <th className="py-3.5 px-3 min-w-[120px]">Logged By</th>
                    <th className="py-3.5 pl-3 pr-6 min-w-[110px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDailyLogs.map((log, index) => (
                    <tr key={`${log.id}-${index}`} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 pl-6 pr-3 font-mono font-bold text-slate-400 text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 font-semibold">
                        {log.date}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {log.taskCode}
                          </span>
                          <p className="font-bold text-slate-800 text-xs truncate max-w-xs">{log.taskTitle}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          +{log.hoursSpent}h
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-slate-800 text-xs leading-relaxed font-medium bg-slate-50/50 p-2 rounded-xl border border-slate-100 max-w-lg">
                          {log.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-semibold text-[11px]">
                        {log.loggedBy}
                      </td>
                      <td className="py-3.5 pl-3 pr-6">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeStyle(
                            log.status as TaskItem['status']
                          )}`}
                        >
                          {log.status}
                        </span>
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
      {/* TAB 3: SUPER ADMIN & ADMIN SEND NOTIFICATION SECTION                      */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <span>Send Project Notification & Directive</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Super Admin & Admin Direct
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Send high-priority instructions, milestone directives, or deadline alerts directly to{' '}
                  <strong className="text-slate-800">{member.name}</strong> for{' '}
                  <strong className="text-slate-800">{project.name}</strong>.
                </p>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
                Sender:{' '}
                <strong className="text-slate-800">
                  {currentUser?.full_name || 'Super Admin'} ({currentUser?.role || userRole})
                </strong>
              </div>
            </div>

            {/* Success Alert */}
            {sendSuccessMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{sendSuccessMessage}</span>
              </div>
            )}

            {/* Notification Dispatch Form */}
            <form onSubmit={handleSendNotification} className="space-y-5">
              {/* Category Pills */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  Notification Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { type: 'ALERT', label: 'Priority Alert', icon: AlertCircle, color: 'text-amber-600' },
                    { type: 'ASSIGNMENT', label: 'Work Directive', icon: CheckCircle2, color: 'text-indigo-600' },
                    { type: 'DELIVERY', label: 'Delivery Milestone', icon: Zap, color: 'text-emerald-600' },
                    { type: 'EXTENSION_REQUEST', label: 'Schedule Notice', icon: Clock, color: 'text-purple-600' },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = notifCategory === cat.type;
                    return (
                      <button
                        key={cat.type}
                        type="button"
                        onClick={() => setNotifCategory(cat.type as NotificationItem['type'])}
                        className={`p-3 rounded-2xl border text-left text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
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

              {/* Quick Template Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 mb-1.5 block">
                  Quick Message Starters:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    `Please submit your daily work log for ${project.name}`,
                    `Urgent priority: Complete the assigned sprint tasks before client demo`,
                    `Milestone review scheduled for this week. Please verify module endpoints`,
                    `Code review required for the latest pull request on ${project.code}`,
                  ].map((starter, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNotifMessage(starter)}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition cursor-pointer border border-slate-200"
                    >
                      "{starter.slice(0, 45)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Title */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notification Subject / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. [${project.name}] Action Required: Sprint 1 API Deliverable...`}
                  value={notifSubject}
                  onChange={(e) => setNotifSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Message Details */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Directive Instructions / Message Body *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={`Write the instructions or project update for ${member.name}. E.g.: "Please prioritize the checkout module backend APIs and write unit tests before tomorrow morning."`}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Notification will be tagged to project <strong className="text-slate-700">{project.name}</strong>.
                </span>

                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingNotif ? 'Dispatching...' : `Send Notification to ${member.name}`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Past Notifications Sent to this Person Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Sent Project Notifications History ({memberProjectNotifications.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Directives and notices sent to {member.name} regarding {project.name}.
                </p>
              </div>
            </div>

            {memberProjectNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No notifications sent yet for this project</p>
                <p>Use the form above to dispatch alerts or milestone directives directly to {member.name}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider">
                      <th className="py-3 pl-6 pr-3 w-12">#</th>
                      <th className="py-3 px-3 min-w-[120px]">Timestamp</th>
                      <th className="py-3 px-3 min-w-[120px]">Category</th>
                      <th className="py-3 px-3 min-w-[200px]">Subject</th>
                      <th className="py-3 px-3 min-w-[300px]">Message Body</th>
                      <th className="py-3 px-3 min-w-[140px]">Sender</th>
                      <th className="py-3 pl-3 pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {memberProjectNotifications.map((notif, index) => (
                      <tr key={notif.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 pl-6 pr-3 font-mono font-bold text-slate-400 text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                          {notif.timestamp}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {notif.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 text-xs">
                          {notif.title}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-xs leading-relaxed max-w-md">
                          {notif.message}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] font-semibold">
                          {notif.senderName || 'Super Admin'}{' '}
                          {notif.senderRole ? `(${notif.senderRole})` : ''}
                        </td>
                        <td className="py-3 pl-3 pr-6 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Delivered</span>
                          </span>
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

      {/* ========================================================================= */}
      {/* QUICK WORK UPDATE & LOG HOURS MODAL                                       */}
      {/* ========================================================================= */}
      {selectedTaskForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                  Record Working Update
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">{selectedTaskForLog.title}</h4>
                <p className="text-[11px] text-slate-300 font-mono">
                  {selectedTaskForLog.code} • {member.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskForLog(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveWorkUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Hours Spent */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Hours Spent *
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={logHours}
                    onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Update Status
                  </label>
                  <select
                    value={logNewStatus || selectedTaskForLog.status}
                    onChange={(e) => setLogNewStatus(e.target.value as TaskItem['status'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Progress Note */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Progress Description / Work Update Note *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={`Describe the updates accomplished on this task (e.g. "Completed database migration and connected API endpoints")...`}
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForLog(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/25 transition cursor-pointer"
                >
                  Save Progress Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonDashboardView;
