import axios from 'axios';

// Returns the backend API base URL
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

// Creates Axios instance with base URL configuration
const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// Attaches user authentication token to outgoing HTTP requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Clears user authentication token on unauthorized API response
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hf_token');
    }
    return Promise.reject(err);
  }
);

export default api;
