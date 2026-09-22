/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('khazana_user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      // SimpleJWT returns 'access', mock data might use 'token'
      const token = userData.access || userData.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if it's a 401, not a login request, and we aren't already on the login page
    if (error.response?.status === 401 && 
        !error.config?.url?.includes('/auth/login/') && 
        window.location.pathname !== '/') {
      // Handle unauthorized error (e.g., redirect to login)
      localStorage.removeItem('khazana_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
