import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Перехватчик ЗАПРОСА (цепляет токен, если есть)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. Перехватчик ОТВЕТА (ловит ошибки)
api.interceptors.response.use(
    (response) => response, // Если всё ок - просто возвращаем ответ
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка 401 (Нет прав / Токен протух)
        if (error.response && error.response.status === 401) {
            console.warn("Токен протух или невалиден. Разлогиниваемся...");
            
            // Удаляем токены
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Если мы НЕ на странице логина - редиректим туда
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;