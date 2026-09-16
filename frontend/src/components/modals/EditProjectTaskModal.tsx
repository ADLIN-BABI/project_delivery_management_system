import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Calendar,
  Code,
  User,
  CheckCircle2,
  Layers,
  Plus,
  Target,
} from 'lucide-react';
import { TaskItem, AdminUserItem, ProjectItem, MasterPlanItem } from '../../types';

interface EditProjectTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onUpdateTask: (task: TaskItem) => void;
  adminsList?: AdminUserItem[];
  projects?: ProjectItem[];
  masterPlans?: MasterPlanItem[];
  onUpdateProject?: (project: ProjectItem) => void;
}

export const EditProjectTaskModal: React.FC<EditProjectTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onUpdateTask,
  adminsList = [],
  projects = [],
  onUpdateProject,
}) => {
  const [title, setTitle] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [workType, setWorkType] = useState<string>('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [status, setStatus] = useState<TaskItem['status']>('To Do');
  const [priority, setPriority] = useState<TaskItem['priority']>('High');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(16);
  const [loggedHours, setLoggedHours] = useState(0);

  // Quick add local states
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');

  const [isAddingSprint, setIsAddingSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');

  const [isAddingWorkType, setIsAddingWorkType] = useState(false);
  const [newWorkTypeName, setNewWorkTypeName] = useState('');

  // Find the exact project this task belongs to
  const currentProject = React.useMemo(() => {
    if (!task) return null;
    return (
      projects.find(
        (p) =>
          (task.project && p.name.trim().toLowerCase() === task.project.trim().toLowerCase()) ||
          (task.project && p.code.trim().toLowerCase() === task.project.trim().toLowerCase()) ||
          p.id === task.project
      ) || null
    );
  }, [projects, task]);

  // Modules stored in database for THIS project ONLY
  const availableModules = React.useMemo(() => {
    const list = [...(currentProject?.modules || [])];
    if (task?.module && !list.includes(task.module)) {
      list.unshift(task.module);
    }
    return list;
  }, [currentProject?.modules, task?.module]);

  // Sprints stored in database for THIS project ONLY
  const availableSprints = React.useMemo(() => {
    const list = (currentProject?.sprints || []).map((s) => s.name);
    if (task?.sprint && !list.includes(task.sprint)) {
      list.unshift(task.sprint);
    }
    return list;
  }, [currentProject?.sprints, task?.sprint]);

  // Work Types stored in database for THIS project ONLY
  const availableWorkTypes = React.useMemo(() => {
    const list = [...(currentProject?.workTypes || [])];
    if (task?.workType && !list.includes(task.workType)) {
      list.unshift(task.workType);
    }
    return list;
  }, [currentProject?.workTypes, task?.workType]);

  // Combine dynamic employees from database
  const availableEmployees = React.useMemo(() => {
    return adminsList
      .filter((adm) => adm.status === 'ACTIVE' || adm.status !== 'BANNED')
      .map((adm) => ({
        name: adm.name,
        role: adm.role === 'SUPER_ADMIN' ? 'Super Admin' : adm.role === 'ADMIN' ? 'Project Lead' : 'Team Member',
        avatar: adm.avatar,
        email: adm.email,
      }));
  }, [adminsList]);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setModuleName(task.module || '');
      setSprintName(task.sprint || '');
      setWorkType(task.workType || '');
      setStatus(task.status || 'To Do');
      setPriority(task.priority || 'High');
      const today = getTodayStr();
      setDueDate(task.dueDate && task.dueDate >= today ? task.dueDate : today);
      setEstimatedHours(task.estimatedHours || 16);
      setLoggedHours(task.loggedHours || 0);

      const matchedEmp = availableEmployees.find(
        (e) => e.name.toLowerCase() === (task.assignee?.name || '').toLowerCase()
      );
      setAssigneeEmail(matchedEmp ? matchedEmp.email : (availableEmployees[0]?.email || ''));
    }
  }, [task, availableEmployees]);

  if (!isOpen || !task) return null;

  const selectedEmployee =
    availableEmployees.find((e) => e.email === assigneeEmail) ||
    availableEmployees[0] || {
      name: task?.assignee?.name || 'Team Member',
      avatar: task?.assignee?.avatar || '',
      role: task?.assignee?.role || 'Developer',
      email: '',
    };

  const handleAddModule = () => {
    const val = newModuleName.trim();
    if (!val || !currentProject) return;
    const currentList = currentProject.modules || [];
    if (!currentList.includes(val)) {
      const updated = [...currentList, val];
      currentProject.modules = updated;
      if (onUpdateProject) {
        onUpdateProject({ ...currentProject, modules: updated });
      }
    }
    setModuleName(val);
    setNewModuleName('');
    setIsAddingModule(false);
  };

  const handleAddSprint = () => {
    const val = newSprintName.trim();
    if (!val || !currentProject) return;
    const currentList = currentProject.sprints || [];
    if (!currentList.some((s) => s.name.toLowerCase() === val.toLowerCase())) {
      const newSp = {
        id: `sp-${Date.now()}`,
        name: val,
        status: 'Active' as const,
      };
      const updated = [...currentList, newSp];
      currentProject.sprints = updated;
      if (onUpdateProject) {
        onUpdateProject({ ...currentProject, sprints: updated });
      }
    }
    setSprintName(val);
    setNewSprintName('');
    setIsAddingSprint(false);
  };

  const handleAddWorkType = () => {
    const val = newWorkTypeName.trim();
    if (!val || !currentProject) return;
    const currentList = currentProject.workTypes || [];
    if (!currentList.includes(val)) {
      const updated = [...currentList, val];
      currentProject.workTypes = updated;
      if (onUpdateProject) {
        onUpdateProject({ ...currentProject, workTypes: updated });
      }
    }
    setWorkType(val);
    setNewWorkTypeName('');
    setIsAddingWorkType(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: TaskItem = {
      ...task,
      title: title.trim(),
      module: moduleName.trim() ? moduleName.trim() : undefined,
      sprint: sprintName.trim() ? sprintName.trim() : undefined,
      workType: workType.trim() ? workType.trim() : undefined,
      status,
      priority,
      dueDate,
      estimatedHours,
      loggedHours,
      assignee: {
        name: selectedEmployee.name,
        avatar: selectedEmployee.avatar,
        role: selectedEmployee.role,
        email: selectedEmployee.email,
      },
      developerDeadline: `${dueDate}T18:00:00Z`,
    };

    onUpdateTask(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Assigned Task</h3>
              <p className="text-xs text-slate-500 font-mono">
                {task.code} • Project: {task.project}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Module & Sprint (Only what was added by admin to this project) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Module Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-blue-600" />
                  Module ({availableModules.length})
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingModule(!isAddingModule)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Module
                </button>
              </div>

              {isAddingModule && (
                <div className="mb-2 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New Module name..."
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddModule();
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-blue-300 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              {availableModules.length > 0 ? (
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                >
                  <option value="">— None / Unassigned —</option>
                  {availableModules.map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                  No modules added to this project yet.
                </div>
              )}
            </div>

            {/* Sprint Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                  Sprint / Strip ({availableSprints.length})
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingSprint(!isAddingSprint)}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Sprint
                </button>
              </div>

              {isAddingSprint && (
                <div className="mb-2 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New Sprint name..."
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSprint();
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-orange-300 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSprint}
                    className="px-2.5 py-1 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              {availableSprints.length > 0 ? (
                <select
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                >
                  <option value="">— None / Unassigned —</option>
                  {availableSprints.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                  No sprints added to this project yet.
                </div>
              )}
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Assign To Employee *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                {availableEmployees.length > 0 ? (
                  availableEmployees.map((emp) => (
                    <option key={emp.email} value={emp.email}>
                      {emp.name} ({emp.role})
                    </option>
                  ))
                ) : (
                  <option value="">No employees found in database</option>
                )}
              </select>

              {selectedEmployee && (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-300"
                  />
                  <div>
                    <p className="font-bold text-emerald-950">{selectedEmployee.name}</p>
                    <p className="text-[10px] text-emerald-700">{selectedEmployee.role}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status, Priority & Work Type (Only project-specific work types) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskItem['status'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskItem['priority'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-600" />
                  Work Type ({availableWorkTypes.length})
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingWorkType(!isAddingWorkType)}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {isAddingWorkType && (
                <div className="mb-2 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="New Work Type..."
                    value={newWorkTypeName}
                    onChange={(e) => setNewWorkTypeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddWorkType();
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-purple-300 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddWorkType}
                    className="px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              {availableWorkTypes.length > 0 ? (
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">— None / Unassigned —</option>
                  {availableWorkTypes.map((wt) => (
                    <option key={wt} value={wt}>
                      {wt}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                  No work types added yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Click Badges for Work Type */}
          {availableWorkTypes.length > 0 && (
            <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1">
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-600" />
                Work Types in Database ({availableWorkTypes.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableWorkTypes.map((wt) => {
                  const isSelected = workType === wt;
                  return (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => setWorkType(wt)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <span>{wt}</span>
                      {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Due Date & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                min={getTodayStr()}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Logged Hours
              </label>
              <input
                type="number"
                min={0}
                max={200}
                step={0.5}
                value={loggedHours}
                onChange={(e) => setLoggedHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectTaskModal;
