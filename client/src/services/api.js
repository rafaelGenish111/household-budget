import axios from 'axios';
import { queueRequest, processQueue } from '../utils/offlineQueue';

// קביעת כתובת השרת
const getBaseURL = () => {
    console.log('🔍 Environment check:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        PROD: import.meta.env.PROD,
        DEV: import.meta.env.DEV
    });

    // אם יש VITE_API_URL, השתמש בו
    if (import.meta.env.VITE_API_URL) {
        console.log('✅ Using VITE_API_URL:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
    }

    // ב-production, השתמש בכתובת ה-Vercel של השרת
    if (import.meta.env.PROD) {
        console.log('🏭 Production mode - using hardcoded URL');
        return 'https://household-budget-server.vercel.app/api';
    }

    // ב-development, אם יש proxy של Vite, השתמש ב-/api
    if (import.meta.env.DEV) {
        console.log('🔧 Development mode - using proxy');
        return '/api'; // Vite proxy יטפל בזה
    }

    console.log('⚠️ Fallback to localhost');
    return 'http://localhost:7000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Process offline queue on load
if (navigator.onLine) {
    processQueue(api).catch(console.error);
}

// Listen for online event
window.addEventListener('online', () => {
    processQueue(api).catch(console.error);
});

// Add token to requests
api.interceptors.request.use(
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

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Queue request if offline
        if (!navigator.onLine) {
            const originalRequest = error.config;
            queueRequest({
                method: originalRequest.method,
                url: originalRequest.url,
                data: originalRequest.data,
            });

            return Promise.reject({
                ...error,
                isOffline: true,
                message: 'הבקשה נשמרה ותבוצע כשתתחבר לאינטרנט',
            });
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;

