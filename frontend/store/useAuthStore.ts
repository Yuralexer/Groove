import { create } from 'zustand';
import api from '@/lib/api';

interface User {
    email: string;
    username: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    authChecked: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    authChecked: false,

    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login/', { email, password });
            const tokens = response.data.tokens;
            const user = response.data.user || response.data;

            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);

            set({ user, isAuthenticated: true, authChecked: true });
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    },

    register: async (username, email, password) => {
        try {
            const response = await api.post('/auth/register/', { username, email, password });
            const tokens = response.data.tokens;
            const user = response.data.user || response.data;

            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);

            set({ user, isAuthenticated: true, authChecked: true });
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            set({ user: null, isAuthenticated: false, authChecked: true });
            return;
        }

        try {
            const res = await api.get('/auth/update-profile/');
            const user = res.data;
            set({ user, isAuthenticated: true, authChecked: true });
        } catch (err) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({ user: null, isAuthenticated: false, authChecked: true });
        }
    }
}));