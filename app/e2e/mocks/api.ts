import type { Page, Route } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function jsonOk(route: Route, body: unknown) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

// ─── Dashboard API mocks ────────────────────────────────────────────────────────

/**
 * Register mocks for the API endpoints hit by the Dashboard page
 * (`useDashboardData` calls `/api/session/stats`, `/api/leaderboard`,
 * `/api/meetings/upcoming`, and `/api/session/history`).
 */
export async function setupDashboardMocks(page: Page) {
  await page.route('**/api/session/stats', (route) => {
    return jsonOk(route, {
      total_sessions: 42,
      avg_score: 72.5,
      best_score: 94,
      current_streak: 5,
    });
  });

  await page.route('**/api/leaderboard', (route) => {
    return jsonOk(route, {
      entries: [
        { name: 'Test User', role: 'Founder', score: 87, is_you: true },
        { name: 'Alice Chen', role: 'VP Sales', score: 91 },
        { name: 'Bob Smith', role: 'SDR', score: 76 },
      ],
      week_start: '2026-06-01',
    });
  });

  await page.route('**/api/meetings/upcoming', (route) => {
    return jsonOk(route, {
      connected: true,
      bot_configured: true,
      meetings: [],
    });
  });

  await page.route('**/api/session/history', (route) => {
    return jsonOk(route, []);
  });
}

/**
 * Register a broad fallback for any `/api/*` route that wasn't explicitly mocked.
 * Returns an empty success response so pages don't show error states for
 * unmocked endpoints.
 *
 * Uses a URL-matching function (not glob ** /api/**) to avoid matching
 * source files like /src/api/client.ts, which would break Vite's module loading.
 */
export async function setupApiFallback(page: Page) {
  await page.route(
    (url) => {
      return new URL(url).pathname.startsWith('/api/');
    },
    (route) => {
      return jsonOk(route, {});
    }
  );
}
