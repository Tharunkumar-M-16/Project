import axios from 'axios';

// baseURL can be configured via environment variable (useful when API is hosted separately, e.g. on Railway)
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
