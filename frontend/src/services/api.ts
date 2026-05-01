import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) => 
    api.post('/api/v1/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data: { username: string; email: string; password: string; full_name?: string }) =>
    api.post('/api/v1/auth/register', data),
  me: () => api.get('/api/v1/auth/me'),
  updateMe: (data: { full_name?: string; email?: string }) =>
    api.put('/api/v1/auth/me', data),
};

export const ordersApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/orders?skip=${skip}&limit=${limit}`),
  get: (id: number) => api.get(`/api/v1/orders/${id}`),
  create: (data: any) => api.post('/api/v1/orders', data),
};

export const materialsApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/materials?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/materials', data),
};

export const resourcesApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/resources?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/resources', data),
};

export const bomApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/bom?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/bom', data),
};

export const calendarApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/calendar?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/calendar', data),
};

export const schedulingApi = {
  run: (data: { order_ids: number[]; config_id?: number; async_mode?: boolean }) =>
    api.post('/api/v1/scheduling/run', data),
  listSchedules: (skip = 0, limit = 100) =>
    api.get(`/api/v1/scheduling/schedules?skip=${skip}&limit=${limit}`),
  getSchedule: (id: number) => api.get(`/api/v1/scheduling/schedules/${id}`),
  analyzeSchedules: (schedule_ids: number[]) =>
    api.post('/api/v1/scheduling/analyze', schedule_ids),
};

export const chatApi = {
  sendMessage: (message: string, context?: any) =>
    api.post('/api/v1/chat/message', { message, context }),
};