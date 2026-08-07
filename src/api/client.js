import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong. Please try again.';

    if (error.response) {
      const { status, data } = error.response;
      message = data?.message || message;

      // 401 → logout & redirect
      if (status === 401) {
        localStorage.removeItem('qm_token');
        localStorage.removeItem('qm_user');
        if (window.location.pathname !== '/login') {
          toast.error('Session expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 800);
        }
      }
      // 403 → permission error
      else if (status === 403) {
        toast.error(message || 'You do not have permission to perform this action.');
      }
      // 404 → not found (silent)
      else if (status === 404) {
        // Let caller handle
      }
      // 429 → rate limited
      else if (status === 429) {
        toast.error('Too many requests. Please slow down.');
      }
      // 500 → server error
      else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      message = 'Network error. Check your connection.';
      toast.error(message);
    }

    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
      isAxiosError: true,
    });
  }
);

export default api;
