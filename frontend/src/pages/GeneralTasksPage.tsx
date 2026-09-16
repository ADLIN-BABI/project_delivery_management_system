import React, { useState } from 'react';
import { TaskItem, AdminUserItem } from '../types';
import {
  Search,
  CheckSquare,
  Clock,
} from 'lucide-react';

interface GeneralTasksPageProps {
  tasks: TaskItem[];
  onOpenCreateTask: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskItem['status']) => void;
  userRole?: string;
  currentUser?: any;
  adminsList?: AdminUserItem[];
  onAddTask?: (task: TaskItem, sendNotification: boolean) => void;
  onUpdateTask?: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
  onSendNotification?: (notif: {
    title: string;
    message: string;
    type: any;
    relatedEntityId?: string;
    senderName?: string;
    senderRole?: string;
  }) => void;
}

export const GeneralTasksPage: React.FC<GeneralTasksPageProps> = ({
  tasks,
  onUpdateTaskStatus,
  userRole,
  currentUser,
  adminsList = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSendNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for creating general tasks
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [priority, setPriority] = useState<TaskItem['priority']>('Medium');
  const [selectedAssigneeEmail, setSelectedAssigneeEmail] = useState<string>('');
  const [sendNotification, setSendNotification] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [notificationTaskId, setNotificationTaskId] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Default selection
  React.useEffect(() => {
    if (adminsList.length > 0 && !selectedAssigneeEmail) {
      setSelectedAssigneeEmail(adminsList[0].email);
    }
  }, [adminsList, selectedAssigneeEmail]);

  const canAssignTasks = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const filteredTasks = tasks.filter((t) => {
    // General tasks do not have a project assigned
    const isGeneralTask = !t.project;

    // If user is employee, only show tasks assigned to them
    const isAssignedToUser = userRole === 'EMPLOYEE' && currentUser
      ? (t.assignee.email === currentUser.email || t.assignee.name === currentUser.full_name)
      : true;

    return (
      isGeneralTask &&
      isAssignedToUser &&
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const getPriorityBadge = (p: TaskItem['priority']) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'High':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Low':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedEmployee = adminsList.find((e) => e.email === selectedAssigneeEmail) || adminsList[0];

    if (editingTaskId && onUpdateTask) {
      const taskToUpdate = tasks.find((t) => t.id === editingTaskId);
      if (!taskToUpdate) return;
      onUpdateTask({
        ...taskToUpdate,
        title: title.trim(),
        description: description.trim(),
        priority,
        startDate,
        dueDate,
        assignee: {
          name: selectedEmployee ? selectedEmployee.name : 'Admin User',
          avatar: selectedEmployee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: selectedEmployee?.role === 'EMPLOYEE' ? 'Team Member' : 'Admin',
          email: selectedEmployee?.email,
        }
      });
    } else if (onAddTask) {
      const newTask: TaskItem = {
        id: `gt-${Date.now()}`,
        code: `GT-${Math.floor(100 + Math.random() * 900)}`,
        title: title.trim(),
        description: description.trim(),
        workType: 'General' as any,
        assignee: {
          name: selectedEmployee ? selectedEmployee.name : 'Admin User',
          avatar: selectedEmployee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: selectedEmployee?.role === 'EMPLOYEE' ? 'Team Member' : 'Admin',
          email: selectedEmployee?.email,
        },
        status: 'To Do',
        priority,
        startDate,
        dueDate,
        estimatedHours: 8,
        loggedHours: 0,
      };
      onAddTask(newTask, sendNotification);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setStartDate('');
    setDueDate('');
    setEditingTaskId(null);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setStartDate(task.startDate || '');
    setDueDate(task.dueDate || '');
    setPriority(task.priority);
    setSelectedAssigneeEmail(task.assignee.email || adminsList[0]?.email || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setDueDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* <div> */}
        {/* <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            General Tasks Portal
          </h2> */}
        {/* <p className="text-sm text-slate-500">
            Track daily assignments, sprint tickets, and operational work
          </p> */}
        {/* </div> */}
      </div>

      {/* General Task Creation Panel (Only for Admin/SuperAdmin) */}
      {canAssignTasks && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingTaskId ? 'Update General Task' : 'Assign General Task'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingTaskId ? 'Modify existing task details' : 'Create a task and assign it to an employee'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Row 1 */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Update UI Component Design System"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignee
                </label>
                <select
                  required
                  value={selectedAssigneeEmail}
                  onChange={(e) => setSelectedAssigneeEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="" disabled>Select Employee...</option>
                  {adminsList.map((emp) => (
                    <option key={emp.id} value={emp.email}>
                      {emp.name} — {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 2 */}
              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe the task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Row 3 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  min={getTodayStr()}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  min={startDate || getTodayStr()}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskItem['priority'])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Checkbox and Submit */}
              <div className="col-span-1 md:col-span-3 flex items-center justify-between pt-2">
                {!editingTaskId ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendNotification}
                      onChange={(e) => setSendNotification(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Send notification to particular employee
                    </span>
                  </label>
                ) : <div />}

                <div className="flex gap-2">
                  {editingTaskId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition"
                  >
                    {editingTaskId ? 'Update Task' : 'Assign Task'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search task title, code, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Vertical Table Format */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-4">Task Code</th>
                <th className="py-4 px-4 min-w-[150px]">Task Details</th>
                <th className="py-4 px-4">Assignee</th>
                <th className="py-4 px-4">Timeline</th>
                <th className="py-4 px-4">Priority</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No general tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 align-top">
                      <span className="font-mono font-bold text-blue-600">
                        {t.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 align-top min-w-[200px] whitespace-normal">
                      <div className="font-bold text-slate-900 text-sm mb-1">{t.title}</div>
                      {t.description && (
                        <div className="text-slate-500 text-xs line-clamp-2">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={t.assignee.avatar}
                          alt={t.assignee.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold text-xs">
                            {t.assignee.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {t.assignee.role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span className="font-medium text-slate-500 w-10">Start:</span>
                          <span className="font-semibold text-slate-700">{t.startDate || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-red-500" />
                          <span className="font-medium text-slate-500 w-10">End:</span>
                          <span className="font-semibold text-slate-700">{t.dueDate || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          onUpdateTaskStatus(t.id, e.target.value as TaskItem['status'])
                        }
                        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="In Review">In Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    {canAssignTasks ? (
                      <td className="py-4 px-4 align-top text-right space-x-2">
                        <button
                          onClick={() => handleEditTask(t)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-bold tracking-wide uppercase transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this task?')) {
                              onDeleteTask?.(t.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-bold tracking-wide uppercase transition"
                        >
                          Delete
                        </button>
                      </td>
                    ) : (
                      <td className="py-4 px-4 align-top text-right space-x-2">
                        <button
                          onClick={() => setNotificationTaskId(t.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-bold tracking-wide uppercase transition"
                        >
                          Send Update
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Update Modal for Employees */}
      {notificationTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Send Task Update</h3>
            <p className="text-xs text-slate-500 mb-4">Type your update below to notify the administrators.</p>
            <textarea
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 resize-none"
              rows={4}
              placeholder="e.g. I have completed the first draft and pushed the code..."
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
            ></textarea>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setNotificationTaskId(null);
                  setNotificationMessage('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const t = tasks.find(x => x.id === notificationTaskId);
                  if (t && onSendNotification && currentUser) {
                    onSendNotification({
                      title: `Update on General Task: ${t.code}`,
                      message: notificationMessage,
                      type: 'ALERT',
                      relatedEntityId: t.id,
                      senderName: currentUser.full_name,
                      senderRole: currentUser.role,
                    });
                  }
                  setNotificationTaskId(null);
                  setNotificationMessage('');
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralTasksPage;
