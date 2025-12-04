// Mock API for demo purposes
const mockApi = {
  get: (url) => Promise.resolve({ data: getMockData(url) }),
  post: (url, data) => Promise.resolve({ data: { success: true, ...data } }),
  put: (url, data) => Promise.resolve({ data: { success: true, ...data } }),
  delete: (url) => Promise.resolve({ data: { success: true } })
};

function getMockData(url) {
  if (url.includes('/auth/login')) {
    return { token: 'mock-token', user: { email: 'admin@pharmacy.com' } };
  }
  if (url.includes('/dashboard')) {
    return { 
      totalOrders: 156, 
      totalRevenue: 45678, 
      pendingOrders: 23,
      todayOrders: 12
    };
  }
  if (url.includes('/orders')) {
    return [
      { id: 1, customerName: 'John Doe', total: 156.78, status: 'pending' },
      { id: 2, customerName: 'Jane Smith', total: 89.45, status: 'delivered' }
    ];
  }
  if (url.includes('/drugs')) {
    return [
      { id: 1, name: 'Paracetamol', price: 5.99, stock: 100, description: 'Pain reliever' },
      { id: 2, name: 'Ibuprofen', price: 7.99, stock: 50, description: 'Anti-inflammatory' }
    ];
  }
  return {};
}

const api = mockApi;

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
