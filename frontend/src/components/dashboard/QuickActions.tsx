import React from 'react';
import {
  FolderPlus,
  CheckSquare,
  Hourglass,
  UserPlus,
} from 'lucide-react';

interface QuickActionsProps {
  onCreateProject: () => void;
  onAssignGeneralTask: () => void;
  onAssignProjectTask: () => void;
  onAddClient: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateProject,
  onAssignGeneralTask,
  onAssignProjectTask,
  onAddClient,
}) => {
  const actions = [
    {
      id: 'create-project',
      title: 'Create New Project',
      subtitle: 'Add a new project',
      icon: FolderPlus,
      iconBg: 'bg-blue-600 text-white',
      borderHover: 'hover:border-blue-300',
      onClick: onCreateProject,
    },
    {
      id: 'assign-general-task',
      title: 'Assign General Task',
      subtitle: 'Assign work to employees',
      icon: CheckSquare,
      iconBg: 'bg-emerald-600 text-white',
      borderHover: 'hover:border-emerald-300',
      onClick: onAssignGeneralTask,
    },
    {
      id: 'assign-project-task',
      title: 'Assign Project Task',
      subtitle: 'Create task for a project',
      icon: Hourglass,
      iconBg: 'bg-orange-500 text-white',
      borderHover: 'hover:border-orange-300',
      onClick: onAssignProjectTask,
    },
    {
      id: 'add-client',
      title: 'Add Client',
      subtitle: 'Add a new client',
      icon: UserPlus,
      iconBg: 'bg-teal-600 text-white',
      borderHover: 'hover:border-teal-300',
      onClick: onAddClient,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-800 tracking-tight">
        Quick Actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon;

          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className={`bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center gap-3.5 text-left transition-all duration-200 hover:shadow-md ${act.borderHover} group`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${act.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {act.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
