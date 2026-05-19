// src/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await api.post('/auth/login', credentials);
      return res.data.data as { accessToken: string; refreshToken: string; user: any };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return () => {
    api.post('/auth/logout').catch(() => {});
    logout();
  };
}
