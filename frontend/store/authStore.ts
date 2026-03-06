import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, name: string) => void;
    logout: () => void;
    signup: (email: string, name: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            login: (email, name) => 
                set({ 
                    user: { id: Math.random().toString(36).substr(2, 9), email, name }, 
                    isAuthenticated: true 
                }),
            logout: () => set({ user: null, isAuthenticated: false }),
            signup: (email, name) => 
                set({ 
                    user: { id: Math.random().toString(36).substr(2, 9), email, name }, 
                    isAuthenticated: true 
                }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
