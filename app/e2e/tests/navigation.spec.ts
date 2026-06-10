import { test, expect, goTo } from '../helpers';

test.describe('AppShell sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/');
  });

  // ─── Nav links ─────────────────────────────────────────────────────────────

  const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Calendar', to: '/calendar' },
    { label: 'CRM', to: '/crm' },
    { label: 'Transcripts', to: '/transcripts' },
    { label: 'Intelligence', to: '/intelligence' },
    { label: 'Team', to: '/team' },
    { label: 'Meeting Bot', to: '/bot' },
    { label: 'Logs', to: '/logs' },
    { label: 'Settings', to: '/settings' },
  ];

  for (const { label, to } of navItems) {
    test(`sidebar has "${label}" nav link`, async ({ page }) => {
      const link = page.locator('aside').getByText(label);
      await expect(link).toBeVisible();
    });

    test(`clicking "${label}" navigates to ${to}`, async ({ page }) => {
      const link = page.locator('aside').getByText(label);
      await link.click();
      await page.waitForURL(`**${to}`);
    });
  }

  // ─── Active state ──────────────────────────────────────────────────────────

  test('active nav link has distinct styling', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('**/settings');

    // The active link should have a border (check the computed style via the
    // parent <a> element). We'll verify the element is visible and has the
    // expected text color or border by checking it exists within the aside.
    const settingsLink = page.locator('aside a[href="/settings"]');
    await expect(settingsLink).toBeVisible();

    // The active link gets a border class from NavLink's isActive render prop.
    // We can verify it has inline style with the border.
    const style = await settingsLink.getAttribute('style');
    expect(style).toContain('border');
  });

  // ─── Profile ───────────────────────────────────────────────────────────────

  test('profile button shows user initials', async ({ page }) => {
    // The profile button shows initials for "Test User" → "TE"
    const profileBtn = page.locator('aside button').last();
    // Use exact:true because "TE" is a substring of "Test" (the user's name)
    await expect(profileBtn.getByText('TE', { exact: true })).toBeVisible();
  });

  test('profile popup opens on click', async ({ page }) => {
    const profileBtn = page.locator('aside button').last();
    await profileBtn.click();

    // Popup should show user info — use .first() because "Test" also
    // appears in the sidebar button itself ("TE Test")
    await expect(page.getByText('Test').first()).toBeVisible();
    await expect(page.getByText('Founder')).toBeVisible();
    await expect(page.getByText('Account settings')).toBeVisible();
    await expect(page.getByText('Sign out')).toBeVisible();
  });

  test('profile popup closes when clicking profile button again', async ({ page }) => {
    const profileBtn = page.locator('aside button').last();

    // Open
    await profileBtn.click();
    await expect(page.getByText('Sign out')).toBeVisible();

    // Close
    await profileBtn.click();
    await expect(page.getByText('Sign out')).not.toBeVisible();
  });

  test('sign out redirects to login', async ({ page }) => {
    // Open profile popup
    await page.locator('aside button').last().click();
    await expect(page.getByText('Sign out')).toBeVisible();

    // Click sign out
    await page.getByText('Sign out').click();
    await page.waitForURL('**/login');
  });

  // ─── Nav dividers ──────────────────────────────────────────────────────────

  test('sidebar renders content with nav items', async ({ page }) => {
    // All 9 nav items should be visible at once (checking key ones is enough)
    await expect(page.locator('aside').getByText('Dashboard')).toBeVisible();
    await expect(page.locator('aside').getByText('Intelligence')).toBeVisible();
    await expect(page.locator('aside').getByText('Meeting Bot')).toBeVisible();
    await expect(page.locator('aside').getByText('Settings')).toBeVisible();
  });
});
