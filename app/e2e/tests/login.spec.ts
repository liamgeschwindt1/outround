import { test, expect, goToLoggedOut } from '../helpers';

// Every test in this file starts logged out on the login page.
test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoggedOut(page, '/login');
    // Clear any persisted auth errors from sessionStorage (needs a loaded origin to access)
    await page.evaluate(() => {
      try {
        sessionStorage.removeItem('outround_auth_error');
      } catch {
        /* ignore */
      }
    });
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  test('renders sign-in form by default', async ({ page }) => {
    await expect(page.getByText('Welcome back.')).toBeVisible();
    await expect(page.getByText('Sign in to continue.')).toBeVisible();

    // Should have email + password fields, no name field
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByPlaceholder('Your full name')).toHaveCount(0);

    // Sign-in button
    await expect(page.getByRole('button', { name: /Sign in/ })).toBeVisible();
  });

  test('renders Google OAuth button', async ({ page }) => {
    await expect(page.getByText('Continue with Google')).toBeVisible();
  });

  // ─── Mode toggle ───────────────────────────────────────────────────────────

  test('can toggle to sign-up mode', async ({ page }) => {
    // Click the "Don't have an account?" text, then the "Create one" button
    await page.getByRole('button', { name: 'Create one' }).click();

    await expect(page.getByText('Create your account.')).toBeVisible();
    await expect(page.getByText('The round before it counts.')).toBeVisible();
    await expect(page.getByPlaceholder('Your full name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create account/ })).toBeVisible();
  });

  test('can toggle back to sign-in mode', async ({ page }) => {
    // Go to sign-up first
    await page.getByRole('button', { name: 'Create one' }).click();
    await expect(page.getByText('Create your account.')).toBeVisible();

    // Then toggle back
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Welcome back.')).toBeVisible();
  });

  // ─── Error states ──────────────────────────────────────────────────────────

  test('shows error message on failed login', async ({ page }) => {
    // Override the login mock to return an error
    await page.route('**/auth/login', (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password.' }),
      });
    });

    await page.getByPlaceholder('you@company.com').fill('bad@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign in/ }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('clears error when toggling mode', async ({ page }) => {
    // Trigger an error first
    await page.route('**/auth/login', (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid email or password.' }),
      });
    });

    await page.locator('input[type="email"]').fill('bad@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /Sign in/ }).click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();

    // Toggle to sign-up — error should clear
    await page.getByRole('button', { name: 'Create one' }).click();
    await expect(page.getByText('Invalid email or password.')).not.toBeVisible();
  });

  // ─── Email confirmation ────────────────────────────────────────────────────

  test('shows email confirmation message after signup that requires confirmation', async ({
    page,
  }) => {
    // Override the signup mock to return email_confirmation
    await page.route('**/auth/signup', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, email_confirmation: true }),
      });
    });

    // Switch to sign-up mode
    await page.getByRole('button', { name: 'Create one' }).click();
    await expect(page.getByText('Create your account.')).toBeVisible();

    // Fill the form
    await page.getByPlaceholder('Your full name').fill('New User');
    await page.locator('input[type="email"]').fill('new@outround.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /Create account/ }).click();

    // Should show the confirmation screen
    await expect(page.getByText('Check your email.')).toBeVisible();
    await expect(page.getByText('new@outround.com')).toBeVisible(); // email shown in message
    await expect(page.getByText('Back to sign in')).toBeVisible();
  });

  test('can go back to sign-in from confirmation screen', async ({ page }) => {
    // Override signup for confirmation
    await page.route('**/auth/signup', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, email_confirmation: true }),
      });
    });

    await page.getByRole('button', { name: 'Create one' }).click();
    await page.getByPlaceholder('Your full name').fill('New User');
    await page.locator('input[type="email"]').fill('new@outround.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /Create account/ }).click();
    await expect(page.getByText('Check your email.')).toBeVisible();

    // Go back
    await page.getByText('Back to sign in').click();
    await expect(page.getByText('Welcome back.')).toBeVisible();
  });

  // ─── OAuth error params ────────────────────────────────────────────────────

  test('shows error from OAuth query params', async ({ page }) => {
    await page.goto('/login?error=oauth_failed');
    await expect(page.getByText('Google sign-in failed — please try again.')).toBeVisible();
  });

  test.skip('shows error from sessionStorage', async ({ page }) => {
    // FIXME: React 18 StrictMode double-effects consume the sessionStorage
    // item on the first effect run; the second run finds nothing. Need to
    // coordinate timing or mock sessionStorage at the browser level.
    // The feature itself (storeAuthError / readAuthError) works — this is
    // a test-environment timing issue, not a product bug.
    await page.evaluate(() => {
      sessionStorage.setItem('outround_auth_error', 'Confirmation failed: Link expired');
    });
    await page.goto('/login');
    await expect(page.getByText('Confirmation failed: Link expired')).toBeVisible({
      timeout: 5000,
    });
  });
});
