import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/api/types';

interface AuthState {
    // ─── State ──────────────────────────────────────────────────────────────
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    role: string | null;
    isAuthenticated: boolean;

    // ─── Actions ────────────────────────────────────────────────────────────
    /** Persist tokens + user after a successful login/register Server Action */
    setSession: (tokens: { access_token: string; refresh_token: string; role: string }, user: User) => void;
    /** Update user data without changing tokens (e.g. after profile edit) */
    setUser: (user: User) => void;
    /** Clear session completely */
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            role: null,
            isAuthenticated: false,

            setSession: (tokens, user) =>
                set({
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    role: tokens.role,
                    user,
                    isAuthenticated: true,
                }),

            setUser: (user) => set({ user }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    role: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
