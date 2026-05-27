import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ email_confirmation?: boolean }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  refresh: async () => undefined,
  login: async () => undefined,
  signup: async () => ({}),
  logout: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await api.get<User>('/auth/me');
      setUser(u);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load session');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.post('/auth/login', { email, password });
    await refresh();
  }, [refresh]);

  const signup = useCallback(async (email: string, password: string, name?: string): Promise<{ email_confirmation?: boolean }> => {
    const result = await api.post<{ ok: boolean; email_confirmation?: boolean }>('/auth/signup', { email, password, name: name || '' });
    if (!result.email_confirmation) {
      await refresh();
    }
    return result;
  }, [refresh]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* best effort */ }
    setUser(null);
  }, []);

  useEffect(() => {
    // Supabase email confirmation links redirect to {SITE_URL}#access_token=...
    // Extract the token, send it to the backend to set the HTTP-only cookie, then
    // clear the hash so it doesn't stick around or confuse the router.
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get('access_token');
      if (token) {
        api.post('/auth/confirm', { access_token: token })
          .then(() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return refresh();
          })
          .catch(() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            void refresh();
          });
        return;
      }
    }
    void refresh();
  }, [refresh]);

  return (
    <Ctx.Provider value={{ user, loading, error, refresh, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
