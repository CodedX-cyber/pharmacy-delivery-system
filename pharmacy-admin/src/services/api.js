import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/admin/login', credentials),
};

export const drugsAPI = {
  getAll: () => api.get('/admin/drugs'),
  create: (drugData) => api.post('/admin/drugs', drugData),
  update: (id, drugData) => api.put(`/admin/drugs/${id}`, drugData),
  delete: (id) => api.delete(`/admin/drugs/${id}`),
};

export const ordersAPI = {
  getAll: (status) => {
    const params = status ? { status } : {};
    return api.get('/admin/orders', { params });
  },
  updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  getById: (id) => api.get(`/orders/${id}`),
};

export default api;
