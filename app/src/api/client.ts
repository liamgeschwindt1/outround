// Thin fetch wrapper. Cookies are sent automatically (httpOnly sb_token from backend).
import { captureError, captureWarn } from '../utils/errorCapture';

class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Attempt a silent token refresh. Returns true if the refresh succeeded.
let _refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  // Coalesce concurrent refresh attempts into one request.
  if (_refreshing) return _refreshing;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000); // 10s max for a token refresh
  _refreshing = fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    signal: ctrl.signal,
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      clearTimeout(timer);
      _refreshing = null;
    });
  return _refreshing;
}

// Default timeout for all requests. The caller can pass a shorter signal via init.
const REQUEST_TIMEOUT_MS = 30_000;

async function request<T>(path: string, init: RequestInit = {}, _retry = true): Promise<T> {
  // Add a safety-net timeout unless the caller already supplied an abort signal.
  // This prevents any fetch from hanging indefinitely (e.g. Railway proxy that accepts
  // the TCP connection but never sends a response).
  let ownCtrl: AbortController | null = null;
  let ownTimer: ReturnType<typeof setTimeout> | null = null;
  if (!init.signal) {
    ownCtrl = new AbortController();
    ownTimer = setTimeout(() => ownCtrl!.abort(), REQUEST_TIMEOUT_MS);
    init = { ...init, signal: ownCtrl.signal };
  }

  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'include',
      headers: Object.assign(
        { 'Content-Type': 'application/json', Accept: 'application/json' },
        init.headers ?? {}
      ),
      ...init,
    });
  } catch (networkErr) {
    // Don't log AbortErrors — these come from our own expected timeouts/cancellations
    // (the 6s passive check, the 10s login check, the 30s safety-net). Logging them
    // as red errors creates false alarms in the debug widget.
    const isAbort = networkErr instanceof DOMException && networkErr.name === 'AbortError';
    if (!isAbort) {
      const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
      captureError(`Network error — ${path}`, msg);
    }
    throw networkErr;
  } finally {
    if (ownTimer) clearTimeout(ownTimer);
  }

  // On 401, try to silently refresh the session once then retry the original request.
  if (res.status === 401 && _retry && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, init, false);
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? (body as { error: string }).error
        : `Request failed: ${String(res.status)}`;

    // Capture unexpected errors (not 401 auth checks — those are routine)
    if (res.status !== 401 && res.status !== 403) {
      captureError(`API ${String(res.status)} — ${path.split('?')[0]}`, msg);
    }

    throw new ApiError(msg, res.status, body);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
