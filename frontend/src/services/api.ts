import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Orders API
export const ordersApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/orders?skip=${skip}&limit=${limit}`),
  get: (id: number) => api.get(`/api/v1/orders/${id}`),
  create: (data: any) => api.post('/api/v1/orders', data),
};

// Materials API
export const materialsApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/materials?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/materials', data),
};

// Resources API
export const resourcesApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/resources?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/resources', data),
};

// BOM API
export const bomApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/bom?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/bom', data),
};

// Calendar API
export const calendarApi = {
  list: (skip = 0, limit = 100) => api.get(`/api/v1/calendar?skip=${skip}&limit=${limit}`),
  create: (data: any) => api.post('/api/v1/calendar', data),
};

// Scheduling API
export const schedulingApi = {
  run: (data: { order_ids: number[]; config_id?: number; async_mode?: boolean }) =>
    api.post('/api/v1/scheduling/run', data),
  listSchedules: (skip = 0, limit = 100) =>
    api.get(`/api/v1/scheduling/schedules?skip=${skip}&limit=${limit}`),
  getSchedule: (id: number) => api.get(`/api/v1/scheduling/schedules/${id}`),
  analyzeSchedules: (schedule_ids: number[]) =>
    api.post('/api/v1/scheduling/analyze', schedule_ids),
};

// Chat API
export const chatApi = {
  sendMessage: (message: string, context?: any) =>
    api.post('/api/v1/chat/message', { message, context }),
};
