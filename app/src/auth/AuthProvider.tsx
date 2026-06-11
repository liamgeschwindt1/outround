import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../api/types';
import { storeAuthError } from './authErrors';
import { captureLog, captureSuccess, captureError as captureErr } from '../utils/errorCapture';

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
  refresh: (opts?: { timeout?: number; silent?: boolean }) => Promise<void>;
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

  const refresh = useCallback(async (opts?: { timeout?: number; silent?: boolean }) => {
    const seq = ++refreshSeq.current;
    setError(null);

    const isSilent = opts?.silent === true;
    if (!isSilent) captureLog(`auth: /auth/me — ${opts?.timeout ? `timeout ${String(opts.timeout)}ms` : 'no timeout'}`);

    if (isSilent && !cached) setLoading(true);

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
      if (!isSilent) captureSuccess(`auth: session confirmed — ${u.email}`);
    } catch (e: unknown) {
      if (seq !== refreshSeq.current) return;
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
        writeCache(null);
        if (!isSilent) {
          captureErr('auth: /auth/me → 401 (cookie not set after login)');
          throw new Error('Sign-in failed. Please try again.');
        }
      } else if (isSilent) {
        const msg = e instanceof Error ? e.message : 'unknown';
        captureLog(`auth: passive check failed silently — ${msg}`);
        setUser(null);
        writeCache(null);
      } else {
        const isAbort = e instanceof DOMException && e.name === 'AbortError';
        const msg = isAbort
          ? 'Taking longer than expected. Please try again.'
          : e instanceof Error
            ? e.message
            : 'Failed to load session';
        captureErr(`auth: /auth/me failed — ${msg}`);
        setError(msg);
        setUser(null);
        writeCache(null);
        throw new Error(msg);
      }
    } finally {
      if (timer) clearTimeout(timer);
      if (isSilent && seq === refreshSeq.current) setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      captureLog(`auth: POST /auth/login — ${email}`);
      const result = await api.post<{ ok: boolean; user?: User }>('/auth/login', {
        email,
        password,
      });
      captureSuccess('auth: login POST ok — fetching session');

      // Backend returns the user inline (upserted during login) — use it directly
      // to skip the separate /auth/me round trip which hits a cold Postgres DB.
      if (result.user) {
        captureSuccess(`auth: session confirmed (inline) — ${result.user.email}`);
        setUser(result.user);
        writeCache(result.user);
        return;
      }

      // Fallback: backend DB was unavailable at login time — retry /auth/me.
      const MAX_ATTEMPTS = 3;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await refresh({ timeout: 12000 });
          return;
        } catch (e) {
          const isTimeout = e instanceof Error && e.message.includes('Taking longer');
          const isNetwork = e instanceof Error && e.message.toLowerCase().includes('network');
          if ((isTimeout || isNetwork) && attempt < MAX_ATTEMPTS) {
            captureLog(
              `auth: /auth/me attempt ${String(attempt)} timed out, retrying (${String(MAX_ATTEMPTS - attempt)} left)...`
            );
            continue;
          }
          throw e;
        }
      }
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
    captureLog('auth: logout');
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

    void refreshRef.current({ timeout: 6000, silent: true });
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
