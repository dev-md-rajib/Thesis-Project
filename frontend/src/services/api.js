import axios from 'axios';

const LIVE_BACKEND_URL = 'https://thesis-project-backend-mxhp.onrender.com';
const rawBase = (import.meta.env.VITE_API_BASE_URL || LIVE_BACKEND_URL).trim().replace(/\/$/, '');
const apiBase = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

if (typeof window !== 'undefined') {
  console.log(`[API Config] Active API Base URL: ${apiBase}`);
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Inject token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
