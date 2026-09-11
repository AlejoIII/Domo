import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/services/auth.service';
import { useCompanyStore } from '@/store/company.store';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user) => set({ user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => {
        useCompanyStore.getState().reset();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'domo-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
