import { test, expect, goTo, goToLoggedOut, goToNewUser } from '../helpers';

// ─── Unauthenticated ───────────────────────────────────────────────────────────

test.describe('Route guards — unauthenticated', () => {
  test('/ redirects to /login', async ({ page }) => {
    await goToLoggedOut(page, '/');
    await page.waitForURL('**/login');
  });

  test('/onboarding redirects to /login', async ({ page }) => {
    await goToLoggedOut(page, '/onboarding');
    await page.waitForURL('**/login');
  });

  test('/calendar redirects to /login', async ({ page }) => {
    await goToLoggedOut(page, '/calendar');
    await page.waitForURL('**/login');
  });

  test('/crm redirects to /login', async ({ page }) => {
    await goToLoggedOut(page, '/crm');
    await page.waitForURL('**/login');
  });

  test('/settings redirects to /login', async ({ page }) => {
    await goToLoggedOut(page, '/settings');
    await page.waitForURL('**/login');
  });

  test('/welcome is always accessible', async ({ page }) => {
    await goToLoggedOut(page, '/welcome');
    await expect(page.getByText('They train.')).toBeVisible({ timeout: 15000 });
  });
});

// ─── Authenticated, not onboarded ──────────────────────────────────────────────

test.describe('Route guards — new user (not onboarded)', () => {
  test('/ redirects to /onboarding', async ({ page }) => {
    await goToNewUser(page, '/');
    await page.waitForURL('**/onboarding');
  });

  test('/calendar redirects to /onboarding', async ({ page }) => {
    await goToNewUser(page, '/calendar');
    await page.waitForURL('**/onboarding');
  });

  test('/crm redirects to /onboarding', async ({ page }) => {
    await goToNewUser(page, '/crm');
    await page.waitForURL('**/onboarding');
  });

  test('/login redirects to /onboarding (already logged in)', async ({ page }) => {
    await goToNewUser(page, '/login');
    await page.waitForURL('**/onboarding');
  });

  test('/onboarding is accessible', async ({ page }) => {
    await goToNewUser(page, '/onboarding');
    await expect(page.getByText('Connect your pipeline.')).toBeVisible({ timeout: 10000 });
  });
});

// ─── Authenticated + onboarded ─────────────────────────────────────────────────

test.describe('Route guards — onboarded user', () => {
  test('/ shows dashboard content', async ({ page }) => {
    await goTo(page, '/');
    // The dashboard renders a "MEETINGS" section header
    await expect(page.getByText('MEETINGS')).toBeVisible({ timeout: 10000 });
  });

  test('/login redirects to /', async ({ page }) => {
    await goTo(page, '/login');
    await page.waitForURL('**/');
  });

  test('/calendar is accessible', async ({ page }) => {
    await goTo(page, '/calendar');
    await page.waitForURL('**/calendar');
  });

  test('/crm is accessible', async ({ page }) => {
    await goTo(page, '/crm');
    await page.waitForURL('**/crm');
  });

  test('/settings is accessible', async ({ page }) => {
    await goTo(page, '/settings');
    await page.waitForURL('**/settings');
    // Settings page has unique tab labels in the content area
    await expect(page.getByText('Plan & Billing')).toBeVisible({ timeout: 5000 });
  });

  test('unknown routes redirect based on auth state', async ({ page }) => {
    await goTo(page, '/nonexistent-route-xyz');
    await page.waitForURL('**/');
  });
});
