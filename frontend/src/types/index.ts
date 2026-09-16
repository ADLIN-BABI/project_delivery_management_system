export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'BANNED' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  profile_image?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface DatabaseHealth {
  status: string;
  database: string;
  version: string;
  timestamp: string;
  details?: {
    latency_ms: number;
    public_table_count: number;
    user_count?: number;
    audit_log_count?: number;
    pool_status?: {
      pool_size: number;
      checked_in_connections: number;
      checked_out_connections: number;
      overflow_connections: number;
    };
  };
}

export interface BootstrapStatus {
  is_bootstrapped: boolean;
  super_admin_email?: string | null;
}

export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  client: string;
  clientLogo?: string;
  clientDetails?: {
    contactPerson: string;
    email: string;
    phone: string;
  };
  platform?: string;
  technologies?: string[];
  projectType?: string;
  modules?: string[];
  sprints?: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
    status?: 'Active' | 'Upcoming' | 'Completed';
  }[];
  workTypes?: string[];
  durationDays?: number;
  description?: string;
  manager: {
    name: string;
    avatar: string;
    role: string;
  };
  assignedEmployees?: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    email?: string;
  }[];
  status: 'In Progress' | 'Pending' | 'Completed' | 'On Hold' | 'Cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  platforms: string[];
  subPortals: string[];
}

export interface DeliveryItem {
  id: string;
  deliveryId: string;
  project: string;
  agent: {
    name: string;
    avatar: string;
    phone: string;
  };
  destination: string;
  deliveryDate: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Delayed';
  priority: 'Standard' | 'Express' | 'Urgent';
  itemsCount: number;
  notes?: string;
}

export interface DailyWorkLog {
  id: string;
  date: string;
  startHour: string; // e.g. "09:30 AM" or "09:30"
  endHour: string;   // e.g. "06:00 PM" or "18:00"
  hoursSpent: number;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed' | 'Blocked';
  description: string;
  loggedBy: string;
  loggedByAvatar?: string;
  loggedByRole?: string;
  createdAt?: string;
}

export interface TaskNotification {
  id: string;
  taskId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  isRead?: boolean;
  status?: 'Pending' | 'Acknowledged' | 'Resolved';
  timestamp: string;
}

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  project?: string;
  module?: string;
  sprint?: string;
  workType?: 'UI' | 'API' | 'BACKEND' | 'FRONTEND' | 'DATABASE' | 'TESTING' | 'BUG_FIX' | 'DOCUMENTATION' | string;
  assignee: {
    name: string;
    email?: string;
    avatar: string;
    role: string;
  };
  status: 'To Do' | 'In Progress' | 'In Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  startDate?: string;
  dueDate: string;
  description?: string;
  estimatedHours: number;
  loggedHours: number;
  designerDeadline?: string;
  developerDeadline?: string;
  qaDeadline?: string;
  isEscalated?: boolean;
  dailyLogs?: DailyWorkLog[];
  taskNotifications?: TaskNotification[];
}

export interface ClientItem {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  activeProjects: number;
  status: 'Active' | 'Inactive';
  avatar: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE';
  avatar: string;
  lastLogin: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'ASSIGNMENT' | 'EXTENSION_REQUEST' | 'DELIVERY';
  isRead: boolean;
  timestamp: string;
  relatedEntityId?: string;
  senderName?: string;
  senderRole?: string;
  status?: 'Pending' | 'Acknowledged' | 'Resolved';
}

export interface MasterPlanItem {
  id: string;
  projectId?: string | null;
  projectName?: string | null;
  workType: string; // Work Type / Full Work
  createdAt?: string;
  updatedAt?: string;
}

