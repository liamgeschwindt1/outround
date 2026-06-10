import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../api/types';
import { storeAuthError } from './authErrors';

// ── Session cache ──────────────────────────────────────────────────────────
// Persist the last known user to sessionStorage so subsequent page loads
// render immediately instead of showing a spinner while /auth/me resolves.
const CACHE_KEY = 'or_session_v1';

function readCache(): User | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCache(user: User | null) {
  try {
    if (user) sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* storage quota exceeded — ignore */
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: (opts?: { timeout?: number }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ email_confirmation?: boolean }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  refresh: () => Promise.resolve(undefined),
  login: () => Promise.resolve(undefined),
  signup: () => Promise.resolve({}),
  logout: () => Promise.resolve(undefined),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = readCache();
  const [user, setUser] = useState<User | null>(cached);
  // If we have a cached user, render immediately and revalidate silently in background.
  // If no cache, show the spinner until /auth/me resolves.
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  // refreshing ref prevents concurrent /auth/me calls from racing each other.
  // Only the most-recently-started refresh wins; stale ones are discarded.
  const refreshSeq = useRef(0);

  const refresh = useCallback(async (opts?: { timeout?: number }) => {
    const seq = ++refreshSeq.current;
    setError(null);
    setLoading(true);

    // Only set up an abort timeout when explicitly requested (initial passive
    // session check). Login/signup flows never pass a timeout — they must
    // complete fully or throw a real error.
    const controller = opts?.timeout ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), opts!.timeout) : null;

    try {
      const u = await api.get<User>(
        '/auth/me',
        controller ? { signal: controller.signal } : undefined
      );
      if (seq !== refreshSeq.current) return;
      setUser(u);
      writeCache(u);
    } catch (e: unknown) {
      if (seq !== refreshSeq.current) return;
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
        writeCache(null);
      } else if (opts?.timeout) {
        // Timeout/network error on the passive check — just show login form,
        // don't surface an error banner.
        setUser(null);
        writeCache(null);
      } else {
        // Real error on an explicit refresh (post-login) — surface it.
        // Treat AbortError (from the client-side safety-net timeout) as a
        // friendly connection error rather than showing the raw browser message.
        const isAbort = e instanceof DOMException && e.name === 'AbortError';
        const msg = isAbort
          ? 'Connection timed out. Please check your connection and try again.'
          : e instanceof Error
            ? e.message
            : 'Failed to load session';
        setError(msg);
        setUser(null);
        writeCache(null);
      }
    } finally {
      if (timer) clearTimeout(timer);
      if (seq === refreshSeq.current) setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await api.post('/auth/login', { email, password });
      await refresh();
    },
    [refresh]
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name?: string
    ): Promise<{ email_confirmation?: boolean }> => {
      const result = await api.post<{ ok: boolean; email_confirmation?: boolean }>('/auth/signup', {
        email,
        password,
        name: name ?? '',
      });
      if (!result.email_confirmation) {
        await refresh();
      }
      return result;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* best effort */
    }
    setUser(null);
    writeCache(null);
  }, []);

  // Keep a mutable ref to refresh so the init effect can call it without listing refresh as a dep
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    const hash = window.location.hash;

    // Supabase sends error hashes when email links have expired or are invalid.
    // Format: #error=access_denied&error_code=403&error_description=Email+link+...
    if (hash.includes('error=') && !hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const desc =
        params.get('error_description') ?? params.get('error') ?? 'Authentication failed';
      const msg = decodeURIComponent(desc.replace(/\+/g, ' '));
      storeAuthError(msg);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      void refreshRef.current();
      return;
    }

    // Supabase email confirmation links redirect to {SITE_URL}#access_token=...
    // Extract the token, send it to the backend to set the HTTP-only cookie, then
    // clear the hash so it doesn't stick around or confuse the router.
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const token = params.get('access_token');
      if (token) {
        api
          .post('/auth/confirm', { access_token: token })
          .then(() => {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
            return refreshRef.current();
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Email confirmation failed';
            storeAuthError(`Confirmation failed: ${msg}`);
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
            void refreshRef.current();
          });
        return;
      }
    }

    void refreshRef.current({ timeout: 6000 });
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, error, refresh, login, signup, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
