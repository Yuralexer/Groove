import { create } from 'zustand';
import api from '@/lib/api';

interface User {
    email: string;
    username: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,

    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login/', { email, password });
            
            const { tokens, ...user } = response.data;

            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);

            set({ user, isAuthenticated: true });
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            set({ isAuthenticated: true });
        }
    }
}));