import axios from 'axios';

// אם יש VITE_API_URL, השתמש בו. אחרת, נסה לזהות את כתובת השרת אוטומטית
const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // ב-production, השתמש בכתובת ה-Vercel של השרת
    if (import.meta.env.PROD) {
        return 'https://your-backend-app.vercel.app/api'; // החלף ב-URL האמיתי שלך
    }

    // ב-development, אם יש proxy של Vite, השתמש ב-/api
    if (import.meta.env.DEV) {
        return '/api'; // Vite proxy יטפל בזה
    }

    return 'http://localhost:7000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
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
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

