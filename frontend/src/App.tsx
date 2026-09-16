import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/projectsPage';
import { GeneralTasksPage } from './pages/GeneralTasksPage';
import { EmployeePortalPage } from './pages/EmployeePortalPage';
import { EmployeeProjectsPortal } from './components/project/EmployeeProjectsPortal';
import { ClientsPage } from './pages/ClientsPage';
import { AdminManagementPage } from './pages/AdminManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupPage } from './pages/SetupPage';

// Modals
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CreateGeneralTaskModal } from './components/modals/CreateGeneralTaskModal';
import { CreateProjectTaskModal } from './components/modals/CreateProjectTaskModal';
import { CreateClientModal } from './components/modals/CreateClientModal';
import { CreateAdminModal } from './components/modals/CreateAdminModal';

// Mock Data
import {
  ProjectItem,
  ClientItem,
  TaskItem,
  AdminUserItem,
  AuditLogItem,
  NotificationItem,
  MasterPlanItem,
} from './types';

import { api } from './api/client';

const getTabFromPath = (): NavTab => {
  const raw = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const validTabs: Record<string, NavTab> = {
    '': 'dashboard',
    'dashboard': 'dashboard',
    'projects': 'projects',
    'general-tasks': 'general-tasks',
    'project-tasks': 'projects',
    'clients': 'clients',
    'admin-management': 'admin-management',
    'audit-logs': 'audit-logs',
    'notifications': 'notifications',
    'settings': 'settings',
  };
  return validTabs[raw] || 'dashboard';
};

const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>(() => getTabFromPath());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigateTab = (tab: NavTab) => {
    setActiveTab(tab);
    const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Determine user role from AuthContext
  const userRole: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' =
    user?.role || 'SUPER_ADMIN';

  // State loaded exclusively from PostgreSQL Database
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [masterPlans, setMasterPlans] = useState<MasterPlanItem[]>([]);
  const [initialProjectIdForTasks, setInitialProjectIdForTasks] = useState<string>('ALL');

  // Bootstrap & Database Connection Health state
  const [isBootstrapped, setIsBootstrapped] = useState<boolean>(true);
  const [showSetup, setShowSetup] = useState<boolean>(false);

  React.useEffect(() => {
    api.checkBootstrapStatus()
      .then((res) => {
        setIsBootstrapped(res.is_bootstrapped);
      })
      .catch(() => { });
  }, []);

  // Fetch projects from PostgreSQL Database
  const fetchProjects = React.useCallback(() => {
    api
      .listProjects()
      .then((dbProjects) => {
        if (dbProjects && Array.isArray(dbProjects)) {
          const mapped: ProjectItem[] = dbProjects.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            client: p.client,
            clientDetails: p.client_details,
            platform: p.platform,
            technologies: p.technologies || [],
            projectType: p.project_type,
            durationDays: p.duration_days,
            description: p.description,
            manager: p.manager || {
              name: 'System Administrator',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              role: 'Super Admin',
            },
            assignedEmployees: p.assigned_employees || [],
            status: p.status || 'In Progress',
            progress: p.progress || 0,
            startDate: p.start_date || '',
            endDate: p.end_date || '',
            priority: p.priority || 'Medium',
            platforms: p.platforms || [],
            subPortals: p.sub_portals || [],
            modules: p.modules || [],
            sprints: (p.sprints || []).map((s: any, idx: number) =>
              typeof s === 'string'
                ? { id: `sp-${idx + 1}`, name: s, status: 'Active' as const }
                : s
            ),
            workTypes: p.work_types || p.workTypes || [],
          }));
          setProjects(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load projects from DB:', err);
      });
  }, []);

  // Fetch tasks from PostgreSQL Database
  const fetchTasks = React.useCallback(() => {
    api
      .listAllTasks()
      .then((dbTasks) => {
        if (dbTasks && Array.isArray(dbTasks)) {
          const mapped: TaskItem[] = dbTasks.map((t: any) => ({
            id: t.id,
            code: t.code,
            title: t.title,
            project: t.project,
            module: t.module,
            sprint: t.sprint,
            workType: t.work_type,
            status: t.status,
            priority: t.priority,
            assignee: t.assignee || { name: 'Unassigned', avatar: '', role: 'Employee' },
            dueDate: t.due_date,
            startDate: t.start_date,
            description: t.description,
            dailyLogs: t.daily_logs || [],
            taskNotifications: t.task_notifications || [],
            estimatedHours: t.estimated_hours,
            loggedHours: t.logged_hours,
            developerDeadline: t.developer_deadline,
            isEscalated: t.is_escalated,
          }));
          setTasks(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load tasks from DB:', err);
      });
  }, []);

  // Fetch clients from PostgreSQL Database
  const fetchClients = React.useCallback(() => {
    api
      .listClients()
      .then((dbClients) => {
        if (dbClients && Array.isArray(dbClients)) {
          const mapped: ClientItem[] = dbClients.map((c: any) => ({
            id: c.id,
            companyName: c.company_name,
            contactPerson: c.contact_person,
            email: c.email,
            phone: c.phone || '',
            address: c.address || '',
            activeProjects: c.active_projects || 0,
            status: c.status || 'Active',
            avatar: c.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
          }));
          setClients(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load clients from DB:', err);
      });
  }, []);

  // Fetch registered users directly from PostgreSQL Database
  const fetchAdmins = React.useCallback(() => {
    api
      .listAdmins()
      .then((dbUsers) => {
        if (dbUsers && Array.isArray(dbUsers)) {
          const mapped: AdminUserItem[] = dbUsers.map((u) => ({
            id: u.id,
            name: u.full_name,
            email: u.email,
            phone: u.phone || '',
            role: u.role,
            status: u.status,
            avatar:
              u.profile_image ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Recently',
            createdAt: u.created_at ? u.created_at.split('T')[0] : '2026-09-03',
          }));
          setAdmins(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load users from DB:', err);
      });
  }, []);

  // Fetch master plans from PostgreSQL Database
  const fetchMasterPlans = React.useCallback(() => {
    api
      .listMasterPlans()
      .then((dbPlans) => {
        if (dbPlans && Array.isArray(dbPlans)) {
          const mapped: MasterPlanItem[] = dbPlans.map((p: any) => ({
            id: p.id,
            projectId: p.project_id,
            projectName: p.project_name,
            workType: p.work_type,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));
          setMasterPlans(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load master plans from DB:', err);
      });
  }, []);

  React.useEffect(() => {
    if (!user) return;
    fetchProjects();
    fetchTasks();
    fetchClients();
    fetchAdmins();
    fetchMasterPlans();
  }, [user, fetchProjects, fetchTasks, fetchClients, fetchAdmins, fetchMasterPlans]);

  // Re-fetch latest projects and tasks whenever navigating to Projects tab
  React.useEffect(() => {
    if (!user) return;
    if (activeTab === 'projects') {
      fetchProjects();
      fetchTasks();
    }
  }, [user, activeTab, fetchProjects, fetchTasks]);

  // Fetch real audit logs directly from PostgreSQL Database (Admins & Super Admins only)
  React.useEffect(() => {
    if (!user || userRole === 'EMPLOYEE') return;
    api
      .getAuditLogs(50)
      .then((dbLogs) => {
        if (dbLogs && Array.isArray(dbLogs)) {
          const mapped: AuditLogItem[] = dbLogs.map((l: any) => ({
            id: l.id,
            action: l.action,
            actor: user && user.id === l.user_id ? user.full_name : 'System Administrator',
            entityType: l.entity_type,
            entityId: l.entity_id || '-',
            timestamp: l.created_at ? new Date(l.created_at).toLocaleString() : 'Just now',
            ipAddress: l.ip_address || '127.0.0.1',
            oldValues: l.old_values,
            newValues: l.new_values,
          }));
          setAuditLogs(mapped);
        }
      })
      .catch(() => { });
  }, [user, userRole]);

  // Modals visibility
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isGeneralTaskOpen, setIsGeneralTaskOpen] = useState(false);
  const [isProjectTaskOpen, setIsProjectTaskOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

  // Handlers
  const handleAddProject = async (newProject: ProjectItem, autoTasks?: TaskItem[]) => {
    // 1. Optimistically display in UI
    setProjects((prev) => [newProject, ...prev]);
    if (autoTasks && autoTasks.length > 0) {
      setTasks((prev) => [...autoTasks, ...prev]);
    }

    // 2. Persist in PostgreSQL database via API
    try {
      await api.createProject({
        name: newProject.name,
        code: newProject.code,
        client: newProject.client,
        client_details: newProject.clientDetails,
        platform: newProject.platform,
        project_type: newProject.projectType,
        description: newProject.description,
        status: newProject.status,
        progress: newProject.progress,
        priority: newProject.priority,
        start_date: newProject.startDate,
        end_date: newProject.endDate,
        duration_days: newProject.durationDays,
        manager: newProject.manager,
        assigned_employees: newProject.assignedEmployees,
        technologies: newProject.technologies,
        platforms: newProject.platforms,
        sub_portals: newProject.subPortals,
        modules: newProject.modules || [],
        sprints: newProject.sprints || [],
        work_types: newProject.workTypes || [],
        tasks: autoTasks,
      });

      // Update state with actual DB UUID and sync latest
      fetchProjects();
      fetchTasks();
    } catch (err) {
      console.error('Failed to persist project to database:', err);
    }

    // Log audit action
    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      action: 'CREATE_PROJECT',
      actor: user?.full_name || 'Administrator',
      entityType: 'Project',
      entityId: newProject.code,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
      newValues: {
        name: newProject.name,
        client: newProject.client,
        platform: newProject.platform,
        technologies: newProject.technologies,
        autoTasksCreated: autoTasks?.length || 0,
      },
    };
    setAuditLogs([newLog, ...auditLogs]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Project Created',
      message: `Project ${newProject.name} (${newProject.code}) initiated with ${autoTasks?.length || 0} default tasks.`,
      type: 'ALERT',
      isRead: false,
      timestamp: 'Just now',
      relatedEntityId: newProject.id,
    };
    setNotifications([newNotif, ...notifications]);
  };

  const handleAddMultipleTasks = async (newTasks: TaskItem[]) => {
    // 1. Optimistic UI update
    setTasks((prevTasks) => [...newTasks, ...prevTasks]);

    // 2. Persist in PostgreSQL database
    try {
      await api.createTasksBatch(newTasks);
      fetchTasks();
    } catch (err) {
      console.error('Failed to persist assigned tasks to database:', err);
    }

    // Create Audit Log entries
    const newLogs: AuditLogItem[] = newTasks.map((t, idx) => ({
      id: `aud-${Date.now()}-${idx}`,
      action: 'ASSIGN_TASK',
      actor: user?.full_name || 'Administrator',
      entityType: 'Task',
      entityId: t.code,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
      newValues: {
        title: t.title,
        assignee: t.assignee.name,
        project: t.project,
        module: t.module,
        sprint: t.sprint,
        dueDate: t.dueDate,
      },
    }));
    setAuditLogs((prevLogs) => [...newLogs, ...prevLogs]);

    // Send individual personalized notification to each assigned employee
    const individualNotifs: NotificationItem[] = newTasks.map((t, idx) => {
      const details = [t.workType, t.module, t.sprint].filter(Boolean).join(' • ');
      return {
        id: `notif-${Date.now()}-${idx}`,
        title: `Task Assigned: ${t.assignee.name}`,
        message: `You have been assigned to "${t.title}" for ${t.project}${details ? ` (${details})` : ''}. Target Due Date: ${t.dueDate}.`,
        type: 'ASSIGNMENT',
        isRead: false,
        timestamp: 'Just now',
        relatedEntityId: t.id,
      };
    });
    setNotifications((prevNotifs) => [...individualNotifs, ...prevNotifs]);
  };

  const handleAddTask = async (newTask: TaskItem, sendNotification: boolean = true) => {
    // 1. Optimistic UI
    setTasks((prevTasks) => [newTask, ...prevTasks]);

    // 2. Persist to DB
    try {
      await api.createTasksBatch([newTask]);
      fetchTasks();
    } catch (err) {
      console.error('Failed to create general task in database:', err);
    }

    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      action: 'ASSIGN_TASK',
      actor: user?.full_name || 'Administrator',
      entityType: 'Task',
      entityId: newTask.code,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
      newValues: { title: newTask.title, assignee: newTask.assignee.name },
    };
    setAuditLogs((prevLogs) => [newLog, ...prevLogs]);

    if (sendNotification) {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `Task Assigned: ${newTask.assignee.name}`,
        message: `You have been assigned to "${newTask.title}". Target Due Date: ${newTask.dueDate}.`,
        type: 'ASSIGNMENT',
        isRead: false,
        timestamp: 'Just now',
        relatedEntityId: newTask.id,
      };
      setNotifications((prevNotifs) => [newNotif, ...prevNotifs]);
    }
  };

  const handleUpdateTask = async (updatedTask: TaskItem) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));

    try {
      await api.updateTask(updatedTask.id, {
        title: updatedTask.title,
        module: updatedTask.module,
        sprint: updatedTask.sprint,
        work_type: updatedTask.workType,
        status: updatedTask.status,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate,
        start_date: updatedTask.startDate,
        description: updatedTask.description,
        daily_logs: updatedTask.dailyLogs,
        task_notifications: updatedTask.taskNotifications,
        estimated_hours: updatedTask.estimatedHours,
        logged_hours: updatedTask.loggedHours,
        developer_deadline: updatedTask.developerDeadline,
        assignee: updatedTask.assignee,
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task in DB:', err);
    }

    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      action: 'UPDATE_TASK',
      actor: user?.full_name || 'Administrator',
      entityType: 'Task',
      entityId: updatedTask.code,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
      newValues: {
        title: updatedTask.title,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignee: updatedTask.assignee.name,
      },
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleDeleteTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));

    try {
      await api.deleteTask(taskId);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete task from DB:', err);
    }

    if (target) {
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}`,
        action: 'DELETE_TASK',
        actor: user?.full_name || 'Administrator',
        entityType: 'Task',
        entityId: target.code,
        timestamp: 'Just now',
        ipAddress: '192.168.1.104',
        newValues: { title: target.title, project: target.project },
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    // 1. Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // 2. Persist in PostgreSQL
    try {
      await api.updateTaskStatus(taskId, newStatus);
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task status in DB:', err);
    }
  };

  const handleLogTaskHours = async (taskId: string, hours: number, note: string) => {
    // 1. Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, loggedHours: (t.loggedHours || 0) + hours } : t
      )
    );

    // 2. Persist in PostgreSQL
    try {
      await api.logTaskHours(taskId, hours);
      fetchTasks();
    } catch (err) {
      console.error('Failed to log task hours in DB:', err);
    }

    const target = tasks.find((t) => t.id === taskId);
    if (target) {
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}`,
        action: 'LOG_TIME',
        actor: user?.full_name || 'Employee',
        entityType: 'Task',
        entityId: target.code,
        timestamp: 'Just now',
        ipAddress: '192.168.1.104',
        newValues: { addedHours: hours, note },
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
  };

  const handleRequestExtension = (taskId: string, extraDays: number, reason: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, isEscalated: true } : t))
    );

    const newNotif: NotificationItem = {
      id: `notif-ext-${Date.now()}`,
      title: `Deadline Extension Request: ${target.code}`,
      message: `${user?.full_name || 'Employee'} requested +${extraDays} days extension on "${target.title}". Reason: ${reason}`,
      type: 'EXTENSION_REQUEST',
      isRead: false,
      timestamp: 'Just now',
      relatedEntityId: target.id,
    };
    setNotifications([newNotif, ...notifications]);
  };

  const handleAddClient = async (newClient: ClientItem) => {
    // 1. Optimistic UI update
    setClients((prev) => [newClient, ...prev]);

    // 2. Persist in PostgreSQL database
    try {
      await api.createClient({
        company_name: newClient.companyName,
        contact_person: newClient.contactPerson,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        active_projects: newClient.activeProjects,
        status: newClient.status,
        avatar: newClient.avatar,
      });
      fetchClients();
    } catch (err) {
      console.error('Failed to create client in database:', err);
    }
  };

  const handleUpdateClient = async (updatedClient: ClientItem) => {
    try {
      await api.updateClient(updatedClient.id, {
        company_name: updatedClient.companyName,
        contact_person: updatedClient.contactPerson,
        email: updatedClient.email,
        phone: updatedClient.phone,
        address: updatedClient.address,
        active_projects: updatedClient.activeProjects,
        status: updatedClient.status,
        avatar: updatedClient.avatar,
      });
      fetchClients();
    } catch (err) {
      console.error('Failed to update client in database:', err);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await api.deleteClient(clientId);
      fetchClients();
    } catch (err) {
      console.error('Failed to delete client from database:', err);
    }
  };

  const handleAddAdmin = async (newAdmin: AdminUserItem) => {
    // 1. Optimistic UI update
    setAdmins((prev) => [newAdmin, ...prev]);

    // 2. Persist in PostgreSQL Database via FastAPI backend
    try {
      await api.createAdmin({
        full_name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password || 'UserSecret123!',
        phone: newAdmin.phone,
        role: newAdmin.role,
      });
      fetchAdmins();
    } catch (err) {
      console.error('Failed to create user in database:', err);
    }

    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      action: 'CREATE_ADMIN',
      actor: user?.full_name || 'Super Admin',
      entityType: 'User',
      entityId: newAdmin.email,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
      newValues: { name: newAdmin.name, role: newAdmin.role, email: newAdmin.email },
    };
    setAuditLogs([newLog, ...auditLogs]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Account Onboarded',
      message: `${newAdmin.name} (${newAdmin.role}) has been added to the system and is now available across all task assignment menus.`,
      type: 'ALERT',
      isRead: false,
      timestamp: 'Just now',
    };
    setNotifications([newNotif, ...notifications]);
  };

  const handleUpdateAdminStatus = async (
    adminId: string,
    newStatus: AdminUserItem['status']
  ) => {
    // 1. Optimistic UI update
    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, status: newStatus } : a))
    );

    // 2. Persist status change in PostgreSQL Database
    try {
      await api.updateAdminStatus(adminId, newStatus);
      fetchAdmins();
    } catch (err) {
      console.error('Failed to update admin status in database:', err);
    }

    const target = admins.find((a) => a.id === adminId);
    if (target) {
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}`,
        action: newStatus === 'BANNED' ? 'BAN_ADMIN' : 'STATUS_CHANGE',
        actor: 'Super Admin',
        entityType: 'User',
        entityId: `${target.name} (${target.email})`,
        timestamp: 'Just now',
        ipAddress: '192.168.1.104',
        oldValues: { status: target.status },
        newValues: { status: newStatus },
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
  };

  const handleUpdateAdmin = async (updatedAdmin: AdminUserItem) => {
    // 1. Optimistic UI update
    setAdmins((prev) =>
      prev.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a))
    );

    // 2. Persist in PostgreSQL database
    try {
      await api.updateAdmin(updatedAdmin.id, {
        full_name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        role: updatedAdmin.role,
        profile_image: updatedAdmin.avatar,
        status: updatedAdmin.status,
        password: updatedAdmin.password,
      });
      fetchAdmins();
    } catch (err) {
      console.error('Failed to update admin in DB:', err);
    }

    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      action: 'UPDATE_ADMIN',
      actor: user?.full_name || 'Super Admin',
      entityType: 'User',
      entityId: updatedAdmin.email,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
      newValues: {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
        status: updatedAdmin.status,
      },
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    const target = admins.find((a) => a.id === adminId);
    setAdmins((prev) => prev.filter((a) => a.id !== adminId));

    try {
      await api.deleteAdmin(adminId);
      fetchAdmins();
    } catch (err) {
      console.error('Failed to delete admin in DB:', err);
    }

    if (target) {
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}`,
        action: 'DELETE_ADMIN',
        actor: user?.full_name || 'Super Admin',
        entityType: 'User',
        entityId: target.email,
        timestamp: 'Just now',
        ipAddress: '192.168.1.104',
        newValues: { name: target.name, role: target.role },
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleUpdateProjectStatus = async (
    projectId: string,
    newStatus: ProjectItem['status']
  ) => {
    setProjects(
      projects.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );
    try {
      await api.updateProject(projectId, { status: newStatus });
      fetchProjects();
    } catch (err) {
      console.error('Failed to update project status in DB:', err);
    }
  };

  const handleAssignEmployeeToProject = async (
    projectId: string,
    employee: AdminUserItem
  ) => {
    // 1. Optimistic UI update
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentList = p.assignedEmployees || [];
        if (currentList.some((e) => e.id === employee.id || (e.email && e.email.toLowerCase() === employee.email.toLowerCase()))) {
          return p;
        }
        return {
          ...p,
          assignedEmployees: [
            ...currentList,
            {
              id: employee.id,
              name: employee.name,
              avatar: employee.avatar,
              role: employee.role,
              email: employee.email,
            },
          ],
        };
      })
    );

    // 2. Persist in PostgreSQL
    try {
      await api.assignEmployeeToProject(projectId, employee);
      fetchProjects();
    } catch (err) {
      console.error('Failed to assign employee to project in DB:', err);
    }
  };

  const handleUpdateProject = async (updatedProject: ProjectItem) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );

    try {
      const res = await api.updateProject(updatedProject.id, {
        name: updatedProject.name,
        client: updatedProject.client,
        platform: updatedProject.platform,
        project_type: updatedProject.projectType,
        description: updatedProject.description,
        status: updatedProject.status,
        progress: updatedProject.progress,
        priority: updatedProject.priority,
        start_date: updatedProject.startDate,
        end_date: updatedProject.endDate,
        duration_days: updatedProject.durationDays,
        manager: updatedProject.manager,
        assigned_employees: updatedProject.assignedEmployees,
        technologies: updatedProject.technologies,
        modules: updatedProject.modules || [],
        sprints: updatedProject.sprints || [],
        work_types: updatedProject.workTypes || [],
      });
      if (res && res.id) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === res.id
              ? {
                  ...p,
                  modules: res.modules || [],
                  sprints: (res.sprints || []).map((s: any, idx: number) =>
                    typeof s === 'string'
                      ? { id: `sp-${idx + 1}`, name: s, status: 'Active' as const }
                      : s
                  ),
                  workTypes: res.work_types || res.workTypes || [],
                }
              : p
          )
        );
      }
      fetchProjects();
    } catch (err) {
      console.error('Failed to update project in DB:', err);
    }

    const newLog: AuditLogItem = {
      id: `aud-${Date.now()}`,
      action: 'UPDATE_PROJECT',
      actor: user?.full_name || 'Administrator',
      entityType: 'Project',
      entityId: updatedProject.code,
      timestamp: 'Just now',
      ipAddress: '192.168.1.104',
      newValues: { name: updatedProject.name, status: updatedProject.status },
    };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const handleDeleteProject = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    try {
      await api.deleteProject(projectId);
      fetchProjects();
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete project from DB:', err);
    }

    if (target) {
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}`,
        action: 'DELETE_PROJECT',
        actor: user?.full_name || 'Administrator',
        entityType: 'Project',
        entityId: target.code,
        timestamp: 'Just now',
        ipAddress: '192.168.1.104',
        newValues: { name: target.name, client: target.client },
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleApproveExtension = (notifId: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === notifId
          ? {
            ...n,
            isRead: true,
            message: `${n.message} (Approved by ${user?.full_name || 'Admin'})`,
          }
          : n
      )
    );
  };

  const handleRejectExtension = (notifId: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === notifId
          ? {
            ...n,
            isRead: true,
            message: `${n.message} (Rejected by ${user?.full_name || 'Admin'})`,
          }
          : n
      )
    );
  };

  const handleSendNotification = (notif: {
    title: string;
    message: string;
    type: NotificationItem['type'];
    relatedEntityId?: string;
    senderName?: string;
    senderRole?: string;
  }) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: notif.title,
      message: notif.message,
      type: notif.type || 'ALERT',
      isRead: false,
      timestamp: 'Just now',
      relatedEntityId: notif.relatedEntityId,
      senderName: notif.senderName,
      senderRole: notif.senderRole,
      status: 'Pending',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Master Plan Handlers
  const handleCreateMasterPlan = async (data: { project_id?: string; project_name?: string; work_type: string }) => {
    try {
      await api.createMasterPlan(data);
      fetchMasterPlans();
    } catch (err: any) {
      console.error('Failed to create Master Plan:', err);
      throw err;
    }
  };

  const handleDeleteMasterPlan = async (id: string) => {
    try {
      await api.deleteMasterPlan(id);
      fetchMasterPlans();
    } catch (err: any) {
      console.error('Failed to delete Master Plan:', err);
      throw err;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // If user is not logged in, render SetupPage (if unbootstrapped) or LoginPage
  if (!user) {
    if (showSetup || !isBootstrapped) {
      return (
        <SetupPage
          onSuccess={() => {
            setShowSetup(false);
            setIsBootstrapped(true);
          }}
          onCancel={() => setShowSetup(false)}
        />
      );
    }
    return (
      <LoginPage
        onGoToSetup={() => setShowSetup(true)}
        showSetupPrompt={!isBootstrapped}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased">
      {/* Deep Navy Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        userRole={userRole}
        unreadCount={unreadCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onSelectTab={handleNavigateTab}
          userRole={userRole}
          unreadNotificationsCount={unreadCount}
          currentUser={user}
          onLogout={logout}
        />

        {/* Dynamic Page Rendering */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Employee Specialized Portal View */}
          {userRole === 'EMPLOYEE' ? (
            <>
              {activeTab === 'dashboard' && (
                <EmployeePortalPage
                  tasks={tasks}
                  projects={projects}
                  currentUser={user}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onLogTaskHours={handleLogTaskHours}
                  onRequestExtension={handleRequestExtension}
                  onNavigateToProjects={() => handleNavigateTab('projects')}
                />
              )}

              {activeTab === 'projects' && (
                <EmployeeProjectsPortal
                  projects={projects}
                  tasks={tasks}
                  currentUser={user}
                  userRole={userRole}
                  onUpdateTask={handleUpdateTask}
                  onLogTaskHours={handleLogTaskHours}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                />
              )}

              {activeTab === 'general-tasks' && (
                <GeneralTasksPage
                  tasks={tasks}
                  userRole={userRole}
                  currentUser={user}
                  onOpenCreateTask={() => setIsGeneralTaskOpen(true)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onSendNotification={handleSendNotification}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsPage
                  notifications={notifications}
                  onMarkAllRead={handleMarkAllRead}
                  onApproveExtension={handleApproveExtension}
                  onRejectExtension={handleRejectExtension}
                />
              )}

              {activeTab === 'settings' && <SettingsPage />}
            </>
          ) : (
            /* Super Admin and Admin Views */
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  projects={projects}
                  userRole={userRole}
                  onNavigateTab={handleNavigateTab}
                  onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                  onOpenAssignGeneralTask={() => setIsGeneralTaskOpen(true)}
                  onOpenAssignProjectTask={() => setIsProjectTaskOpen(true)}
                  onOpenAddClient={() => setIsAddClientOpen(true)}
                  onSelectProject={(project) => {
                    setInitialProjectIdForTasks(project.id);
                    handleNavigateTab('projects');
                  }}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsPage
                  projects={projects}
                  tasks={tasks}
                  masterPlans={masterPlans}
                  initialSelectedProjectId={initialProjectIdForTasks}
                  currentUser={user}
                  userRole={userRole}
                  onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                  onSelectProjectForTasks={(project) => {
                    setInitialProjectIdForTasks(project.id);
                    handleNavigateTab('projects');
                  }}
                  onUpdateProjectStatus={handleUpdateProjectStatus}
                  onAssignEmployee={handleAssignEmployeeToProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  adminsList={admins}
                  onOpenCreateProjectTask={() => setIsProjectTaskOpen(true)}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onLogTaskHours={handleLogTaskHours}
                  onSendNotification={handleSendNotification}
                  onCreateMasterPlan={handleCreateMasterPlan}
                  onDeleteMasterPlan={handleDeleteMasterPlan}
                  onAddTasks={handleAddMultipleTasks}
                />
              )}

              {activeTab === 'general-tasks' && (
                <GeneralTasksPage
                  tasks={tasks}
                  userRole={userRole}
                  currentUser={user}
                  adminsList={admins}
                  onAddTask={handleAddTask}
                  onOpenCreateTask={() => setIsGeneralTaskOpen(true)}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onSendNotification={handleSendNotification}
                />
              )}

              {activeTab === 'clients' && (
                <ClientsPage
                  clients={clients}
                  onOpenAddClient={() => setIsAddClientOpen(true)}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  userRole={userRole}
                />
              )}

              {activeTab === 'admin-management' && (
                <AdminManagementPage
                  admins={admins}
                  tasks={tasks}
                  projects={projects}
                  onOpenCreateAdmin={() => setIsCreateAdminOpen(true)}
                  onUpdateAdmin={handleUpdateAdmin}
                  onDeleteAdmin={handleDeleteAdmin}
                  onUpdateAdminStatus={handleUpdateAdminStatus}
                />
              )}

              {activeTab === 'audit-logs' && <AuditLogsPage logs={auditLogs} />}

              {activeTab === 'notifications' && (
                <NotificationsPage
                  notifications={notifications}
                  onMarkAllRead={handleMarkAllRead}
                  onApproveExtension={handleApproveExtension}
                  onRejectExtension={handleRejectExtension}
                />
              )}

              {activeTab === 'settings' && <SettingsPage />}
            </>
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onAddProject={handleAddProject}
        clientsList={clients}
        onOpenAddClient={() => setIsAddClientOpen(true)}
        managersList={admins}
      />

      <CreateGeneralTaskModal
        isOpen={isGeneralTaskOpen}
        onClose={() => setIsGeneralTaskOpen(false)}
        onAddTask={handleAddTask}
        employeesList={admins}
      />

      <CreateProjectTaskModal
        isOpen={isProjectTaskOpen}
        onClose={() => setIsProjectTaskOpen(false)}
        onAddTasks={handleAddMultipleTasks}
        projects={projects}
        adminsList={admins}
        onAddNewEmployee={handleAddAdmin}
        masterPlans={masterPlans}
        onCreateMasterPlan={handleCreateMasterPlan}
        onUpdateProject={handleUpdateProject}
      />

      <CreateClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onAddClient={handleAddClient}
      />

      <CreateAdminModal
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
        onAddAdmin={handleAddAdmin}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
