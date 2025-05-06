// src/utils/axios.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'https://econet-marathon-api.onrender.com/api/v1';

const axiosInstance = axios.create({
    baseURL,
    headers: {
        // Don't set a default Content-Type here as it can interfere with file uploads
    },
    withCredentials: true
});

// Add request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('Unauthorized request detected, redirecting to login');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;