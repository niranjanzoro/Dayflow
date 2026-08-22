import axios from 'axios';

// Set VITE_USE_MOCK=false in .env once the Spring Boot backend
// (see /backend, e.g. AuthController, EmployeeController...) is running,
// and point VITE_API_BASE_URL at it. Until then the app runs fully
// standalone against the mock data layer in mockData.js.
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (issued by AuthController on login) to every request.
axiosClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('dayflow_auth');
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      /* ignore malformed storage */
    }
  }
  return config;
});

// If the backend ever returns 401 (expired/invalid JWT), force logout.
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.data?.message) error.message = error.response.data.message;
    if (error?.response?.status === 401) {
      localStorage.removeItem('dayflow_auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
