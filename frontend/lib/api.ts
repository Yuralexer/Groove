import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window === 'undefined') return config;

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let isRefreshing = false;
let failedQueue: Array<{resolve: (token: string) => void; reject: (err: any) => void}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(p => {
        if (error) {
            p.reject(error);
        } else {
            p.resolve(token as string);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        if (!originalRequest) return Promise.reject(error);

        if (error.response && error.response.status === 401) {
            if (originalRequest._retry) {
                return Promise.reject(error);
            }

            if (typeof window === 'undefined') return Promise.reject(error);

            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                // Перенаправление на страницу входа, если нет refresh токена
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                if (window.location.pathname !== '/login') window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Если токен найден, отправляе6м запрос на обновление токена
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            return new Promise((resolve, reject) => {
                axios
                    .post(`${API_URL}/auth/token/refresh/`, { refresh: refreshToken })
                    .then(({ data }) => {
                        const newAccess = data.access;
                        const newRefresh = data.refresh;

                        if (newAccess) {
                            localStorage.setItem('access_token', newAccess);
                        }
                        if (newRefresh) {
                            localStorage.setItem('refresh_token', newRefresh);
                        }

                        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
                        processQueue(null, newAccess);

                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

                        resolve(api(originalRequest));
                    })
                    .catch((err) => {
                        processQueue(err, null);
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        if (window.location.pathname !== '/login') window.location.href = '/login';
                        reject(err);
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            });
        }

        return Promise.reject(error);
    }
);

export default api;