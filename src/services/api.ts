import axios from 'axios';
import type {
  DashboardPayload,
  HealthResponse,
  Task,
  TaskFilters,
  TaskPayload,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Keep JWT in JS memory (never in localStorage or sessionStorage)
let inMemoryToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export const setApiToken = (token: string | null): void => {
  inMemoryToken = token;
};

export const getApiToken = (): string | null => inMemoryToken;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')
    ) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong.'): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export const systemApi = {
  async getHealth(): Promise<HealthResponse> {
    const { data } = await apiClient.get<HealthResponse>('/health');
    return data;
  },
  getExportZipUrl(): string {
    return `${API_BASE_URL}/export-zip`;
  },
};

export const authApi = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post<{ success: boolean; token: string; user: User }>(
      '/auth/register',
      payload
    );
    return { token: data.token, user: data.user };
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post<{ success: boolean; token: string; user: User }>(
      '/auth/login',
      payload
    );
    return { token: data.token, user: data.user };
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};

export const tasksApi = {
  async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    const tzOffset = new Date().getTimezoneOffset();
    const { data } = await apiClient.get<{ success: boolean; tasks: Task[] }>('/tasks', {
      params: { ...filters, tzOffset },
    });
    return data.tasks;
  },

  async getStats(): Promise<DashboardPayload> {
    const tzOffset = new Date().getTimezoneOffset();
    const { data } = await apiClient.get<DashboardPayload & { success: boolean }>(
      '/tasks/stats',
      {
        params: { tzOffset },
      }
    );
    return {
      stats: data.stats,
      dailyProgress: data.dailyProgress,
      alerts: data.alerts,
      categories: data.categories,
    };
  },

  async createTask(payload: TaskPayload): Promise<Task> {
    const { data } = await apiClient.post<{ success: boolean; task: Task }>('/tasks', payload);
    return data.task;
  },

  async updateTask(id: string, payload: Partial<TaskPayload>): Promise<Task> {
    const { data } = await apiClient.patch<{ success: boolean; task: Task }>(
      `/tasks/${id}`,
      payload
    );
    return data.task;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },
};
