import React, { useState } from 'react';
import { NotificationItem } from '../types';
import {
  CheckCheck,
  Clock,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Calendar,
  XCircle,
} from 'lucide-react';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onApproveExtension: (notifId: string) => void;
  onRejectExtension: (notifId: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onMarkAllRead,
  onApproveExtension,
  onRejectExtension,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredNotifications = notifications.filter(
    (n) => filterType === 'ALL' || n.type === filterType
  );

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ALERT':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'DELIVERY':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'EXTENSION_REQUEST':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'ASSIGNMENT':
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Notifications & Escalation Center
          </h2>
          <p className="text-sm text-slate-500">
            System alerts, delivery updates, and deadline extension approvals
          </p>
        </div>

        <button
          onClick={onMarkAllRead}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Notifications' },
          { id: 'ALERT', label: 'Urgent Alerts' },
          { id: 'EXTENSION_REQUEST', label: 'Extension Requests' },
          { id: 'DELIVERY', label: 'Delivery Dispatches' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No notifications in this category.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition ${
                !notif.isRead ? 'bg-blue-50/30 -mx-6 px-6 rounded-xl' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{notif.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons if Extension Request */}
              {notif.type === 'EXTENSION_REQUEST' && (
                <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:self-center">
                  <button
                    onClick={() => onApproveExtension(notif.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => onRejectExtension(notif.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
