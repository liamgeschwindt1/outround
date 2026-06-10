'use strict';

/**
 * Meeting intelligence routes -- manual triggers and test endpoints.
 * Mounted at /api/intel
 *
 * Multi-tenant: all pipeline endpoints accept an org ID so the right
 * credentials are fetched from Supabase. Supply via:
 *   Header:  X-Org-Id: <uuid>
 *   Body:    { orgId: "<uuid>", ... }
 *   Query:   ?orgId=<uuid>
 *
 * If no orgId is provided and Supabase is not configured, credentials
 * fall through to env-var fallbacks inside each service.
 *
 * Endpoints:
 *
 *   POST /api/intel/test-pipeline      -- Step 1: prove Pipedrive + Slack
 *   POST /api/intel/extract            -- Step 2: Claude extraction only
 *   POST /api/intel/transcribe         -- Step 3: Recall async transcription
 *   POST /api/intel/poll-calendar      -- Step 5: manual calendar poll
 *   GET  /api/intel/processed-events   -- show dedup state
 */

const express = require('express');
const router = express.Router();
const meetingIntel    = require('../services/meeting-intel');
const recall          = require('../services/recall');
const calendarPoller  = require('../services/calendar-poller');
const tokenManager    = require('../services/token-manager');

// ── Internal auth guard ─────────────────────────────────────────────────────
// Protected by a shared secret in INTEL_SECRET env var.
// If not set, only allow in non-production environments.

function guard(req, res, next) {
  const secret = process.env.INTEL_SECRET;
  if (secret) {
    const provided = req.headers['x-intel-secret'] || req.query.secret;
    if (provided !== secret) return res.status(401).json({ error: 'unauthorized' });
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'INTEL_SECRET must be set in production' });
  }
  next();
}

// ── Fake transcript used for Step 1 testing ────────────────────────────────

const FAKE_TRANSCRIPT = [
  { speaker: 'Rep', text: "Hi, is this Henrik? Great — this is James from Outround. I'll keep it short. We help B2B sales teams cut cold-call prep time by 60%. Given your team size at Vandermeer, that's probably 2 hours per rep per week. Worth 15 minutes?", start: 0 },
  { speaker: 'Prospect', text: "I have five minutes. What exactly are you offering?", start: 18 },
  { speaker: 'Rep', text: "We give reps a realistic AI persona to practise against before the real call — they go in scored and briefed, not guessing. Teams using it see 30% more meetings booked in the first month.", start: 28 },
  { speaker: 'Prospect', text: "We already use a training platform. I don't see why we need another tool.", start: 52 },
  { speaker: 'Rep', text: "Understood. The difference is we're not training — we're readiness. Your reps aren't slow because they haven't been trained, they're slow because they haven't warmed up for this specific call. Different problem.", start: 62 },
  { speaker: 'Prospect', text: "That's an interesting distinction. What does it cost?", start: 88 },
  { speaker: 'Rep', text: "For a team your size, €99 per seat per month. Most teams get ROI in the first week if they close one extra deal.", start: 98 },
  { speaker: 'Prospect', text: "I'd need to see data on that. Can you send me a case study and we'll talk next week?", start: 112 },
  { speaker: 'Rep', text: "Absolutely. I'll send it today. Does Thursday at 10am CET work for a 15-minute follow-up?", start: 128 },
  { speaker: 'Prospect', text: "Yes, Thursday works.", start: 140 },
];

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/intel/test-pipeline
 * Step 1: prove Pipedrive + Slack are wired up correctly.
 * Uses FAKE_TRANSCRIPT unless a transcript is supplied in the body.
 */
router.post('/test-pipeline', guard, async (req, res) => {
  const {
    transcript = FAKE_TRANSCRIPT,
    prospectEmail = null,
    prospectName = 'Henrik van der Berg',
    meetingTitle = 'Test cold call -- Outround pipeline check',
    attendees = [],
    date = new Date().toISOString().slice(0, 10),
  } = req.body;

  try {
    const creds = await resolveCreds(req);
    const result = await meetingIntel.runPipeline(transcript, {
      prospectEmail,
      prospectName,
      meetingTitle,
      attendees,
      date,
    }, creds);
    res.json({ ok: true, result });
  } catch (err) {
    console.error('[intel/test-pipeline]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/intel/extract
 * Step 2: Claude extraction only — useful for testing quality.
 */
router.post('/extract', guard, async (req, res) => {
  const { transcript, context = {} } = req.body;
  if (!transcript) return res.status(400).json({ error: '`transcript` is required' });

  try {
    const creds = await resolveCreds(req);
    const intel = await meetingIntel.extractIntelligence(transcript, context, creds);
    res.json({ ok: true, intel });
  } catch (err) {
    console.error('[intel/extract]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/intel/transcribe
 * Step 3: Recall async transcription — submit a recording ID and start a transcript job.
 */
router.post('/transcribe', guard, async (req, res) => {
  const { recordingId, language } = req.body;
  if (!recordingId) return res.status(400).json({ error: '`recordingId` is required' });

  const creds   = await resolveCreds(req);
  const apiKey  = process.env.RECALL_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'RECALL_API_KEY not set' });

  try {
    const result = await recall.createTranscript(recordingId, { language, apiKey });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[intel/transcribe]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/intel/poll-calendar
 * Step 5: manually trigger the calendar poller.
 */
router.post('/poll-calendar', guard, async (req, res) => {
  try {
    await calendarPoller.runNow();
    const state = calendarPoller.readState();
    res.json({ ok: true, processed_count: state.processed_events.length, state });
  } catch (err) {
    console.error('[intel/poll-calendar]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/intel/processed-events
 */
router.get('/processed-events', guard, (req, res) => {
  const state = calendarPoller.readState();
  res.json(state);
});

module.exports = router;
