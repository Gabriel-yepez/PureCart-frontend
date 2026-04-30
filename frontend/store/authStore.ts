import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/api/types';

interface AuthState {
    user: User | null;
    role: string | null;
    isAuthenticated: boolean;
    setSession: (user: User, role: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            role: null,
            isAuthenticated: false,
            setSession: (user, role) => set({ user, role, isAuthenticated: true }),
            setUser: (user) => set({ user }),
            logout: () => set({ user: null, role: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
