import { test, expect, goTo } from '../helpers';
import { setupTranscriptMocks, TRANSCRIPT_FIXTURES, setupDashboardMocks } from '../mocks/api';
import { setupAuthMocks, setupFallbackMocks } from '../mocks/auth';

/**
 * Transcripts page E2E tests.
 *
 * Covers: empty state, transcript list, upload modal, delete, and the
 * detail drawer. All API calls are mocked via Playwright route interceptors.
 */

// ─── Empty state ───────────────────────────────────────────────────────────────

test.describe('Transcripts page — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, { listData: TRANSCRIPT_FIXTURES.empty });
    await page.reload();
  });

  test('shows empty state when no transcripts exist', async ({ page }) => {
    await expect(page.getByText('No transcripts yet.')).toBeVisible();
    await expect(
      page.getByText('Invite the meeting bot to a call from the Meeting Bot page.')
    ).toBeVisible();
    await expect(page.getByText('+ Upload transcript')).toBeVisible();
  });

  test('shows "0 recordings" count', async ({ page }) => {
    await expect(page.getByText('0 recordings')).toBeVisible();
  });
});

// ─── Transcript list ───────────────────────────────────────────────────────────

test.describe('Transcripts page — list', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, { listData: TRANSCRIPT_FIXTURES.multiple });
    await page.reload();
  });

  test('renders cards with meeting titles', async ({ page }) => {
    await expect(page.getByText('Discovery Call — Acme Corp')).toBeVisible();
    await expect(page.getByText('Q2 Review — Internal')).toBeVisible();
  });

  test('renders status badges', async ({ page }) => {
    await expect(page.getByText('done')).toBeVisible();
    await expect(page.getByText('failed')).toBeVisible();
  });

  test('renders prospect info when present', async ({ page }) => {
    await expect(page.getByText('Jane Smith · Acme Corp')).toBeVisible();
  });

  test('renders date metadata when starts_at is present', async ({ page }) => {
    await expect(page.getByText('Jun 1')).toBeVisible();
  });

  test('renders summary excerpt on cards that have one', async ({ page }) => {
    await expect(
      page.getByText('Discussed budget constraints and timeline for Q3 rollout.')
    ).toBeVisible();
  });

  test('shows correct recording count', async ({ page }) => {
    await expect(page.getByText('2 recordings')).toBeVisible();
  });
});

test.describe('Transcripts page — list (single)', () => {
  test('shows singular "1 recording" when count is 1', async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, { listData: TRANSCRIPT_FIXTURES.single });
    await page.reload();
    await expect(page.getByText('1 recording')).toBeVisible();
  });
});

// ─── Upload modal ──────────────────────────────────────────────────────────────

test.describe('Transcripts page — upload modal', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, { listData: TRANSCRIPT_FIXTURES.empty });
    await page.reload();
  });

  test('opens modal on "+ Upload transcript" button click', async ({ page }) => {
    await page.getByText('+ Upload transcript').click();

    // Verify modal form fields are visible (these are unique to the modal)
    await expect(page.getByPlaceholder('e.g. Discovery call with Acme')).toBeVisible();
    await expect(page.getByText('Paste text')).toBeVisible();
    await expect(page.getByText('Upload file')).toBeVisible();
    await expect(page.getByText('Cancel')).toBeVisible();
    await expect(page.getByText('Save transcript')).toBeVisible();
    // Paste textarea should be visible by default
    await expect(page.getByPlaceholder(/Speaker A: Hello/)).toBeVisible();
  });

  test('toggles between paste and file modes', async ({ page }) => {
    await page.getByText('+ Upload transcript').click();

    // Default: paste mode
    await expect(page.getByPlaceholder(/Speaker A: Hello/)).toBeVisible();

    // Switch to file mode
    await page.getByText('Upload file').click();
    await expect(page.getByText('Click to choose a .txt file')).toBeVisible();
    await expect(page.getByPlaceholder(/Speaker A: Hello/)).toHaveCount(0);

    // Switch back to paste mode
    await page.getByText('Paste text').click();
    await expect(page.getByPlaceholder(/Speaker A: Hello/)).toBeVisible();
  });

  test('Save transcript button is disabled until title and text are filled', async ({ page }) => {
    await page.getByText('+ Upload transcript').click();

    const saveBtn = page.getByText('Save transcript');

    // Should be disabled initially
    await expect(saveBtn).toBeDisabled();

    // Fill title only — still disabled
    await page.getByPlaceholder('e.g. Discovery call with Acme').fill('Test Meeting');
    await expect(saveBtn).toBeDisabled();

    // Fill text — should become enabled
    await page.getByPlaceholder(/Speaker A: Hello/).fill('Speaker A: Hello world');
    await expect(saveBtn).toBeEnabled();

    // Clear title — disabled again
    await page.getByPlaceholder('e.g. Discovery call with Acme').fill('');
    await expect(saveBtn).toBeDisabled();
  });

  test('successful submit shows confirmation and closes modal', async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, {
      listData: TRANSCRIPT_FIXTURES.empty,
      uploadResult: { ok: true },
    });
    await page.reload();

    await page.getByText('+ Upload transcript').click();
    await page.getByPlaceholder('e.g. Discovery call with Acme').fill('Test Meeting');
    await page.getByPlaceholder(/Speaker A: Hello/).fill('Speaker A: Hello world');
    await page.getByText('Save transcript').click();

    // Should show success confirmation
    await expect(page.getByText('Saved ✓')).toBeVisible();

    // Modal should close after the setTimeout(1200) — the form fields disappear
    await expect(page.getByPlaceholder('e.g. Discovery call with Acme')).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('shows error on upload failure', async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, {
      listData: TRANSCRIPT_FIXTURES.empty,
      uploadResult: { ok: false, error: 'Server rejected the upload' },
    });
    await page.reload();

    await page.getByText('+ Upload transcript').click();
    await page.getByPlaceholder('e.g. Discovery call with Acme').fill('Test Meeting');
    await page.getByPlaceholder(/Speaker A: Hello/).fill('Speaker A: Hello world');
    await page.getByText('Save transcript').click();

    // Error should be visible
    await expect(page.getByText('Server rejected the upload')).toBeVisible();

    // Modal should still be open (form fields still visible)
    await expect(page.getByPlaceholder('e.g. Discovery call with Acme')).toBeVisible();
  });

  test('Cancel button closes modal', async ({ page }) => {
    await page.getByText('+ Upload transcript').click();
    await expect(page.getByPlaceholder('e.g. Discovery call with Acme')).toBeVisible();

    await page.getByText('Cancel').click();
    await expect(page.getByPlaceholder('e.g. Discovery call with Acme')).not.toBeVisible();
  });

  test('backdrop click closes modal', async ({ page }) => {
    await page.getByText('+ Upload transcript').click();
    await expect(page.getByPlaceholder('e.g. Discovery call with Acme')).toBeVisible();

    // Click at the top-left corner of the page — well outside the centered modal card
    // so the click lands on the dark backdrop. The modal card is centered via flexbox
    // and does not cover the corners, so this reliably hits the backdrop.
    await page.mouse.click(10, 10);
    await expect(page.getByPlaceholder('e.g. Discovery call with Acme')).not.toBeVisible();
  });
});

// ─── Delete ────────────────────────────────────────────────────────────────────

test.describe('Transcripts page — delete', () => {
  test('delete button is visible on transcript cards', async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, { listData: TRANSCRIPT_FIXTURES.single });
    await page.reload();

    // The delete button has title="Delete transcript"
    await expect(page.locator('button[title="Delete transcript"]')).toBeVisible();
  });

  test('deleting a transcript removes it from the list', async ({ page }) => {
    // Set up all mocks manually before navigation so route ordering is correct.
    await setupAuthMocks(page, 'onboarded');
    await setupFallbackMocks(page);
    await setupDashboardMocks(page);

    // Flag-based approach: initially return the single transcript, then switch
    // to empty after the DELETE handler flips the flag.
    let deleted = false;

    await page.route(
      (url) => new URL(url).pathname === '/api/transcripts',
      (route) => {
        if (route.request().method() !== 'GET') return route.continue();
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(deleted ? { transcripts: [] } : TRANSCRIPT_FIXTURES.single),
        });
      }
    );

    await page.route(
      (url) => {
        const p = new URL(url).pathname;
        return p.startsWith('/api/transcripts/') && p.length > '/api/transcripts/'.length;
      },
      (route) => {
        if (route.request().method() !== 'DELETE') return route.continue();
        deleted = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      }
    );

    await page.goto('/transcripts', { waitUntil: 'networkidle' });

    // Verify the card is visible
    await expect(page.getByText('Discovery Call — Acme Corp')).toBeVisible({ timeout: 15000 });

    // Click delete — sets deleted=true, then refetch() returns empty list
    await page.locator('button[title="Delete transcript"]').click();

    // Wait for the GET refetch to complete after the DELETE
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/transcripts') &&
        !resp.url().includes('/api/transcripts/') &&
        resp.request().method() === 'GET',
      { timeout: 10000 }
    );

    // The card should disappear and empty state should appear
    await expect(page.getByText('No transcripts yet.')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('0 recordings')).toBeVisible();
  });
});

// ─── Drawer ────────────────────────────────────────────────────────────────────

test.describe('Transcripts page — drawer', () => {
  test.beforeEach(async ({ page }) => {
    await goTo(page, '/transcripts');
    await setupTranscriptMocks(page, { listData: TRANSCRIPT_FIXTURES.single });
    await page.reload();
  });

  test('opens drawer when clicking a transcript card', async ({ page }) => {
    await page.getByText('Discovery Call — Acme Corp').click();

    // The drawer shows the meeting date as a formatted string
    await expect(page.getByText('6/1/2026', { exact: false })).toBeVisible();

    // The SUMMARY section heading is only visible inside the drawer
    await expect(page.getByText('SUMMARY')).toBeVisible();
  });

  test('drawer shows SUMMARY section with content', async ({ page }) => {
    await page.getByText('Discovery Call — Acme Corp').click();

    await expect(page.getByText('SUMMARY')).toBeVisible();
    // The summary text appears on both the card (truncated) and in the drawer.
    // The drawer's copy is rendered later in the DOM, so use .last().
    await expect(
      page.getByText(/Discussed budget constraints and timeline for Q3 rollout/).last()
    ).toBeVisible();
  });

  test('drawer shows NEXT STEPS section with items', async ({ page }) => {
    await page.getByText('Discovery Call — Acme Corp').click();

    await expect(page.getByText('NEXT STEPS')).toBeVisible();
    // Next steps appear on both the card (as span tags) and in the drawer (as divs).
    // Use .last() to target the drawer's copy which is rendered later in the DOM.
    await expect(page.getByText('Send pricing docs').last()).toBeVisible();
    await expect(page.getByText('Schedule technical deep-dive').last()).toBeVisible();
  });

  test('drawer shows OBJECTIONS section with items', async ({ page }) => {
    await page.getByText('Discovery Call — Acme Corp').click();

    await expect(page.getByText('OBJECTIONS')).toBeVisible();
    await expect(page.getByText('Budget is tight for Q3')).toBeVisible();
    await expect(page.getByText('Need SOC2 compliance')).toBeVisible();
  });

  test('drawer shows transcript utterances', async ({ page }) => {
    await page.getByText('Discovery Call — Acme Corp').click();

    // The TRANSCRIPT section heading
    await expect(page.getByText('TRANSCRIPT', { exact: true })).toBeVisible();

    // Utterance text unique to the drawer
    await expect(
      page.getByText('Thanks for joining today. Can you tell me more about your current workflow?')
    ).toBeVisible();
  });

  test('drawer shows "Transcript not yet available." when transcript is null', async ({ page }) => {
    // Re-mock with a detail that has no transcript data
    await setupTranscriptMocks(page, {
      listData: TRANSCRIPT_FIXTURES.single,
      detailData: TRANSCRIPT_FIXTURES.detailNoTranscript,
    });
    await page.reload();

    await page.getByText('Discovery Call — Acme Corp').click();

    await expect(page.getByText('Transcript not yet available.')).toBeVisible();
  });

  test('close button in drawer header closes the drawer', async ({ page }) => {
    await page.getByText('Discovery Call — Acme Corp').click();
    await expect(page.getByText('SUMMARY')).toBeVisible();

    // The drawer's close button is the ✕ inside the fixed overlay.
    // The card also has an ✕ (delete button) — the drawer's is inside position:fixed.
    await page.locator('[style*="position: fixed"] button:has-text("✕")').first().click();

    // Drawer content should be gone
    await expect(page.getByText('SUMMARY')).not.toBeVisible();
  });

  test('backdrop click closes the drawer', async ({ page }) => {
    await page.getByText('Discovery Call — Acme Corp').click();
    await expect(page.getByText('SUMMARY')).toBeVisible();

    // The drawer uses z-index 300 with a backdrop at rgba(0,0,0,0.5).
    // Click the absolute-positioned backdrop inside the fixed drawer overlay.
    await page
      .locator(
        'div[style*="position: fixed"][style*="z-index: 300"] > div[style*="position: absolute"]'
      )
      .first()
      .click();

    await expect(page.getByText('SUMMARY')).not.toBeVisible();
  });
});
