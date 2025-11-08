import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Email API
export const emailAPI = {
  send: (data) => api.post('/emails/send', data),
  saveDraft: (data) => api.post('/emails/drafts', data),
  saveToOutbox: (data) => api.post('/emails/outbox', data),
  recallEmail: (id) => api.post(`/emails/${id}/recall`),
  processOutbox: () => api.post('/emails/outbox/process'),
  getByFolder: (folder, params) => api.get(`/emails/folder/${folder}`, { params }),
  getById: (id) => api.get(`/emails/${id}`),
  update: (id, data) => api.patch(`/emails/${id}`, data),
  delete: (id, permanent) => api.delete(`/emails/${id}`, { params: { permanent } }),
  search: (query, params) => api.get('/emails/search', { params: { q: query, ...params } }),
  uploadAttachment: (formData) => api.post('/emails/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  bulkOperation: (emailIds, action, data) => api.post('/emails/bulk', { emailIds, action, data })
};

// User API
export const userAPI = {
  createEmployee: (data) => api.post('/users/employees', data),
  getAllEmployees: (params) => api.get('/users/employees', { params }),
  getEmployee: (id) => api.get(`/users/employees/${id}`),
  updateEmployee: (id, data) => api.put(`/users/employees/${id}`, data),
  deactivate: (id) => api.post(`/users/employees/${id}/deactivate`),
  reactivate: (id) => api.post(`/users/employees/${id}/reactivate`),
  deleteEmployee: (id) => api.delete(`/users/employees/${id}`),
  getAuditLogs: (params) => api.get('/users/audit-logs', { params })
};
