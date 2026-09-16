import React, { useEffect, useState } from 'react';
import { DatabaseHealth } from '../types';
import { api } from '../api/client';
import { Database, Activity, Server, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export const DatabaseHealthCard: React.FC = () => {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDatabaseHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 shadow-lg shadow-indigo-950/20">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              PostgreSQL 18 Foundation
              {health?.status === 'healthy' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                  Live & Connected
                </span>
              ) : error ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/80 border border-red-500/30 text-red-300">
                  <AlertTriangle className="w-3 h-3 mr-1 text-red-400" />
                  Offline
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                  Connecting...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-mono">Database: project_delivery_db</p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
          title="Refresh database diagnostics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {health?.details ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Query Latency
            </span>
            <p className="text-lg font-bold text-slate-100 font-mono mt-1">
              {health.details.latency_ms} <span className="text-xs font-normal text-slate-400">ms</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Public Tables
            </span>
            <p className="text-lg font-bold text-slate-100 font-mono mt-1">
              {health.details.public_table_count} <span className="text-xs font-normal text-slate-400">tables</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Registered Users</span>
            <p className="text-lg font-bold text-indigo-300 font-mono mt-1">
              {health.details.user_count ?? 0}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400">Pool Size</span>
            <p className="text-lg font-bold text-purple-300 font-mono mt-1">
              {health.details.pool_status?.pool_size ?? 10} <span className="text-xs font-normal text-slate-400">conns</span>
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="mt-3 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300">
          {error}
        </div>
      ) : (
        <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Fetching database metrics...
        </div>
      )}
    </div>
  );
};
