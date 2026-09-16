import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Code,
  Layers,
  Users,
  UserPlus,
  Bell,
  Target,
  Tag,
  Sparkles,
  Info,
} from 'lucide-react';
import { TaskItem, ProjectItem, AdminUserItem, MasterPlanItem } from '../../types';

interface CreateProjectTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTasks: (tasks: TaskItem[]) => void;
  projects: ProjectItem[];
  adminsList?: AdminUserItem[];
  onAddNewEmployee?: (employee: AdminUserItem) => void;
  masterPlans?: MasterPlanItem[];
  onCreateMasterPlan?: (data: { project_id?: string; project_name?: string; work_type: string }) => Promise<void>;
  onUpdateProject?: (project: ProjectItem) => void;
}

export interface EmployeeWorkAllocation {
  id: string;
  name: string;
  role: string;
  taskTitle?: string;
  workType?: string;
  priority: TaskItem['priority'];
  avatar: string;
  email: string;
  startDate: string;
  endDate: string;
  estimateHours: number;
  estimateDate: string;
}

export const CreateProjectTaskModal: React.FC<CreateProjectTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTasks,
  projects,
  adminsList = [],
  masterPlans: _masterPlans = [],
  onCreateMasterPlan: _onCreateMasterPlan,
  onUpdateProject,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [workTypeTier1, setWorkTypeTier1] = useState<string>('');
  const [selectedModuleTier2, setSelectedModuleTier2] = useState<string>('');
  const [sprintOption, setSprintOption] = useState<string>('');
  const [customSprintName, setCustomSprintName] = useState<string>('');

  // Quick Add states
  const [quickWorkType, setQuickWorkType] = useState('');
  const [isAddingQuickWorkType, setIsAddingQuickWorkType] = useState(false);

  const [quickModule, setQuickModule] = useState('');
  const [isAddingQuickModule, setIsAddingQuickModule] = useState(false);

  const [quickSprint, setQuickSprint] = useState('');
  const [isAddingQuickSprint, setIsAddingQuickSprint] = useState(false);

  // Checkboxes to determine which of the 3 dimensions are included in assignment
  const [includeWorkType, setIncludeWorkType] = useState<boolean>(true);
  const [includeModule, setIncludeModule] = useState<boolean>(false);
  const [includeSprint, setIncludeSprint] = useState<boolean>(true);

  // Optional manual custom title override
  const [isCustomTitle, setIsCustomTitle] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Work Types directly belonging to this active project ONLY
  const availableWorkTypes = React.useMemo(() => {
    return activeProject?.workTypes || [];
  }, [activeProject?.workTypes]);

  // Auto-sync selected workTypeTier1 when availableWorkTypes changes
  useEffect(() => {
    if (availableWorkTypes.length > 0) {
      if (!workTypeTier1 || !availableWorkTypes.includes(workTypeTier1)) {
        setWorkTypeTier1(availableWorkTypes[0]);
      }
    } else {
      setWorkTypeTier1('');
    }
  }, [availableWorkTypes, workTypeTier1]);

  // Modules from Active Project - ONLY what user added!
  const availableModules = React.useMemo(() => {
    return activeProject?.modules || [];
  }, [activeProject?.modules]);

  // Sprints from Active Project - ONLY what user added!
  const availableSprints = React.useMemo(() => {
    return (activeProject?.sprints || []).map((s) => s.name);
  }, [activeProject?.sprints]);

  useEffect(() => {
    if (availableModules.length > 0) {
      if (!selectedModuleTier2 || !availableModules.includes(selectedModuleTier2)) {
        setSelectedModuleTier2(availableModules[0]);
      }
    } else {
      setSelectedModuleTier2('');
    }
  }, [availableModules, selectedModuleTier2]);

  useEffect(() => {
    if (availableSprints.length > 0) {
      if (sprintOption !== 'CUSTOM' && (!sprintOption || !availableSprints.includes(sprintOption))) {
        setSprintOption(availableSprints[0]);
      }
    } else {
      if (sprintOption !== 'CUSTOM') {
        setSprintOption('');
      }
    }
  }, [availableSprints, sprintOption]);

  const handleAddQuickWorkType = () => {
    const val = quickWorkType.trim();
    if (!val || !activeProject) return;
    const currentList = activeProject.workTypes || [];
    if (!currentList.some((w) => w.toLowerCase() === val.toLowerCase())) {
      const updated = [...currentList, val];
      if (onUpdateProject) {
        onUpdateProject({ ...activeProject, workTypes: updated });
      }
      activeProject.workTypes = updated;
    }
    setWorkTypeTier1(val);
    setQuickWorkType('');
    setIsAddingQuickWorkType(false);
  };

  const handleAddQuickModule = () => {
    const val = quickModule.trim();
    if (!val || !activeProject) return;
    const currentList = activeProject.modules || [];
    if (!currentList.some((m) => m.toLowerCase() === val.toLowerCase())) {
      const updatedModules = [...currentList, val];
      if (onUpdateProject) {
        onUpdateProject({ ...activeProject, modules: updatedModules });
      }
      activeProject.modules = updatedModules;
    }
    setSelectedModuleTier2(val);
    setQuickModule('');
    setIsAddingQuickModule(false);
  };

  const handleAddQuickSprint = () => {
    const val = quickSprint.trim();
    if (!val || !activeProject) return;
    const currentList = activeProject.sprints || [];
    if (!currentList.some((s) => s.name.toLowerCase() === val.toLowerCase())) {
      const newSp = {
        id: `sp-${Date.now()}`,
        name: val,
        status: 'Active' as const,
      };
      const updatedSprints = [...currentList, newSp];
      if (onUpdateProject) {
        onUpdateProject({ ...activeProject, sprints: updatedSprints });
      }
      activeProject.sprints = updatedSprints;
    }
    setSprintOption(val);
    setQuickSprint('');
    setIsAddingQuickSprint(false);
  };

  // Use only database users from PostgreSQL, prioritizing employees assigned to this project
  const availableEmployees = React.useMemo(() => {
    const activeAssigned = activeProject?.assignedEmployees || [];
    const assignedEmails = new Set(activeAssigned.map((e) => (e.email || '').toLowerCase()));
    const assignedNames = new Set(activeAssigned.map((e) => e.name.toLowerCase()));

    const baseList = adminsList
      .filter((adm) => adm.status === 'ACTIVE' || adm.status !== 'BANNED')
      .map((adm) => {
        const isProjectMember =
          assignedEmails.has((adm.email || '').toLowerCase()) ||
          assignedNames.has(adm.name.toLowerCase());
        return {
          name: adm.name,
          role: adm.role === 'SUPER_ADMIN' ? 'Super Admin' : adm.role === 'ADMIN' ? 'Project Lead' : 'Team Member',
          avatar: adm.avatar,
          email: adm.email,
          isProjectMember,
        };
      });

    // Sort project members first
    return baseList.sort((a, b) => {
      if (a.isProjectMember && !b.isProjectMember) return -1;
      if (!a.isProjectMember && b.isProjectMember) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [adminsList, activeProject]);

  // Dropdown state for selecting an employee to add
  const [employeeSelectValue, setEmployeeSelectValue] = useState<string>('');

  useEffect(() => {
    if (availableEmployees.length > 0 && !employeeSelectValue) {
      setEmployeeSelectValue(availableEmployees[0].name);
    }
  }, [availableEmployees, employeeSelectValue]);

  // Selected employees list
  const [assignedEmployees, setAssignedEmployees] = useState<EmployeeWorkAllocation[]>([]);

  // Compute auto task title helper based ONLY on what admin selected
  const getDerivedTaskTitle = () => {
    const finalSprintName =
      sprintOption === 'CUSTOM'
        ? customSprintName.trim()
        : sprintOption;

    const parts: string[] = [];
    if (includeWorkType && workTypeTier1?.trim()) {
      parts.push(workTypeTier1.trim());
    }
    if (includeModule && selectedModuleTier2?.trim()) {
      parts.push(selectedModuleTier2.trim());
    }
    if (includeSprint && finalSprintName?.trim()) {
      parts.push(finalSprintName.trim());
    }

    return parts.join(' • ');
  };

  const finalDerivedTitle = getDerivedTaskTitle();
  const effectiveTitle = isCustomTitle && customTitle.trim() ? customTitle.trim() : finalDerivedTitle;

  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen && availableEmployees.length > 0) {
      const today = getTodayDateStr();
      if (assignedEmployees.length === 0) {
        const firstEmp = availableEmployees[0];
        setAssignedEmployees([
          {
            id: `emp-alloc-${Date.now()}`,
            name: firstEmp.name,
            role: firstEmp.role,
            priority: 'High',
            avatar: firstEmp.avatar,
            email: firstEmp.email,
            startDate: today,
            endDate: today,
            estimateHours: 16,
            estimateDate: today,
          },
        ]);
      } else {
        // Prevent showing previous dates
        setAssignedEmployees((prev) =>
          prev.map((emp) => ({
            ...emp,
            startDate: emp.startDate && emp.startDate >= today ? emp.startDate : today,
            endDate: emp.endDate && emp.endDate >= today ? emp.endDate : today,
            estimateDate: emp.estimateDate && emp.estimateDate >= today ? emp.estimateDate : today,
          }))
        );
      }
    } else if (!isOpen) {
      setAssignedEmployees([]);
    }
  }, [isOpen, availableEmployees, activeProject]);

  // Keep selected project updated
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Handle adding an employee to the assigned allocation list
  const handleAddEmployee = () => {
    const matched = availableEmployees.find(
      (e) => e.name.toLowerCase() === employeeSelectValue.toLowerCase()
    );
    if (!matched) return;

    if (!assignedEmployees.some((e) => e.name.toLowerCase() === matched.name.toLowerCase())) {
      const today = getTodayDateStr();
      const newAllocation: EmployeeWorkAllocation = {
        id: `emp-alloc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: matched.name,
        role: matched.role,
        priority: 'High',
        avatar: matched.avatar,
        email: matched.email,
        startDate: today,
        endDate: today,
        estimateHours: 16,
        estimateDate: today,
      };
      setAssignedEmployees([...assignedEmployees, newAllocation]);
    }
  };

  // Handle removing an assigned employee
  const handleRemoveEmployee = (id: string) => {
    if (assignedEmployees.length <= 1) return;
    setAssignedEmployees(assignedEmployees.filter((e) => e.id !== id));
  };

  // Handle updating an individual employee's allocation fields
  const handleUpdateEmployee = (
    id: string,
    field: keyof EmployeeWorkAllocation,
    value: any
  ) => {
    setAssignedEmployees(
      assignedEmployees.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  // Quick preset handlers
  const handleSelectPreset = (mode: 'module_only' | 'sprint_only' | 'worktype_only' | 'both_mod_sp' | 'both_wt_sp' | 'all') => {
    switch (mode) {
      case 'module_only':
        setIncludeWorkType(false);
        setIncludeModule(true);
        setIncludeSprint(false);
        break;
      case 'sprint_only':
        setIncludeWorkType(false);
        setIncludeModule(false);
        setIncludeSprint(true);
        break;
      case 'worktype_only':
        setIncludeWorkType(true);
        setIncludeModule(false);
        setIncludeSprint(false);
        break;
      case 'both_mod_sp':
        setIncludeWorkType(false);
        setIncludeModule(true);
        setIncludeSprint(true);
        break;
      case 'both_wt_sp':
        setIncludeWorkType(true);
        setIncludeModule(false);
        setIncludeSprint(true);
        break;
      case 'all':
        setIncludeWorkType(true);
        setIncludeModule(true);
        setIncludeSprint(true);
        break;
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || assignedEmployees.length === 0) return;

    const finalSprintName =
      sprintOption === 'CUSTOM'
        ? customSprintName.trim()
        : sprintOption;

    const titleToAssign = effectiveTitle.trim();

    if (!titleToAssign && !includeWorkType && !includeModule && !includeSprint) {
      alert('Please select at least one assignment structure (Work Type, Module, or Sprint / Strip) or specify a task title.');
      return;
    }

    // ONLY assign what superadmin or admin selected — DO NOT assign our own fallbacks!
    const createdTasks: TaskItem[] = assignedEmployees.map((emp, idx) => ({
      id: `tsk-${Date.now()}-${idx}`,
      code: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      title: titleToAssign || 'Assigned Project Task',
      project: activeProject.name,
      // Only assign module if admin explicitly included it and it has a value
      module: includeModule && selectedModuleTier2?.trim() ? selectedModuleTier2.trim() : undefined,
      // Only assign sprint if admin explicitly included it and it has a value
      sprint: includeSprint && finalSprintName?.trim() ? finalSprintName.trim() : undefined,
      // Only assign workType if admin explicitly included it and it has a value
      workType: includeWorkType && workTypeTier1?.trim() ? workTypeTier1.trim() : undefined,
      assignee: {
        name: emp.name,
        email: emp.email,
        avatar: emp.avatar,
        role: emp.role,
      },
      status: 'To Do',
      priority: emp.priority,
      startDate: emp.startDate,
      dueDate: emp.endDate || activeProject.endDate,
      estimatedHours: emp.estimateHours,
      loggedHours: 0,
      developerDeadline: `${emp.estimateDate || emp.endDate || activeProject.endDate}T18:00:00Z`,
    }));

    onAddTasks(createdTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Assign Project Tasks</h3>
              {/* <p className="text-xs text-slate-500">
                Assign work based on what you select (Work Type / Full Work, Module, Sprint / Strip)
              </p> */}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Dynamic Project Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 bg-white shadow-2xs cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — Client: {p.client}
                </option>
              ))}
            </select>

            {activeProject && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                  <span>Client: <strong className="text-slate-700">{activeProject.client}</strong></span>
                  <span>Progress: <strong className="text-blue-600">{activeProject.progress}%</strong></span>
                  <span>Target: <strong className="text-slate-700">{activeProject.endDate}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 3 Assignment Dimensions Section: Work Type, Module, Sprint */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Work Assignment Structure (Choose Any 1, 2, or All 3)
                </span>
              </div>

              {/* Quick preset selector buttons */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('module_only')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${includeModule && !includeWorkType && !includeSprint
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Modules Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('sprint_only')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${includeSprint && !includeWorkType && !includeModule
                    ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Sprint Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('worktype_only')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${includeWorkType && !includeModule && !includeSprint
                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Full Type Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('both_wt_sp')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${includeWorkType && includeSprint && !includeModule
                    ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Work Type + Sprint
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('both_mod_sp')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${includeModule && includeSprint && !includeWorkType
                    ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  Module + Sprint
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${includeWorkType && includeModule && includeSprint
                    ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  All 3
                </button>
              </div>
            </div>

            {/* Preview of Generated Task Title */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold text-blue-950 text-xs">Task Title Preview:</span>
                  <span className="font-semibold text-blue-800 font-mono text-[11px] px-2.5 py-1 bg-white rounded-lg border border-blue-200 shadow-2xs">
                    {effectiveTitle || <span className="text-slate-400 italic">No structure selected</span>}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isCustomTitle) {
                      setCustomTitle(finalDerivedTitle);
                    }
                    setIsCustomTitle(!isCustomTitle);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline self-start sm:self-auto cursor-pointer"
                >
                  {isCustomTitle ? '← Auto-generate from selection' : '✏️ Custom Dynamic Title'}
                </button>
              </div>

              {isCustomTitle && (
                <div className="pt-2 border-t border-blue-200/50">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter custom task title..."
                    className="w-full px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* 2. Work Type / Full Work & 3. Module */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Work Type Box */}
              <div className={`p-3.5 rounded-2xl border transition ${includeWorkType ? 'bg-white border-purple-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeWorkType}
                      onChange={(e) => setIncludeWorkType(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    2. Work Type / Full Work
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${includeWorkType ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-200 text-slate-600'}`}>
                    {includeWorkType ? 'Active (Will Assign)' : 'Skipped'}
                  </span>
                </div>

                {includeWorkType ? (
                  availableWorkTypes.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={workTypeTier1}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsAddingQuickWorkType(true);
                          } else {
                            setWorkTypeTier1(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600 bg-white cursor-pointer"
                      >
                        {availableWorkTypes.map((wt) => (
                          <option key={wt} value={wt}>
                            {wt}
                          </option>
                        ))}
                        <option value="__NEW__">+ Add New Work Type...</option>
                      </select>

                      <div className="pt-2 border-t border-purple-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                            <Target className="w-3 h-3 text-purple-600" />
                            Work Types ({availableWorkTypes.length}):
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingQuickWorkType(!isAddingQuickWorkType)}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-800"
                          >
                            + Add New
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-purple-50/40 rounded-lg border border-purple-100/70">
                          {availableWorkTypes.map((wt) => {
                            const isSelected = workTypeTier1 === wt;
                            return (
                              <button
                                key={wt}
                                type="button"
                                onClick={() => setWorkTypeTier1(wt)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer text-left ${isSelected
                                  ? 'bg-purple-600 text-white shadow-2xs ring-1 ring-purple-600'
                                  : 'bg-white text-slate-700 border border-purple-200/80 hover:bg-purple-100/80'
                                  }`}
                              >
                                <span className="truncate max-w-[140px]">{wt}</span>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
                      <p className="text-[11px] font-bold text-purple-900">
                        No Work Type added yet for {activeProject?.name || 'this project'}.
                      </p>
                      <p className="text-[10px] text-purple-700">
                        Add a work type (e.g. Frontend Development, Backend API) below:
                      </p>
                    </div>
                  )
                ) : (
                  <p className="text-[11px] text-slate-500 italic p-2">
                    Work Type is skipped. The task will not have a work type assigned.
                  </p>
                )}

                {/* Quick Add Work Type Input */}
                {(isAddingQuickWorkType || availableWorkTypes.length === 0) && includeWorkType && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Type Work Type..."
                      value={quickWorkType}
                      onChange={(e) => setQuickWorkType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddQuickWorkType();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-purple-600 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuickWorkType}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold whitespace-nowrap hover:bg-purple-700 transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>

              {/* Module Box */}
              <div className={`p-3.5 rounded-2xl border transition ${includeModule ? 'bg-white border-blue-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeModule}
                      onChange={(e) => setIncludeModule(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <Code className="w-3.5 h-3.5 text-blue-600" />
                    3. Module
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${includeModule ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-200 text-slate-600'}`}>
                    {includeModule ? 'Active (Will Assign)' : 'Skipped'}
                  </span>
                </div>

                {includeModule ? (
                  availableModules.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={selectedModuleTier2}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsAddingQuickModule(true);
                          } else {
                            setSelectedModuleTier2(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
                      >
                        {availableModules.map((mod) => (
                          <option key={mod} value={mod}>
                            {mod}
                          </option>
                        ))}
                        <option value="__NEW__">+ Add New Module...</option>
                      </select>

                      <div className="pt-2 border-t border-blue-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-3 h-3 text-blue-600" />
                            Modules ({availableModules.length}):
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingQuickModule(!isAddingQuickModule)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            + Add New
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-blue-50/40 rounded-lg border border-blue-100/70">
                          {availableModules.map((mod) => {
                            const isSelected = selectedModuleTier2 === mod;
                            return (
                              <button
                                key={mod}
                                type="button"
                                onClick={() => setSelectedModuleTier2(mod)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer text-left ${isSelected
                                  ? 'bg-blue-600 text-white shadow-2xs ring-1 ring-blue-600'
                                  : 'bg-white text-slate-700 border border-blue-200/80 hover:bg-blue-100/80'
                                  }`}
                              >
                                <span className="truncate max-w-[140px]">{mod}</span>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
                      <p className="text-[11px] font-bold text-blue-900">
                        No modules added yet for {activeProject?.name || 'this project'}.
                      </p>
                      <p className="text-[10px] text-blue-700">
                        Add a module (e.g. Authentication, Dashboard, Settings) below:
                      </p>
                    </div>
                  )
                ) : (
                  <p className="text-[11px] text-slate-500 italic p-2">
                    Module is skipped. The task will not have a module assigned.
                  </p>
                )}

                {/* Quick Add Module Input */}
                {(isAddingQuickModule || availableModules.length === 0) && includeModule && (
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Type Module name..."
                      value={quickModule}
                      onChange={(e) => setQuickModule(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddQuickModule();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-600 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddQuickModule}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold whitespace-nowrap hover:bg-blue-700 transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Sprint / Strip */}
            <div className={`p-3.5 rounded-2xl border transition ${includeSprint ? 'bg-white border-orange-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSprint}
                    onChange={(e) => setIncludeSprint(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                  4. Sprint / Strip
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${includeSprint ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-slate-200 text-slate-600'}`}>
                  {includeSprint ? 'Active (Will Assign)' : 'Skipped'}
                </span>
              </div>

              {includeSprint ? (
                availableSprints.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={sprintOption}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsAddingQuickSprint(true);
                          } else {
                            setSprintOption(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                      >
                        {availableSprints.map((sp) => (
                          <option key={sp} value={sp}>
                            {sp}
                          </option>
                        ))}
                        <option value="CUSTOM">+ Add Custom Sprint / Strip Name</option>
                        <option value="__NEW__">+ Quick Add Sprint to Project</option>
                      </select>

                      {sprintOption === 'CUSTOM' && (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Hotfix Strip 2 / Release Phase 1"
                          value={customSprintName}
                          onChange={(e) => setCustomSprintName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500 bg-white"
                        />
                      )}
                    </div>

                    <div className="pt-2 border-t border-orange-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-orange-600" />
                          Sprints ({availableSprints.length}):
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingQuickSprint(!isAddingQuickSprint)}
                          className="text-[10px] font-bold text-orange-600 hover:text-orange-800"
                        >
                          + Add Sprint
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-orange-50/40 rounded-lg border border-orange-100/70">
                        {availableSprints.map((sp) => {
                          const isSelected = sprintOption === sp;
                          return (
                            <button
                              key={sp}
                              type="button"
                              onClick={() => setSprintOption(sp)}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer text-left ${isSelected
                                ? 'bg-orange-600 text-white shadow-2xs ring-1 ring-orange-600'
                                : 'bg-white text-slate-700 border border-orange-200/80 hover:bg-orange-100/80'
                                }`}
                            >
                              <span className="truncate max-w-[140px]">{sp}</span>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-2">
                    <p className="text-[11px] font-bold text-orange-900">
                      No sprints added yet for {activeProject?.name || 'this project'}.
                    </p>
                    <p className="text-[10px] text-orange-700">
                      Add a sprint (e.g. Sprint 1, Sprint 2) below:
                    </p>
                  </div>
                )
              ) : (
                <p className="text-[11px] text-slate-500 italic p-2">
                  Sprint is skipped. The task will not have a sprint assigned.
                </p>
              )}

              {/* Quick Add Sprint Input */}
              {(isAddingQuickSprint || availableSprints.length === 0) && includeSprint && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Type Sprint name..."
                    value={quickSprint}
                    onChange={(e) => setQuickSprint(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuickSprint();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-orange-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-orange-500 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickSprint}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold whitespace-nowrap hover:bg-orange-700 transition cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5. Assign To Employees */}
          <div className="space-y-4 p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  5. Assign To Employees ({assignedEmployees.length} Assigned) *
                </label>
                {/* <p className="text-[11px] text-emerald-800">
                  Select employee, priority, start date, end date, and estimate date.
                </p> */}
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-2xs self-start sm:self-auto">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                Email Assignment Sync Active
              </span>
            </div>

            {/* Employee Selection Dropdown + Add Button */}
            <div className="p-3 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
              <div className="w-full sm:flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Select Employee from Directory
                </label>
                <select
                  value={employeeSelectValue}
                  onChange={(e) => setEmployeeSelectValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 bg-white shadow-2xs cursor-pointer"
                >
                  {availableEmployees.map((emp) => (
                    <option key={emp.email} value={emp.name}>
                      {emp.isProjectMember ? '⭐ ' : ''}{emp.name} — ({emp.role}) [{emp.email}]{emp.isProjectMember ? ' (Assigned Project Member)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto flex items-end">
                <button
                  type="button"
                  onClick={handleAddEmployee}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  + Add Employee
                </button>
              </div>
            </div>

            {/* ASSIGNED EMPLOYEE WORK CARDS (Which Role Going to Do section removed) */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto p-1">
              {assignedEmployees.map((emp, index) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-3 animate-in fade-in"
                >
                  {/* Top Bar: Employee # Index + Avatar + Name + Email + Role Badge + Delete Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono border border-emerald-300">
                        Employee #{index + 1}
                      </span>
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-7 h-7 rounded-full object-cover border border-emerald-300 shadow-2xs"
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-900">{emp.name}</span>
                        <span className="text-xs text-slate-500 font-mono ml-2">({emp.email})</span>
                        <span className="ml-2 text-[10px] font-semibold text-slate-600 px-1.5 py-0.2 bg-slate-100 rounded border border-slate-200">
                          {emp.role}
                        </span>
                      </div>
                    </div>

                    {assignedEmployees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(emp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Remove employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 4 Columns: Priority, Start Date, End Date, Estimate Date (Role dropdown completely removed) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* 1. Priority */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 truncate">
                        Priority
                      </label>
                      <select
                        value={emp.priority}
                        onChange={(e) =>
                          handleUpdateEmployee(
                            emp.id,
                            'priority',
                            e.target.value as TaskItem['priority']
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold bg-white cursor-pointer"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>

                    {/* 2. Start Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 truncate">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        min={getTodayDateStr()}
                        value={emp.startDate || getTodayDateStr()}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateEmployee(emp.id, 'startDate', val);
                          if (emp.endDate && emp.endDate < val) {
                            handleUpdateEmployee(emp.id, 'endDate', val);
                          }
                          if (emp.estimateDate && emp.estimateDate < val) {
                            handleUpdateEmployee(emp.id, 'estimateDate', val);
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                      />
                    </div>

                    {/* 3. End Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 truncate">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        min={emp.startDate || getTodayDateStr()}
                        value={emp.endDate || emp.startDate || getTodayDateStr()}
                        onChange={(e) =>
                          handleUpdateEmployee(emp.id, 'endDate', e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                      />
                    </div>

                    {/* 4. Estimate Date */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 truncate">
                        Estimate Date
                      </label>
                      <input
                        type="date"
                        required
                        min={emp.startDate || getTodayDateStr()}
                        value={emp.estimateDate || emp.endDate || emp.startDate || getTodayDateStr()}
                        onChange={(e) =>
                          handleUpdateEmployee(emp.id, 'estimateDate', e.target.value)
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Summary Bar */}
          <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-700">Assigning strictly selected dimensions:</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className={`px-1.5 py-0.5 rounded ${includeWorkType ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-slate-200 text-slate-500 line-through'}`}>
                Work Type: {includeWorkType && workTypeTier1 ? workTypeTier1 : 'None'}
              </span>
              <span className={`px-1.5 py-0.5 rounded ${includeModule ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-200 text-slate-500 line-through'}`}>
                Module: {includeModule && selectedModuleTier2 ? selectedModuleTier2 : 'None'}
              </span>
              <span className={`px-1.5 py-0.5 rounded ${includeSprint ? 'bg-orange-100 text-orange-800 font-bold' : 'bg-slate-200 text-slate-500 line-through'}`}>
                Sprint: {includeSprint && (sprintOption === 'CUSTOM' ? customSprintName : sprintOption) ? (sprintOption === 'CUSTOM' ? customSprintName : sprintOption) : 'None'}
              </span>
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
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Assign & Send Notifications to {assignedEmployees.length} Employee{assignedEmployees.length > 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectTaskModal;
