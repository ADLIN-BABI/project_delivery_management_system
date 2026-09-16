import React from 'react';
import { UserRole, UserStatus } from '../types';
import { ShieldCheck, Shield, User as UserIcon, Ban, PauseCircle } from 'lucide-react';

interface StatusBadgeProps {
  status?: UserStatus;
  role?: UserRole;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, role, size = 'sm' }) => {
  if (role) {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
            <ShieldCheck className={size === 'sm' ? 'w-3.5 h-3.5 text-purple-400' : 'w-4 h-4 text-purple-400'} />
            Super Admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)] ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
            <Shield className={size === 'sm' ? 'w-3.5 h-3.5 text-blue-400' : 'w-4 h-4 text-blue-400'} />
            Admin
          </span>
        );
      case 'EMPLOYEE':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
            <UserIcon className={size === 'sm' ? 'w-3.5 h-3.5 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
            Employee
          </span>
        );
    }
  }

  if (status) {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-emerald-500/30 bg-emerald-950/50 text-emerald-300 ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case 'BANNED':
        return (
          <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border border-red-500/40 bg-red-950/50 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)] ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
            <Ban className={size === 'sm' ? 'w-3.5 h-3.5 text-red-400' : 'w-4 h-4 text-red-400'} />
            Banned
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-slate-600/40 bg-slate-800/60 text-slate-300 ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
            <PauseCircle className={size === 'sm' ? 'w-3.5 h-3.5 text-slate-400' : 'w-4 h-4 text-slate-400'} />
            Inactive
          </span>
        );
    }
  }

  return null;
};
