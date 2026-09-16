import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Search,
  FolderKanban,
  Edit2,
  Trash2,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Briefcase,
} from 'lucide-react';
import { ProjectItem, MasterPlanItem, TaskItem } from '../types';

interface MasterPlanPageProps {
  projects: ProjectItem[];
  tasks?: TaskItem[];
  masterPlans: MasterPlanItem[];
  onCreateMasterPlan: (data: { project_id?: string; project_name?: string; work_type: string }) => Promise<void>;
  onUpdateMasterPlan: (id: string, data: { project_id?: string; project_name?: string; work_type: string }) => Promise<void>;
  onDeleteMasterPlan: (id: string) => Promise<void>;
  onNavigateToProjectTasks: (projectName?: string) => void;
  onOpenAssignProjectTasks: () => void;
}

export const MasterPlanPage: React.FC<MasterPlanPageProps> = ({
  projects,
  tasks = [],
  masterPlans,
  onCreateMasterPlan,
  onUpdateMasterPlan,
  onDeleteMasterPlan,
  onNavigateToProjectTasks,
  onOpenAssignProjectTasks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MasterPlanItem | null>(null);
  const [modalWorkType, setModalWorkType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete Confirm State
  const [planToDelete, setPlanToDelete] = useState<MasterPlanItem | null>(null);

  // Helper to determine which projects are using or associated with a Master Plan work type
  const getProjectsForPlan = (plan: MasterPlanItem): ProjectItem[] => {
    const list: ProjectItem[] = [];
    const addedIds = new Set<string>();

    // 1. Check tasks created in PostgreSQL that use this workType
    if (tasks && tasks.length > 0) {
      tasks.forEach((t) => {
        if (
          (t.workType && t.workType.toLowerCase() === plan.workType.toLowerCase()) ||
          (t.title && t.title.toLowerCase().includes(plan.workType.toLowerCase()))
        ) {
          const p = projects.find(
            (proj) =>
              proj.name.toLowerCase() === (t.project || '').toLowerCase() ||
              proj.id === t.project
          );
          if (p && !addedIds.has(p.id)) {
            addedIds.add(p.id);
            list.push(p);
          }
        }
      });
    }

    // 2. If plan has an explicit projectName (from earlier records), include it as well
    if (plan.projectName) {
      const p = projects.find(
        (proj) =>
          proj.name.toLowerCase() === plan.projectName?.toLowerCase() ||
          proj.id === plan.projectId
      );
      if (p && !addedIds.has(p.id)) {
        addedIds.add(p.id);
        list.push(p);
      }
    }

    return list;
  };

  // Filtered Master Plans
  const filteredPlans = useMemo(() => {
    return masterPlans.filter((plan) => {
      const usedProjects = getProjectsForPlan(plan);
      const usedProjectNames = usedProjects.map((p) => p.name.toLowerCase()).join(' ');

      const matchesSearch =
        (plan.workType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plan.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        usedProjectNames.includes(searchQuery.toLowerCase());

      const matchesProject =
        selectedProjectFilter === 'ALL' ||
        usedProjects.some(
          (p) =>
            p.name.toLowerCase() === selectedProjectFilter.toLowerCase() ||
            p.id === selectedProjectFilter
        ) ||
        (plan.projectName &&
          plan.projectName.toLowerCase() === selectedProjectFilter.toLowerCase());

      return matchesSearch && matchesProject;
    });
  }, [masterPlans, searchQuery, selectedProjectFilter, tasks, projects]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setModalWorkType('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: MasterPlanItem) => {
    setEditingPlan(plan);
    setModalWorkType(plan.workType);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalWorkType.trim()) {
      setErrorMsg('Please enter Work Type / Full Work in text format.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingPlan) {
        await onUpdateMasterPlan(editingPlan.id, {
          work_type: modalWorkType.trim(),
        });
      } else {
        await onCreateMasterPlan({
          work_type: modalWorkType.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save Master Plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;
    try {
      await onDeleteMasterPlan(planToDelete.id);
      setPlanToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete Master Plan.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Target className="w-7 h-7 text-indigo-600" />
            Master Plan
          </h2>
          <p className="text-sm text-slate-500">
            Define Work Type / Full Work connected directly to Assign Project Tasks in click-and-select format.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAssignProjectTasks}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-xs transition"
          >
            <FolderKanban className="w-4 h-4 text-indigo-600" />
            Assign Project Tasks
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Create Master Plan
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by work type or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project:</span>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.name}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium self-end md:self-center">
          Showing <span className="font-bold text-slate-900">{filteredPlans.length}</span> master plan {filteredPlans.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Master Plan Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPlans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Master Plans Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedProjectFilter !== 'ALL'
                ? 'No master plans match your filter criteria. Try clearing the filter.'
                : 'Create your first Master Plan entry to connect Work Type / Full Work directly to Assign Project Tasks.'}
            </p>
            {!(searchQuery || selectedProjectFilter !== 'ALL') && (
              <button
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Create Master Plan
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Work Type / Full Work (Text Format)</th>
                  <th className="py-3.5 px-4">Which Projects (Click to View Tasks)</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlans.map((plan, idx) => {
                  const usedProjects = getProjectsForPlan(plan);
                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/60 transition group">
                      {/* Index */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono font-medium">{idx + 1}</td>

                      {/* Work Type / Full Work */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-950 font-bold text-xs shadow-2xs">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>{plan.workType}</span>
                        </div>
                      </td>

                      {/* Which Projects (Clickable) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {usedProjects.length > 0 ? (
                            usedProjects.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => onNavigateToProjectTasks(p.name)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 font-bold text-xs border border-blue-200 transition group/pbtn cursor-pointer"
                                title={`Click to view tasks for project: ${p.name}`}
                              >
                                <Briefcase className="w-3.5 h-3.5 text-blue-600 group-hover/pbtn:text-blue-800 flex-shrink-0" />
                                <span>{p.name}</span>
                                <ExternalLink className="w-3 h-3 opacity-60 group-hover/pbtn:opacity-100 transition" />
                              </button>
                            ))
                          ) : plan.projectName ? (
                            <button
                              type="button"
                              onClick={() => onNavigateToProjectTasks(plan.projectName!)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 font-bold text-xs border border-blue-200 transition group/pbtn cursor-pointer"
                              title={`Click to view tasks for project: ${plan.projectName}`}
                            >
                              <Briefcase className="w-3.5 h-3.5 text-blue-600 group-hover/pbtn:text-blue-800 flex-shrink-0" />
                              <span>{plan.projectName}</span>
                              <ExternalLink className="w-3 h-3 opacity-60 group-hover/pbtn:opacity-100 transition" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={onOpenAssignProjectTasks}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-semibold border border-slate-200 hover:border-indigo-200 transition cursor-pointer"
                              title="Ready for all projects - Click to assign in Assign Project Tasks"
                            >
                              <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                              <span>All Projects (Click to Assign)</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(plan)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Master Plan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPlanToDelete(plan)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Master Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal (WITHOUT project section as requested) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPlan ? 'Edit Master Plan' : 'Create Master Plan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connected directly to Assign Project Tasks (Work Type / Full Work)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Work Type / Full Work (Text format) ONLY */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Type / Full Work (Text Format) *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Frontend & UI Engineering, Backend API Core Systems, QA Automation..."
                  value={modalWorkType}
                  onChange={(e) => setModalWorkType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  This work type will appear in clickable selection format inside Assign Project Tasks.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : editingPlan ? 'Update Master Plan' : 'Save Master Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Master Plan Entry?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to remove <span className="font-bold text-slate-800">"{planToDelete.workType}"</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterPlanPage;
