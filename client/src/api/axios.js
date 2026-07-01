import axios from 'axios';

// baseURL '/api' is proxied to http://localhost:5000 by vite.config.js
const api = axios.create({ baseURL: '/api' });

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
