import { test as base, type Page } from '@playwright/test';
import { setupAuthMocks, setupFallbackMocks, type AuthState, type MockUser } from '../mocks/auth';
import { setupDashboardMocks } from '../mocks/api';

// ─── Re-export for convenience ──────────────────────────────────────────────────

export {
  type AuthState,
  type MockUser,
  createMockUser,
  NEW_USER,
  ONBOARDED_USER,
} from '../mocks/auth';

// ─── Custom test fixture ────────────────────────────────────────────────────────

export interface AuthFixture {
  /**
   * Set up auth mocks for the current page.
   * Call this in a `beforeEach` or at the top of each test.
   */
  mockAuth: (page: Page, state: AuthState, customUser?: MockUser) => Promise<void>;
}

/**
 * Extended test fixture that includes `mockAuth` helper.
 * Use this instead of `test` from `@playwright/test` in all spec files.
 *
 * @example
 *   import { test } from '../helpers';
 *   test('my test', async ({ page, mockAuth }) => {
 *     await mockAuth(page, 'onboarded');
 *     await page.goto('/');
 *   });
 */
export const test = base.extend<AuthFixture>({
  mockAuth: async ({}, use) => {
    const mockAuthFn = async (page: Page, state: AuthState, customUser?: MockUser) => {
      await setupAuthMocks(page, state, customUser);
      await setupFallbackMocks(page);
    };
    await use(mockAuthFn);
  },
});

// ─── Convenience: fully set up an onboarded session ─────────────────────────────

/**
 * Set up mocks for a fully authenticated, onboarded user and navigate to the
 * given path. Also mocks Dashboard API calls so the app doesn't show errors.
 */
export async function goTo(page: Page, path: string) {
  await setupAuthMocks(page, 'onboarded');
  await setupFallbackMocks(page);
  await setupDashboardMocks(page);
  await page.goto(path);
}

/**
 * Set up mocks as unauthenticated and navigate.
 */
export async function goToLoggedOut(page: Page, path: string) {
  await setupAuthMocks(page, 'unauthenticated');
  await setupFallbackMocks(page);
  await page.goto(path);
}

/**
 * Set up mocks as a new user (not yet onboarded) and navigate.
 */
export async function goToNewUser(page: Page, path: string) {
  await setupAuthMocks(page, 'new-user');
  await setupFallbackMocks(page);
  await page.goto(path);
}

export { expect } from '@playwright/test';
