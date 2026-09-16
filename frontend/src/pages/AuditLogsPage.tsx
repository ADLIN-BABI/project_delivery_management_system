import React, { useState } from 'react';
import { AuditLogItem } from '../types';
import {
  Search,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AuditLogsPageProps {
  logs: AuditLogItem[];
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatAction = (action: string) => {
    switch (action) {
      case 'CREATE_PROJECT':
        return { label: 'Project Created', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'STATUS_CHANGE':
        return { label: 'Delivery Status Changed', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'BAN_ADMIN':
        return { label: 'Admin User Banned', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'ASSIGN_TASK':
        return { label: 'Task Assigned', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: action, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          Security & Audit Logs
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
            Super Admin Exclusive
          </span>
        </h2>
        <p className="text-sm text-slate-500">
          Immutable ledger of system administrative actions and data state mutations
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 pr-2">
          {filteredLogs.length} Events Logged
        </span>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        {filteredLogs.map((log) => {
          const badge = formatAction(log.action);
          const isExpanded = expandedId === log.id;

          return (
            <div
              key={log.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Actor: <span className="text-slate-700">{log.actor}</span> • Target: <span className="font-mono text-slate-600">{log.entityType} ({log.entityId})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="hidden sm:flex items-center gap-1 font-mono">
                    <Globe className="w-3.5 h-3.5" />
                    {log.ipAddress}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {log.timestamp}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Previous State (Old Values)
                    </span>
                    <pre className="text-amber-700 overflow-x-auto text-[11px]">
                      {log.oldValues
                        ? JSON.stringify(log.oldValues, null, 2)
                        : 'null (Initial Creation)'}
                    </pre>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Applied State (New Values)
                    </span>
                    <pre className="text-emerald-700 overflow-x-auto text-[11px]">
                      {log.newValues
                        ? JSON.stringify(log.newValues, null, 2)
                        : 'null'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
