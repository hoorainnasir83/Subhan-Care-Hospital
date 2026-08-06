import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network offline
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        toast.error('Network error. Please check your internet connection.');
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.message || data?.error || 'An unexpected error occurred';

    switch (status) {
      case 401:
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        // Small delay so user can see the toast
        setTimeout(() => window.location.reload(), 1500);
        break;
      case 403:
        toast.error('Access denied. You do not have permission for this action.');
        break;
      case 404:
        toast.error(message || 'The requested resource was not found.');
        break;
      case 409:
        toast.error(message || 'A duplicate record already exists.');
        break;
      case 422:
        toast.error(message || 'Validation failed. Please check your input.');
        break;
      case 429:
        toast.error('Too many requests. Please wait a moment and try again.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      case 502:
      case 503:
        toast.error('Service temporarily unavailable. Please try again shortly.');
        break;
      default:
        if (status >= 400) {
          toast.error(message);
        }
    }

    return Promise.reject(error);
  }
);

export default api;
