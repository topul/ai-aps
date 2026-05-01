import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AIConfig } from '../types/user';

interface UserState {
  user: User | null;
  token: string | null;
  aiConfig: AIConfig | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAIConfig: (config: AIConfig | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      aiConfig: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setAIConfig: (aiConfig) => set({ aiConfig }),
      logout: () => set({ user: null, token: null, aiConfig: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);