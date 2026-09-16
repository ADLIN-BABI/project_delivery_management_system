import React, { useState } from 'react';
import {
  Building,
  Layers,
  Globe,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [orgName, setOrgName] = useState('DeliveryManager Global Systems');
  const [supportEmail, setSupportEmail] = useState('support@wenoxo.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const subPortals = [
    { name: 'Admin Portal', code: 'ADMIN_PORTAL', active: true, desc: 'Central management for administrators' },
    { name: 'Client Portal', code: 'CLIENT_PORTAL', active: true, desc: 'Client milestone approvals and review' },
    { name: 'Employee Portal', code: 'EMPLOYEE_PORTAL', active: true, desc: 'Daily time tracking & ticket progress' },
    { name: 'Vendor Portal', code: 'VENDOR_PORTAL', active: true, desc: 'Third-party supplier and contract management' },
    { name: 'User Portal', code: 'USER_PORTAL', active: true, desc: 'End-user self-service interface' },
  ];

  const platforms = [
    { name: 'Web Application', code: 'WEB', active: true },
    { name: 'Mobile (Android & iOS)', code: 'MOBILE', active: true },
    { name: 'REST & GraphQL API', code: 'API', active: true },
    { name: 'Desktop Application', code: 'DESKTOP', active: true },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System & Portal Settings
          </h2>
          <p className="text-sm text-slate-500">
            Configure enterprise parameters, platforms, and sub-portal routing
          </p>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Settings Saved
          </span>
        )}
      </div>

      {/* Organization Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Organization Profile</h3>
            <p className="text-xs text-slate-500">Global system identity and primary contacts</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support & Escalation Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition"
            >
              <Save className="w-4 h-4" />
              Save Organization Profile
            </button>
          </div>
        </form>
      </div>

      {/* Sub-Portals List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Supported Sub-Portals</h3>
            <p className="text-xs text-slate-500">Multi-tenant role interface entrypoints</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {subPortals.map((portal) => (
            <div
              key={portal.code}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{portal.name}</h4>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    {portal.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{portal.desc}</p>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Enabled
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Platforms */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delivery Platforms</h3>
            <p className="text-xs text-slate-500">Supported runtime delivery environments</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {platforms.map((plat) => (
            <div
              key={plat.code}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-1"
            >
              <span className="font-mono text-xs font-bold text-teal-700">{plat.code}</span>
              <p className="text-xs font-semibold text-slate-800">{plat.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
