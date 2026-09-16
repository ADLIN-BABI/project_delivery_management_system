import React, { useState } from 'react';
import { ClientItem } from '../types';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  Building,
} from 'lucide-react';
import { EditClientModal } from '../components/modals/EditClientModal';

interface ClientsPageProps {
  clients: ClientItem[];
  onOpenAddClient: () => void;
  onUpdateClient?: (client: ClientItem) => void;
  onDeleteClient?: (clientId: string) => void;
  userRole?: string;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  clients,
  onOpenAddClient,
  onUpdateClient,
  onDeleteClient,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);

  const canEdit = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const filteredClients = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Clients Directory
          </h2>
          <p className="text-sm text-slate-500">
            Enterprise clients, points of contact, and project engagements
          </p>
        </div>

        <button
          onClick={onOpenAddClient}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, contact person, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 pr-2">
          {filteredClients.length} Organizations
        </span>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4 text-center">Active Projects</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/70 transition group">
                  {/* Organization */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm leading-tight">
                        {client.companyName}
                      </p>
                    </div>
                  </td>

                  {/* Contact Person */}
                  <td className="py-4 px-4 font-semibold text-slate-700">
                    {client.contactPerson}
                  </td>

                  {/* Contact Details */}
                  <td className="py-4 px-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{client.address}</span>
                    </div>
                  </td>

                  {/* Active Projects */}
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold border border-teal-200">
                      <FolderKanban className="w-3.5 h-3.5" />
                      {client.activeProjects}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${client.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                    >
                      {client.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right space-x-2">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => {
                            setEditingClient(client);
                            setIsEditClientOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-bold tracking-wide uppercase transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this client?')) {
                              onDeleteClient?.(client.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-bold tracking-wide uppercase transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Building className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Clients Found</h4>
              <p className="text-xs text-slate-400">Try a different search or add a new client.</p>
            </div>
          )}
        </div>
      </div>
      {/* Modals */}
      {editingClient && onUpdateClient && (
        <EditClientModal
          isOpen={isEditClientOpen}
          onClose={() => {
            setIsEditClientOpen(false);
            setEditingClient(null);
          }}
          onUpdateClient={onUpdateClient}
          initialData={editingClient}
        />
      )}
    </div>
  );
};

export default ClientsPage;
