import React, { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { TaskItem, AdminUserItem } from '../../types';

interface CreateGeneralTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: TaskItem) => void;
  employeesList?: AdminUserItem[];
}

export const CreateGeneralTaskModal: React.FC<CreateGeneralTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  employeesList = [],
}) => {
  const [title, setTitle] = useState('');
  const [selectedAssigneeEmail, setSelectedAssigneeEmail] = useState<string>(
    employeesList[0]?.email || ''
  );
  const [workType, setWorkType] = useState<TaskItem['workType']>('UI');
  const [priority, setPriority] = useState<TaskItem['priority']>('High');
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [hours, setHours] = useState(16);

  if (!isOpen) return null;

  const selectedEmployee =
    employeesList.find((e) => e.email === selectedAssigneeEmail) || employeesList[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      workType,
      assignee: {
        name: selectedEmployee ? selectedEmployee.name : (employeesList[0]?.name || 'Admin User'),
        avatar: selectedEmployee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: selectedEmployee?.role === 'EMPLOYEE' ? 'Team Member' : 'Admin',
      },
      status: 'To Do',
      priority,
      dueDate,
      estimatedHours: hours,
      loggedHours: 0,
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Assign General Task</h3>
              <p className="text-xs text-slate-500">Allocate general work items to dynamic employees</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
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

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Assignee (Dynamic Employee List)
            </label>
            <select
              value={selectedAssigneeEmail}
              onChange={(e) => setSelectedAssigneeEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-white"
            >
              {employeesList.map((emp) => (
                <option key={emp.id} value={emp.email}>
                  {emp.name} — {emp.role} ({emp.email})
                </option>
              ))}
            </select>

            {/* Live selected employee preview */}
            {selectedEmployee && (
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5 text-xs">
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.name}
                  className="w-6 h-6 rounded-full object-cover border border-emerald-300"
                />
                <span className="font-semibold text-emerald-950">{selectedEmployee.name}</span>
                <span className="text-[10px] font-mono text-emerald-700">({selectedEmployee.role})</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Type
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as TaskItem['workType'])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="UI">UI / Design</option>
                <option value="API">API Integration</option>
                <option value="BACKEND">Backend</option>
                <option value="FRONTEND">Frontend</option>
                <option value="DATABASE">Database</option>
                <option value="TESTING">Testing / QA</option>
                <option value="BUG_FIX">Bug Fix</option>
                <option value="DOCUMENTATION">Documentation</option>
              </select>
            </div>

            <div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                min={getTodayStr()}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 transition"
            >
              Create General Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGeneralTaskModal;
