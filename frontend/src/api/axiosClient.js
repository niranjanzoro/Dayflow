import axios from 'axios';

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('dayflow_auth');
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      if (token && typeof token === 'string' && token.length > 0) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem('dayflow_auth');
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.data?.message) error.message = error.response.data.message;
    
    if (error?.response?.status === 401) {
      localStorage.removeItem('dayflow_auth');
      sessionStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    if (error?.response?.status === 403) {
      console.warn('Access denied - insufficient permissions');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    if (error?.response?.status === 429) {
      console.error('Too many requests - please try again later');
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
