// Thin fetch wrapper. Cookies are sent automatically (httpOnly sb_token from backend).
import { captureError } from '../utils/errorCapture';

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
  _refreshing = fetch('/auth/refresh', { method: 'POST', credentials: 'include' })
    .then(r => r.ok)
    .catch(() => false)
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  _retry = true,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers || {}),
      },
      ...init,
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
    captureError(`Network error — ${path}`, msg);
    throw networkErr;
  }

  // On 401, try to silently refresh the session once then retry the original request.
  if (res.status === 401 && _retry && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, init, false);
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string')
        ? (body as { error: string }).error
        : `Request failed: ${res.status}`;

    // Capture unexpected errors (not 401 auth checks — those are routine)
    if (res.status !== 401 && res.status !== 403) {
      captureError(`API ${res.status} — ${path.split('?')[0]}`, msg);
    }

    throw new ApiError(msg, res.status, body);
  }

  return body as T;
}

export const api = {
  get:  <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put:  <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del:  <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
