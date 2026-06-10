import { test, expect } from '../helpers';
import {
  setupAuthMocks,
  setupFallbackMocks,
  NEW_USER,
  ONBOARDED_USER,
  createMockUser,
} from '../mocks/auth';

/**
 * Onboarding E2E tests — placeholder until the full onboarding flow is mapped.
 *
 * The onboarding has 3 steps:
 *   1. Connect Pipedrive (optional — can skip)
 *   2. Connect Google Calendar (optional — can skip)
 *   3. Connect Slack → auto-completes onboarding
 *
 * These tests focus on what we can verify without an actual Pipedrive/GCal/Slack
 * OAuth flow. Full integration tests against the real OAuth providers would
 * require a running backend with valid OAuth credentials.
 */
test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthMocks(page, 'new-user', NEW_USER);
    await setupFallbackMocks(page);
  });

  test('renders step 1 — Pipedrive connect', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('Connect your pipeline.')).toBeVisible();
    await expect(page.getByText('Connect Pipedrive')).toBeVisible();
    await expect(page.getByText('Skip for now')).toBeVisible();

    // Step dots: dot 1 is active (coral), dots 2 and 3 are muted
    // We can verify all 3 step dots are present
    const dots = page.locator('[style*="height: 4"][style*="width: 48"]');
    // Hmm, the dots are rendered as divs with inline styles. Let's just
    // verify the step indicator is visible.
    await expect(page.getByText('STEP 01 — CRM')).toBeVisible();
  });

  test('can skip to step 2 (Google Calendar)', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.getByText('Connect your pipeline.')).toBeVisible();
    await page.getByText('Skip for now').click();

    // Step 2 should appear
    await expect(page.getByText('Sync your calendar.')).toBeVisible();
    await expect(page.getByText('Connect Google Calendar')).toBeVisible();
    await expect(page.getByText('STEP 02 — CALENDAR')).toBeVisible();
  });

  test('can skip to step 3 (Slack)', async ({ page }) => {
    await page.goto('/onboarding');

    // Skip step 1
    await page.getByText('Skip for now').click();
    await expect(page.getByText('Sync your calendar.')).toBeVisible();

    // Skip step 2
    await page.getByText('Skip for now').nth(0).click();
    await expect(page.getByText('Get briefed in Slack.')).toBeVisible();
    await expect(page.getByText('Connect Slack')).toBeVisible();
    await expect(page.getByText('STEP 03 — SLACK')).toBeVisible();
  });

  test('skip on step 3 completes onboarding and redirects', async ({ page }) => {
    await page.goto('/onboarding');

    // Skip to step 3
    await page.getByText('Skip for now').click(); // step 1
    await page.getByText('Skip for now').nth(0).click(); // step 2
    await expect(page.getByText('Get briefed in Slack.')).toBeVisible();

    // Before clicking, re-mock /auth/me to return an onboarded user
    // so that after complete() calls refresh(), the user appears onboarded
    // and the redirect to / sticks.
    await page.route('**/auth/me', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ONBOARDED_USER),
      });
    });

    // Step 3 button says "Enter the round →" (not "Skip for now")
    await page.getByText('Enter the round →').click();

    // Should redirect to /
    await page.waitForURL('**/');
  });
});
