import React, { useState } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';
import { TaskItem } from '../../types';

interface RequestExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onRequestExtension: (taskId: string, extraDays: number, reason: string) => void;
}

export const RequestExtensionModal: React.FC<RequestExtensionModalProps> = ({
  isOpen,
  onClose,
  task,
  onRequestExtension,
}) => {
  const [extraDays, setExtraDays] = useState(2);
  const [reason, setReason] = useState('');

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestExtension(task.id, extraDays, reason.trim() || 'Required extra testing for edge cases');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Deadline Extension</h3>
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
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              This request will be sent directly to your <strong>Super Admin & Project Lead</strong> for approval in their notifications queue.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Extension Days Needed
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 2, 3, 5].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setExtraDays(d)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                    extraDays === d
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  +{d} days
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={14}
              required
              value={extraDays}
              onChange={(e) => setExtraDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Encountered third-party payment gateway webhook throttling, need additional 2 days to test sandbox retry policies."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/25 transition"
            >
              Submit Extension Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
