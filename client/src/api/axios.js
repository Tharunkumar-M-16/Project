import axios from 'axios';

// In production (Vercel) we call the Railway backend directly.
// In dev, '/api' is proxied to localhost:5000 by vite.config.js.
const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://project-production-f121.up.railway.app/api'
    : '/api',
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On an expired/invalid token, drop it and bounce to login (except for the
// login call itself, whose 401 means "wrong credentials" and is handled inline).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isLogin = url.includes('/auth/login');
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/manual-login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
