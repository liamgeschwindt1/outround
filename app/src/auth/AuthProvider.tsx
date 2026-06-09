import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../api/types';

// Key used to persist auth errors across page redirects (e.g. email confirmation
// redirects from Supabase, which wipe React state).
const AUTH_ERR_KEY = 'outround_auth_error';

export function storeAuthError(msg: string) {
  try { sessionStorage.setItem(AUTH_ERR_KEY, msg); } catch { /* ignore */ }
}
export function readAuthError(): string | null {
  try {
    const v = sessionStorage.getItem(AUTH_ERR_KEY);
    sessionStorage.removeItem(AUTH_ERR_KEY);
    return v;
  } catch { return null; }
}

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
        const msg = e instanceof Error ? e.message : 'Failed to load session';
        setError(msg);
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
    const hash = window.location.hash;

    // Supabase sends error hashes when email links have expired or are invalid.
    // Format: #error=access_denied&error_code=403&error_description=Email+link+...
    if (hash && hash.includes('error=') && !hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const desc = params.get('error_description') || params.get('error') || 'Authentication failed';
      const msg = decodeURIComponent(desc.replace(/\+/g, ' '));
      storeAuthError(msg);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      void refresh();
      return;
    }

    // Supabase email confirmation links redirect to {SITE_URL}#access_token=...
    // Extract the token, send it to the backend to set the HTTP-only cookie, then
    // clear the hash so it doesn't stick around or confuse the router.
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get('access_token');
      if (token) {
        api.post('/auth/confirm', { access_token: token })
          .then(() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return refresh();
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Email confirmation failed';
            storeAuthError(`Confirmation failed: ${msg}`);
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
