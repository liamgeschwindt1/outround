// Thin fetch wrapper. Cookies are sent automatically (httpOnly sb_token from backend).

class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

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
