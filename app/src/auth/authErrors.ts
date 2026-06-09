// Persist auth errors across page redirects (e.g. email confirmation
// redirects from Supabase, which wipe React state).
const AUTH_ERR_KEY = 'outround_auth_error';

export function storeAuthError(msg: string) {
  try {
    sessionStorage.setItem(AUTH_ERR_KEY, msg);
  } catch {
    /* ignore */
  }
}

export function readAuthError(): string | null {
  try {
    const v = sessionStorage.getItem(AUTH_ERR_KEY);
    sessionStorage.removeItem(AUTH_ERR_KEY);
    return v;
  } catch {
    return null;
  }
}
