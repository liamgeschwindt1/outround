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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
    captureError(`Network error — ${path}`, msg);
    throw networkErr;
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
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
