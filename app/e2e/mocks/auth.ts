import type { Page, Route } from '@playwright/test';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string | null;
  avatar_url: string | null;
  coach_id: string | null;
  onboarding_complete: boolean;
  integrations: {
    pipedrive: boolean;
    gcal: boolean;
    slack: boolean;
  };
}

export type AuthState = 'unauthenticated' | 'new-user' | 'onboarded';

// ─── Factory ────────────────────────────────────────────────────────────────────

export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: 'test-user-001',
    email: 'test@outround.com',
    name: 'Test User',
    role: 'Founder',
    avatar_url: null,
    coach_id: null,
    onboarding_complete: false,
    integrations: {
      pipedrive: false,
      gcal: false,
      slack: false,
    },
    ...overrides,
  };
}

// ─── Pre-built users ────────────────────────────────────────────────────────────

export const NEW_USER = createMockUser({
  onboarding_complete: false,
});

export const ONBOARDED_USER = createMockUser({
  onboarding_complete: true,
  integrations: {
    pipedrive: true,
    gcal: true,
    slack: true,
  },
});

// ─── Route handlers ─────────────────────────────────────────────────────────────

function jsonRoute(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Register auth route mocks on the page.
 * Call this in a test's `beforeEach` or at the top of each test.
 */
export async function setupAuthMocks(page: Page, state: AuthState, customUser?: MockUser) {
  const user: MockUser | null =
    state === 'unauthenticated'
      ? null
      : customUser || (state === 'new-user' ? NEW_USER : ONBOARDED_USER);

  // GET /auth/me — session check
  await page.route('**/auth/me', (route) => {
    if (user) {
      return jsonRoute(route, 200, user);
    }
    return jsonRoute(route, 401, { error: 'Not authenticated' });
  });

  // POST /auth/login
  await page.route('**/auth/login', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return jsonRoute(route, 200, { ok: true });
  });

  // POST /auth/signup
  await page.route('**/auth/signup', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return jsonRoute(route, 200, { ok: true });
  });

  // POST /auth/logout
  await page.route('**/auth/logout', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return jsonRoute(route, 200, { ok: true });
  });

  // POST /auth/confirm — email confirmation
  await page.route('**/auth/confirm', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return jsonRoute(route, 200, { ok: true });
  });

  // POST /auth/onboarding/complete
  await page.route('**/auth/onboarding/complete', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return jsonRoute(route, 200, { ok: true });
  });
}

/**
 * Register a fallback for unmocked API routes so they don't hang or
 * produce noisy connection-refused errors in test output.
 *
 * IMPORTANT: Playwright routes use "last registered wins" — specific
 * API mocks (e.g. /api/session/stats) must be registered AFTER this
 * call so they override the wildcard. Auth routes are handled by
 * setupAuthMocks and should NOT have a wildcard fallback here.
 */
export async function setupFallbackMocks(page: Page) {
  // Match only root-level /api/* paths (not /src/api/client.ts etc.)
  // The glob ** /api/** also matches /src/api/* source imports, which
  // breaks Vite's module loading. Using a URL-matching function avoids this.
  await page.route(
    (url) => {
      return new URL(url).pathname.startsWith('/api/');
    },
    (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
  );
}
