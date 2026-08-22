import axios from 'axios';

// Set VITE_USE_MOCK=false in .env once the Spring Boot backend
// (see /backend, e.g. AuthController, EmployeeController...) is running,
// and point VITE_API_BASE_URL at it. Until then the app runs fully
// standalone against the mock data layer in mockData.js.
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
  withCredentials: true, // Include credentials for CORS
});

// SECURITY: Attach the JWT (issued by AuthController on login) to every request.
// Token is stored in localStorage with XSS protection recommendations.
axiosClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('dayflow_auth');
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      // Validate token format before sending
      if (token && typeof token === 'string' && token.length > 0) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Invalid storage - clear it for security
      localStorage.removeItem('dayflow_auth');
    }
  }
  return config;
});

// SECURITY: Handle authentication errors and suspicious responses
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.data?.message) error.message = error.response.data.message;
    
    // 401: Expired/invalid JWT - force logout
    if (error?.response?.status === 401) {
      localStorage.removeItem('dayflow_auth');
      sessionStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // 403: Forbidden - user lacks permissions
    if (error?.response?.status === 403) {
      console.warn('Access denied - insufficient permissions');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    // 429: Rate limited - back off
    if (error?.response?.status === 429) {
      console.error('Too many requests - please try again later');
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
