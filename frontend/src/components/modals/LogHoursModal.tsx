import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { TaskItem } from '../../types';

interface LogHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onLogHours: (taskId: string, hours: number, note: string) => void;
}

export const LogHoursModal: React.FC<LogHoursModalProps> = ({
  isOpen,
  onClose,
  task,
  onLogHours,
}) => {
  const [hours, setHours] = useState(2);
  const [note, setNote] = useState('');

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogHours(task.id, hours, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Log Work Hours</h3>
              <p className="text-xs text-slate-500 font-mono">{task.code}: {task.title.slice(0, 30)}...</p>
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
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <span>Current Logged Time:</span>
            <strong className="text-slate-900 font-mono text-sm">{task.loggedHours} hrs / {task.estimatedHours} hrs est</strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hours Spent Today
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 2, 4, 8].map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHours(h)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                    hours === h
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  +{h} hrs
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0.5}
              max={24}
              step={0.5}
              required
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Activity Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Implemented JWT token generation and bcrypt password validation."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition"
            >
              Submit Time Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
