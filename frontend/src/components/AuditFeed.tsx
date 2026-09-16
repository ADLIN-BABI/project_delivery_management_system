import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { api } from '../api/client';
import { Shield, RefreshCw, ChevronDown, ChevronUp, Clock, Globe } from 'lucide-react';

export const AuditFeed: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(25);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 20000);
    return () => clearInterval(interval);
  }, []);

  const formatAction = (action: string) => {
    if (action.includes('BOOTSTRAP')) return { label: 'Bootstrap Super Admin', color: 'text-purple-400 border-purple-500/30 bg-purple-950/40' };
    if (action.includes('CREATE')) return { label: 'Admin Created', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' };
    if (action.includes('BANNED')) return { label: 'Admin Banned', color: 'text-red-400 border-red-500/30 bg-red-950/40' };
    if (action.includes('ACTIVE')) return { label: 'Admin Activated', color: 'text-blue-400 border-blue-500/30 bg-blue-950/40' };
    if (action.includes('INACTIVE')) return { label: 'Admin Deactivated', color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' };
    if (action.includes('LOGIN')) return { label: 'User Login', color: 'text-slate-300 border-slate-700 bg-slate-800' };
    return { label: action, color: 'text-indigo-300 border-indigo-500/30 bg-indigo-950/40' };
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Security & Action Audit Trail</h3>
            <p className="text-xs text-slate-400">Immutable log of administrative events & state changes</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
        </button>
      </div>

      <div className="mt-3 divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No audit activity recorded yet.</div>
        ) : (
          logs.map((log) => {
            const badge = formatAction(log.action);
            const isExpanded = expandedId === log.id;

            return (
              <div key={log.id} className="py-2.5">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-900/40 px-2 py-1.5 rounded-lg transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    {log.ip_address && (
                      <span className="hidden md:flex items-center gap-1 font-mono">
                        <Globe className="w-3 h-3 text-slate-400" /> {log.ip_address}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Old State</span>
                        <pre className="mt-1 p-2 rounded bg-slate-900 text-amber-300 text-[11px] overflow-x-auto">
                          {log.old_values ? JSON.stringify(log.old_values, null, 2) : 'null'}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">New State</span>
                        <pre className="mt-1 p-2 rounded bg-slate-900 text-emerald-300 text-[11px] overflow-x-auto">
                          {log.new_values ? JSON.stringify(log.new_values, null, 2) : 'null'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
