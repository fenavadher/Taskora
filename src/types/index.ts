export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Task {
  id: string;
  user: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  dueDate: string | null;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
  completedToday: number;
  completionRate: number;
}

export interface DailyProgressPoint {
  date: string;
  label: string;
  completed: number;
  created: number;
}

export interface DashboardPayload {
  stats: TaskStats;
  dailyProgress: DailyProgressPoint[];
  alerts: Task[];
  categories: string[];
}

export interface DbStatus {
  configured: boolean;
  connected: boolean;
  readyState: number;
  error: string | null;
}

export interface HealthResponse {
  success: boolean;
  service: string;
  database: DbStatus;
  timestamp: string;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  view?: 'all' | 'today' | 'completed';
  sort?: 'newest' | 'oldest' | 'dueDate_asc' | 'dueDate_desc' | 'priority';
}
