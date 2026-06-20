import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/types';
import { clearAccessToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,

        setUser: (user) => set({ user }, false, 'setUser'),

        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

        logout: () => {
          // Clear the in-memory access token — the refresh cookie is cleared
          // server-side when DELETE /api/auth/logout is called by the caller.
          clearAccessToken();
          set({ user: null, isLoading: false }, false, 'logout');
        },
      }),
      {
        name: 'snippets-auth',
        // Only persist the user object — never the access token (XSS risk)
        // and never isLoading (that's transient UI state).
        partialize: (state) => ({ user: state.user }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
