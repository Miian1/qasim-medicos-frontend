import api from './client.js';

// --- Auth ---
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// --- Users ---
export const userAPI = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  get: (id) => api.get(`/users/${id}`),
  getReport: (id) => api.get(`/users/${id}/report`),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, newPassword) => api.post(`/users/${id}/reset-password`, { newPassword }),
};

// --- Categories ---
export const categoryAPI = {
  list: (params) => api.get('/categories', { params }),
  listAll: () => api.get('/categories/all'),
  get: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

// --- Suppliers ---
export const supplierAPI = {
  list: (params) => api.get('/suppliers', { params }),
  listAll: () => api.get('/suppliers/all'),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
};

// --- Medicines ---
export const medicineAPI = {
  list: (params) => api.get('/medicines', { params }),
  search: (q, limit = 10) => api.get('/medicines/search', { params: { q, limit } }),
  lowStock: () => api.get('/medicines/low-stock'),
  expiringSoon: () => api.get('/medicines/expiring-soon'),
  get: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  remove: (id) => api.delete(`/medicines/${id}`),
};

// --- Customers ---
export const customerAPI = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
};

// --- Sales ---
export const saleAPI = {
  list: (params) => api.get('/sales', { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  refund: (id) => api.post(`/sales/${id}/refund`),
};

// --- Purchases ---
export const purchaseAPI = {
  list: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  remove: (id) => api.delete(`/purchases/${id}`),
};

// --- Expenses ---
export const expenseAPI = {
  list: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
};

// --- Dashboard ---
export const dashboardAPI = {
  overview: () => api.get('/dashboard/overview'),
  salesChart: (days = 7) => api.get('/dashboard/sales-chart', { params: { days } }),
  topProducts: (limit = 10, days = 30) => api.get('/dashboard/top-products', { params: { limit, days } }),
  categorySales: (days = 30) => api.get('/dashboard/category-sales', { params: { days } }),
  activity: (page = 1, limit = 20) => api.get('/dashboard/activity', { params: { page, limit } }),
  notifications: () => api.get('/dashboard/notifications'),
  markNotificationRead: (id) => api.put(`/dashboard/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/dashboard/notifications/read-all'),
};

// --- Reports ---
export const reportAPI = {
  sales: (params) => api.get('/reports/sales', { params }),
  inventory: () => api.get('/reports/inventory'),
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  customers: (limit = 20) => api.get('/reports/customers', { params: { limit } }),
  stockMovements: (params) => api.get('/reports/stock-movements', { params }),
};

// --- Settings ---
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
