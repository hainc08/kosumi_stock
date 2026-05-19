// src/stores/auth.store.ts
import { create } from 'zustand';
import { User } from '@/types/models';
import { Permission, hasPermission } from '@/types/roles';

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  refreshToken: string | null;

  setAuth:    (user: User, accessToken: string, refreshToken: string) => void;
  setTokens:  (accessToken: string, refreshToken: string) => void;
  logout:     () => void;
  can:        (permission: Permission) => boolean;
  isLoggedIn: boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:         null,
  accessToken:  null,
  refreshToken: null,
  isLoggedIn:   false,

  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isLoggedIn: true }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  logout: () =>
    set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false }),

  can: (permission) => {
    const { user } = get();
    if (!user) return false;
    return hasPermission(user.role, permission);
  },
}));
