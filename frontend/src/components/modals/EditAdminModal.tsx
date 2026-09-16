import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  User,
  Trash2,
  CheckCircle2,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import { AdminUserItem } from '../../types';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminUserItem | null;
  onUpdateAdmin: (updated: AdminUserItem) => void;
  onDeleteAdmin?: (adminId: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

export const EditAdminModal: React.FC<EditAdminModalProps> = ({
  isOpen,
  onClose,
  admin,
  onUpdateAdmin,
  onDeleteAdmin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AdminUserItem['role']>('ADMIN');
  const [status, setStatus] = useState<AdminUserItem['status']>('ACTIVE');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setEmail(admin.email || '');
      setPhone(admin.phone || '');
      setRole(admin.role || 'EMPLOYEE');
      setStatus(admin.status || 'ACTIVE');
      setAvatar(admin.avatar || AVATAR_PRESETS[0]);
      setPassword('');
      setError(null);
      setConfirmDelete(false);
    }
  }, [admin, isOpen]);

  if (!isOpen || !admin) return null;

  const isSuper = admin.role === 'SUPER_ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please fill in both Full Name and Email Address.');
      return;
    }

    if (password.trim() && password.trim().length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    const updated: AdminUserItem = {
      ...admin,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+1 (555) 000-1111',
      role,
      status,
      avatar: avatar.trim() || AVATAR_PRESETS[0],
      password: password.trim() ? password.trim() : admin.password,
    };

    onUpdateAdmin(updated);
    onClose();
  };

  const handleDelete = () => {
    if (!onDeleteAdmin) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteAdmin(admin.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-hidden"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={avatar || AVATAR_PRESETS[0]}
                alt={name || 'User'}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-400/50 shadow-md"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                status === 'ACTIVE' ? 'bg-emerald-400' : status === 'BANNED' ? 'bg-red-400' : 'bg-slate-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">
                  Edit Administrator / User
                </h3>
                {isSuper && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Root User
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200 font-mono mt-0.5">
                {admin.email} • ID: {admin.id}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="user@wenoxo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Role Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldCheck, color: 'purple' },
                { id: 'ADMIN', label: 'Admin', icon: Shield, color: 'blue' },
                { id: 'EMPLOYEE', label: 'Employee', icon: User, color: 'emerald' },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as AdminUserItem['role'])}
                    className={`p-3 rounded-2xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? r.color === 'purple'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25 ring-2 ring-purple-400/20'
                          : r.color === 'blue'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/20'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Account Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ACTIVE', 'INACTIVE', 'BANNED'] as AdminUserItem['status'][]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    status === st
                      ? st === 'ACTIVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : st === 'BANNED'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-slate-700 text-white border-slate-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    st === 'ACTIVE' ? 'bg-emerald-400' : st === 'BANNED' ? 'bg-red-400' : 'bg-slate-400'
                  }`} />
                  <span>{st}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Change Password (Optional) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Reset / Change Password</span>
              </label>
              <span className="text-[10px] text-slate-400 italic">Optional</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Leave blank to keep existing password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Enter 6+ characters to update this user's login secret in PostgreSQL database.
            </p>
          </div>

          {/* Avatar Preset Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Profile Avatar</span>
              <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Select Preset
              </span>
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(preset)}
                  className={`relative p-0.5 rounded-2xl border-2 transition shrink-0 ${
                    avatar === preset ? 'border-purple-600 ring-2 ring-purple-400/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={preset}
                    alt={`Preset ${idx + 1}`}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  {avatar === preset && (
                    <div className="absolute inset-0 bg-purple-600/20 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-purple-700 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <input
              type="url"
              placeholder="Or paste custom image URL..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {onDeleteAdmin && !isSuper ? (
              <button
                type="button"
                onClick={handleDelete}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  confirmDelete
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/25'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmDelete ? 'Confirm Permanent Delete?' : 'Delete User'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition shadow-md shadow-purple-600/25 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
