import React from 'react';
import { ProjectItem } from '../../types';
import { ArrowRight } from 'lucide-react';

interface RecentProjectsTableProps {
  projects: ProjectItem[];
  onViewAll: () => void;
  onSelectProject?: (project: ProjectItem) => void;
}

export const RecentProjectsTable: React.FC<RecentProjectsTableProps> = ({
  projects,
  onViewAll,
  onSelectProject,
}) => {
  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/80">
            In Progress
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200/80">
            Pending
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
            Completed
          </span>
        );
      case 'On Hold':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            On Hold
          </span>
        );
      case 'Cancelled':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
    }
  };

  const getProgressBarColor = (progress: number, status: ProjectItem['status']) => {
    if (status === 'Completed' || progress === 100) return 'bg-emerald-500';
    if (status === 'Pending') return 'bg-orange-500';
    return 'bg-blue-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Recent Projects
          </h3>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            View all projects
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2">Project Name</th>
                <th className="py-3 px-2">Client</th>
                <th className="py-3 px-2">Manager</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 w-28 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No projects found. Click &quot;+ New Project&quot; to create your first project.
                  </td>
                </tr>
              ) : (
                projects.slice(0, 5).map((project) => (
                <tr
                  key={project.id}
                  onClick={() => onSelectProject && onSelectProject(project)}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <td className="py-3.5 px-2 font-semibold text-slate-800">
                    {project.name}
                  </td>
                  <td className="py-3.5 px-2 text-slate-600 font-medium">
                    {project.client}
                  </td>
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={project.manager.avatar}
                        alt={project.manager.name}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-medium text-slate-700">
                        {project.manager.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    {getStatusBadge(project.status)}
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-slate-700 text-[11px]">
                        {project.progress}%
                      </span>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                            project.progress,
                            project.status
                          )}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
