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

// ─── Transcript fixtures ────────────────────────────────────────────────────────

export const TRANSCRIPT_FIXTURES = {
  empty: { transcripts: [] as Record<string, unknown>[] },

  single: {
    transcripts: [
      {
        id: 't-001',
        meeting_title: 'Discovery Call — Acme Corp',
        prospect_name: 'Jane Smith',
        prospect_company: 'Acme Corp',
        starts_at: '2026-06-01T14:00:00Z',
        status: 'done',
        duration_seconds: 1830,
        has_transcript: true,
        summary:
          'Discussed budget constraints and timeline for Q3 rollout. Jane expressed interest in the enterprise tier.',
        next_steps: ['Send pricing docs', 'Schedule technical deep-dive', 'Connect with IT team'],
        objections: ['Budget is tight for Q3', 'Need SOC2 compliance'],
        created_at: '2026-06-01T14:30:00Z',
      },
    ],
  },

  multiple: {
    transcripts: [
      {
        id: 't-001',
        meeting_title: 'Discovery Call — Acme Corp',
        prospect_name: 'Jane Smith',
        prospect_company: 'Acme Corp',
        starts_at: '2026-06-01T14:00:00Z',
        status: 'done',
        duration_seconds: 1830,
        has_transcript: true,
        summary: 'Discussed budget constraints and timeline for Q3 rollout.',
        next_steps: ['Send pricing docs'],
        objections: ['Budget is tight'],
        created_at: '2026-06-01T14:30:00Z',
      },
      {
        id: 't-002',
        meeting_title: 'Q2 Review — Internal',
        prospect_name: null,
        prospect_company: null,
        starts_at: null,
        status: 'failed',
        duration_seconds: null,
        has_transcript: false,
        summary: null,
        next_steps: [] as string[],
        objections: [] as string[],
        created_at: '2026-05-15T10:00:00Z',
      },
    ],
  },

  detail: (id: string) => ({
    id,
    meeting_title: 'Discovery Call — Acme Corp',
    prospect_name: 'Jane Smith',
    prospect_company: 'Acme Corp',
    starts_at: '2026-06-01T14:00:00Z',
    status: 'done',
    duration_seconds: 1830,
    has_transcript: true,
    summary:
      'Discussed budget constraints and timeline for Q3 rollout. Jane expressed interest in the enterprise tier with custom integrations.',
    next_steps: ['Send pricing docs', 'Schedule technical deep-dive'],
    objections: ['Budget is tight for Q3', 'Need SOC2 compliance'],
    competitor_mentions: ['Competitor X'],
    transcript: {
      utterances: [
        {
          speaker: 'A',
          text: 'Thanks for joining today. Can you tell me more about your current workflow?',
          start: 0,
        },
        {
          speaker: 'B',
          text: 'Sure, we are currently using spreadsheets and manual tracking.',
          start: 12,
        },
        {
          speaker: 'A',
          text: 'I see. How many deals are you tracking per quarter?',
          start: 25,
        },
      ],
    },
    acoustic_metrics: {},
    pipedrive_pushed_at: null,
    created_at: '2026-06-01T14:30:00Z',
  }),

  detailNoTranscript: (id: string) => ({
    id,
    meeting_title: 'Discovery Call — Acme Corp',
    prospect_name: 'Jane Smith',
    prospect_company: 'Acme Corp',
    starts_at: '2026-06-01T14:00:00Z',
    status: 'done',
    duration_seconds: 1830,
    has_transcript: false,
    summary: 'Discussed budget constraints.',
    next_steps: ['Follow up'],
    objections: [] as string[],
    competitor_mentions: [] as string[],
    transcript: null,
    acoustic_metrics: {},
    pipedrive_pushed_at: null,
    created_at: '2026-06-01T14:30:00Z',
  }),
};

// ─── Transcript API mocks ───────────────────────────────────────────────────────

/**
 * Register mocks for transcript API endpoints.
 *
 * IMPORTANT: Must be called AFTER setupFallbackMocks — Playwright uses
 * "last registered wins" for overlapping route matchers.
 *
 * @param page - Playwright Page
 * @param listData - Transcript list data to return from GET /api/transcripts
 * @param detailData - Function returning detail data for GET /api/transcripts/:id
 * @param uploadResult - Response for POST /api/transcripts/upload
 * @param deleteResult - Response for DELETE /api/transcripts/:id
 */
export async function setupTranscriptMocks(
  page: Page,
  opts?: {
    listData?: { transcripts: Record<string, unknown>[] };
    detailData?: (id: string) => Record<string, unknown>;
    uploadResult?: { ok: boolean; error?: string };
    deleteResult?: { ok: boolean };
  }
) {
  const list = opts?.listData ?? TRANSCRIPT_FIXTURES.empty;
  const detail = opts?.detailData ?? TRANSCRIPT_FIXTURES.detail;
  const uploadOk = opts?.uploadResult ?? { ok: true };
  const deleteOk = opts?.deleteResult ?? { ok: true };

  // GET /api/transcripts — exact list endpoint
  await page.route(
    (url) => new URL(url).pathname === '/api/transcripts',
    (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      return jsonOk(route, list);
    }
  );

  // /api/transcripts/:id — handles both GET (detail) and DELETE
  const transcriptsPath = '/api/transcripts/';
  await page.route(
    (url) => {
      const p = new URL(url).pathname;
      return p.startsWith(transcriptsPath) && p.length > transcriptsPath.length;
    },
    (route) => {
      const method = route.request().method();
      if (method === 'DELETE') return jsonOk(route, deleteOk);
      if (method === 'GET') {
        const id = new URL(route.request().url()).pathname.slice(transcriptsPath.length);
        return jsonOk(route, detail(id));
      }
      return route.continue();
    }
  );

  // POST /api/transcripts/upload
  await page.route(
    (url) => new URL(url).pathname === '/api/transcripts/upload',
    (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      if (!uploadOk.ok) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: uploadOk.error || 'Upload failed' }),
        });
      }
      return jsonOk(route, uploadOk);
    }
  );
}
