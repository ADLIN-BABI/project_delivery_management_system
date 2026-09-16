import React from 'react';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentProjectsTable } from '../components/dashboard/RecentProjectsTable';
import { QuickActions } from '../components/dashboard/QuickActions';
import { NavTab } from '../components/layout/Sidebar';
import { ProjectItem } from '../types';

interface DashboardPageProps {
  projects: ProjectItem[];
  userRole: 'SUPER_ADMIN' | 'ADMIN';
  onNavigateTab: (tab: NavTab) => void;
  onOpenCreateProject: () => void;
  onOpenAssignGeneralTask: () => void;
  onOpenAssignProjectTask: () => void;
  onOpenAddClient: () => void;
  onSelectProject?: (project: ProjectItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  userRole: _userRole,
  onNavigateTab,
  onOpenCreateProject,
  onOpenAssignGeneralTask,
  onOpenAssignProjectTask,
  onOpenAddClient,
  onSelectProject,
}) => {
  const totalProjectsCount = projects.length;
  const activeProjectsCount = projects.filter((p) => p.status === 'In Progress').length;
  const pendingProjectsCount = projects.filter((p) => p.status === 'Pending' || p.status === 'On Hold').length;
  const completedProjectsCount = projects.filter((p) => p.status === 'Completed').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* 4 Stat Metric Cards (Directly matching screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          type="total"
          title="Total Projects"
          count={totalProjectsCount}
          linkText="View all projects"
          onClick={() => onNavigateTab('projects')}
        />
        <StatCard
          type="active"
          title="Active Projects"
          count={activeProjectsCount}
          linkText="View active projects"
          onClick={() => onNavigateTab('projects')}
        />
        <StatCard
          type="pending"
          title="Pending Projects"
          count={pendingProjectsCount}
          linkText="View pending projects"
          onClick={() => onNavigateTab('projects')}
        />
        <StatCard
          type="completed"
          title="Completed Projects"
          count={completedProjectsCount}
          linkText="View completed projects"
          onClick={() => onNavigateTab('projects')}
        />
      </div>

      {/* Recent Projects Table */}
      <div className="grid grid-cols-1 gap-6">
        <RecentProjectsTable
          projects={projects}
          onViewAll={() => onNavigateTab('projects')}
          onSelectProject={(project) => {
            if (onSelectProject) {
              onSelectProject(project);
            } else {
              onNavigateTab('projects');
            }
          }}
        />
      </div>

      {/* Quick Actions Bar (Bottom Row) */}
      <QuickActions
        onCreateProject={onOpenCreateProject}
        onAssignGeneralTask={onOpenAssignGeneralTask}
        onAssignProjectTask={onOpenAssignProjectTask}
        onAddClient={onOpenAddClient}
      />
    </div>
  );
};
