import {
  AuthResponse,
  BootstrapStatus,
  DatabaseHealth,
  User,
  UserStatus,
  AuditLog,
  MasterPlanItem,
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('pdm_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // System & Health
  checkBootstrapStatus: () => request<BootstrapStatus>('/auth/bootstrap-status'),
  getDatabaseHealth: () => request<DatabaseHealth>('/health/db'),

  // Auth & Setup
  bootstrapSuperAdmin: (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }) => request<AuthResponse>('/auth/bootstrap-super-admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => request<User>('/auth/me'),

  // Admin Management
  listAdmins: () => request<User[]>('/admins'),

  createAdmin: (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) =>
    request<User>('/admins', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAdmin: (
    adminId: string,
    payload: {
      full_name?: string;
      email?: string;
      password?: string;
      phone?: string;
      role?: string;
      profile_image?: string;
      status?: string;
    }
  ) =>
    request<User>(`/admins/${adminId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteAdmin: (adminId: string) =>
    request<void>(`/admins/${adminId}`, {
      method: 'DELETE',
    }),

  updateAdminStatus: (adminId: string, status: UserStatus) =>
    request<User>(`/admins/${adminId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getAuditLogs: (limit = 30) =>
    request<AuditLog[]>(`/admins/audit-logs/recent?limit=${limit}`),

  // Projects & Tasks Database API
  listProjects: () => request<any[]>('/projects'),

  createProject: (payload: any) =>
    request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteProject: (projectId: string) =>
    request<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    }),

  updateProject: (projectId: string, payload: any) =>
    request<any>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  assignEmployeeToProject: (projectId: string, employee: any) =>
    request<any>(`/projects/${projectId}/assign-employee`, {
      method: 'PATCH',
      body: JSON.stringify({ employee }),
    }),

  listAllTasks: () => request<any[]>('/projects/tasks/all'),

  createTasksBatch: (tasks: any[]) =>
    request<any[]>('/projects/tasks/batch', {
      method: 'POST',
      body: JSON.stringify(tasks),
    }),

  updateTask: (taskId: string, payload: any) =>
    request<any>(`/projects/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteTask: (taskId: string) =>
    request<void>(`/projects/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  updateTaskStatus: (taskId: string, status: string) =>
    request<any>(`/projects/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  logTaskHours: (taskId: string, hours: number) =>
    request<any>(`/projects/tasks/${taskId}/log-hours`, {
      method: 'PATCH',
      body: JSON.stringify({ hours }),
    }),

  // Clients Directory Database API
  listClients: () => request<any[]>('/clients'),

  createClient: (payload: any) =>
    request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateClient: (clientId: string, payload: any) =>
    request<any>(`/clients/${clientId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteClient: (clientId: string) =>
    request<void>(`/clients/${clientId}`, {
      method: 'DELETE',
    }),

  // Deliveries Database API
  listDeliveries: () => request<any[]>('/deliveries'),

  createDelivery: (payload: any) =>
    request<any>('/deliveries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDeliveryStatus: (deliveryId: string, status: string) =>
    request<any>(`/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Master Plans Database API
  listMasterPlans: (params?: { projectId?: string; projectName?: string }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.projectName) query.append('project_name', params.projectName);
    const qs = query.toString();
    return request<MasterPlanItem[]>(`/master-plans${qs ? `?${qs}` : ''}`);
  },

  createMasterPlan: (payload: { project_id?: string; project_name?: string; work_type: string }) =>
    request<MasterPlanItem>('/master-plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMasterPlan: (planId: string, payload: Partial<{ project_id?: string; project_name?: string; work_type: string }>) =>
    request<MasterPlanItem>(`/master-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteMasterPlan: (planId: string) =>
    request<void>(`/master-plans/${planId}`, {
      method: 'DELETE',
    }),
};
