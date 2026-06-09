'use strict';

/**
 * Calendar poller — runs every 5 minutes, fetches upcoming Google Calendar
 * events, and dispatches a Recall.ai bot for any external-attendee meetings
 * that haven't been processed yet.
 *
 * Uses env vars directly (single-user mode — no DB required):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN
 *   COMPANY_DOMAIN          — e.g. "acme.com"; attendees not matching this are external
 *   RECALL_API_KEY          — required to dispatch bots
 *   RECALL_WEBHOOK_URL      — webhook endpoint Recall calls when done
 *
 * Processed event IDs are stored in backend/data/processed-events.json so
 * the server doesn't join the same meeting twice across restarts.
 */

const fs = require('fs');
const path = require('path');
const recall = require('./recall');

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LOOK_AHEAD_MINUTES = 30;           // dispatch bot for meetings starting within 30 min
const STATE_FILE = path.join(__dirname, '../data/processed-events.json');
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

let _timer = null;
let _accessToken = null;
let _tokenExpiry = 0;

// ── State file ─────────────────────────────────────────────────────────────

function readState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { processed_events: [] };
  }
}

function writeState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[calendar-poller] failed to write state file:', err.message);
  }
}

function isProcessed(eventId) {
  return readState().processed_events.includes(eventId);
}

function markProcessed(eventId) {
  const state = readState();
  if (!state.processed_events.includes(eventId)) {
    state.processed_events.push(eventId);
    writeState(state);
  }
}

// ── Google OAuth (direct token refresh) ────────────────────────────────────

async function getAccessToken() {
  if (_accessToken && Date.now() < _tokenExpiry - 60_000) return _accessToken;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN must all be set');
  }

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Google token refresh failed: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  _accessToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return _accessToken;
}

// ── Calendar fetch ─────────────────────────────────────────────────────────

async function fetchUpcomingEvents() {
  const token = await getAccessToken();
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + LOOK_AHEAD_MINUTES * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '20',
  });

  const resp = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Google Calendar API error: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  return data.items || [];
}

// ── External attendee check ─────────────────────────────────────────────────

function hasExternalAttendee(event) {
  const domain = (process.env.COMPANY_DOMAIN || '').toLowerCase();
  const attendees = event.attendees || [];
  return attendees.some(a => {
    if (!a.email || a.resource || a.self) return false;
    if (!domain) return true; // if no domain set, treat all non-self as external
    return !a.email.toLowerCase().endsWith(`@${domain}`);
  });
}

function getConferenceUrl(event) {
  const entry = event?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video');
  if (entry?.uri) return entry.uri;

  const text = `${event?.location || ''} ${event?.description || ''}`;
  const match = text.match(/https?:\/\/[^\s<>"]+(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com)[^\s<>"]*/i);
  return match?.[0] || null;
}

// ── Poll tick ──────────────────────────────────────────────────────────────

async function poll() {
  if (!process.env.GOOGLE_REFRESH_TOKEN) return; // silently skip if not configured

  try {
    const events = await fetchUpcomingEvents();

    for (const ev of events) {
      if (ev.status === 'cancelled') continue;
      if (isProcessed(ev.id)) continue;
      if (!hasExternalAttendee(ev)) continue;

      const meetingUrl = getConferenceUrl(ev);
      if (!meetingUrl) {
        console.log(`[calendar-poller] ${ev.summary} — no conference URL found, skipping`);
        markProcessed(ev.id); // mark so we don't spam logs
        continue;
      }

      if (!recall.isConfigured()) {
        console.warn('[calendar-poller] RECALL_API_KEY not set — cannot dispatch bot');
        continue;
      }

      try {
        const bot = await recall.createBot({
          meetingUrl,
          botName: 'Outround Notetaker',
        });
        markProcessed(ev.id);
        console.log(`[calendar-poller] dispatched bot ${bot?.id} for "${ev.summary}" (${ev.id})`);
      } catch (err) {
        console.error(`[calendar-poller] failed to dispatch bot for "${ev.summary}":`, err.message);
        // Don't mark processed — retry next poll
      }
    }
  } catch (err) {
    console.error('[calendar-poller] poll error:', err.message);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

function start() {
  if (_timer) return; // already running
  console.log('[calendar-poller] started — polling every 5 minutes');
  poll(); // run immediately on start
  _timer = setInterval(poll, POLL_INTERVAL_MS);
  _timer.unref(); // don't prevent process exit
}

function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    console.log('[calendar-poller] stopped');
  }
}

/** Trigger a manual poll (useful for testing). */
async function runNow() {
  return poll();
}

module.exports = { start, stop, runNow, readState, markProcessed };
