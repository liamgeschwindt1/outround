'use strict';

/**
 * Calendar poller -- runs every 5 minutes.
 *
 * Multi-tenant mode (default when SUPABASE_URL + SUPABASE_SERVICE_KEY are set):
 *   Iterates over all rows in the `organisations` table, fetches each org's
 *   Google OAuth token from the `integrations` table, and dispatches a
 *   Recall.ai bot for any upcoming external-attendee meeting that hasn't
 *   been processed yet.
 *
 * Single-account fallback (legacy -- when Supabase is not configured):
 *   Uses GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN
 *   env vars directly, and COMPANY_DOMAIN for external-attendee detection.
 *
 * Env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY   -- enables multi-tenant mode
 *   RECALL_API_KEY                       -- required to dispatch bots (shared)
 *   RECALL_WEBHOOK_URL                   -- Recall calls this when done
 *   -- legacy single-account fallback --
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, COMPANY_DOMAIN
 */

const fs   = require('fs');
const path = require('path');
const gcal   = require('./gcal');
const recall = require('./recall');

const POLL_INTERVAL_MS   = 5 * 60 * 1000;
const LOOK_AHEAD_MINUTES = 30;
const STATE_FILE         = path.join(__dirname, '../data/processed-events.json');
const GOOGLE_TOKEN_URL   = 'https://oauth2.googleapis.com/token';

let _timer = null;

// -- Processed-event dedup store ------------------------------------------------

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

// -- Calendar helpers -----------------------------------------------------------

function hasExternalAttendee(event, companyDomain) {
  const domain    = (companyDomain || '').toLowerCase();
  const attendees = event.attendees || [];
  return attendees.some(a => {
    if (!a.email || a.resource || a.self) return false;
    if (!domain) return true;
    return !a.email.toLowerCase().endsWith('@' + domain);
  });
}

function getConferenceUrl(event) {
  const entry = event && event.conferenceData &&
    (event.conferenceData.entryPoints || []).find(e => e.entryPointType === 'video');
  if (entry && entry.uri) return entry.uri;
  const text  = ((event && event.location) || '') + ' ' + ((event && event.description) || '');
  const match = text.match(/https?:\/\/[^\s<>"]+(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com)[^\s<>"]*/i);
  return (match && match[0]) || null;
}

// -- Legacy single-account Google auth -----------------------------------------

let _legacyAccessToken = null;
let _legacyTokenExpiry = 0;

async function _getLegacyAccessToken() {
  if (_legacyAccessToken && Date.now() < _legacyTokenExpiry - 60000) return _legacyAccessToken;

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN must all be set for legacy mode');
  }

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error('Google token refresh failed: ' + resp.status + ' ' + txt);
  }

  const data = await resp.json();
  _legacyAccessToken = data.access_token;
  _legacyTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return _legacyAccessToken;
}

// -- Per-org poll ---------------------------------------------------------------

async function _pollOrg(org, recallApiKey) {
  const tokenManager = require('./token-manager');
  const googleCreds  = await tokenManager.getIntegration(org.id, 'google').catch(() => null);
  if (!googleCreds || !googleCreds.accessToken) return; // no Google integration -- skip silently

  let events;
  try {
    events = await gcal.listUpcomingEventsWithToken(googleCreds.accessToken, {
      days:       Math.max(1, Math.ceil(LOOK_AHEAD_MINUTES / (24 * 60))),
      maxResults: 20,
    });
  } catch (err) {
    console.error('[calendar-poller] GCal fetch failed for org ' + org.id + ':', err.message);
    return;
  }

  const companyDomain = org.company_domain || '';

  for (const ev of events) {
    if (ev.status === 'cancelled') continue;
    if (isProcessed(ev.id))       continue;
    if (!hasExternalAttendee(ev, companyDomain)) continue;

    const meetingUrl = getConferenceUrl(ev);
    if (!meetingUrl) { markProcessed(ev.id); continue; }

    try {
      const bot = await recall.createBot({ meetingUrl, botName: 'Outround Notetaker' }, recallApiKey);
      if (bot) {
        // Persist org_id on meeting_bots so the webhook can look it up later
        const { getPool } = require('../db/client');
        const pool = getPool();
        if (pool) {
          await pool.query(
            'INSERT INTO meeting_bots (recall_bot_id, org_id, conference_url, status)' +
            ' VALUES ($1, $2, $3, \'scheduled\')' +
            ' ON CONFLICT (recall_bot_id) DO UPDATE SET org_id = EXCLUDED.org_id',
            [bot.id, org.id, meetingUrl]
          ).catch(err => console.warn('[calendar-poller] meeting_bots upsert failed:', err.message));
        }
        markProcessed(ev.id);
        console.log('[calendar-poller] dispatched bot ' + bot.id + ' for org ' + org.id + ' -- "' + ev.summary + '"');
      }
    } catch (err) {
      console.error('[calendar-poller] dispatch failed for org ' + org.id + ' -- "' + ev.summary + '":', err.message);
    }
  }
}

// -- Main poll tick -------------------------------------------------------------

async function poll() {
  const recallApiKey = process.env.RECALL_API_KEY;
  if (!recallApiKey) {
    console.warn('[calendar-poller] RECALL_API_KEY not set -- skipping poll');
    return;
  }

  const tokenManager = require('./token-manager');

  if (tokenManager.isConfigured()) {
    // Multi-tenant: iterate all orgs
    let orgs;
    try {
      orgs = await tokenManager.listOrgs();
    } catch (err) {
      console.error('[calendar-poller] listOrgs failed:', err.message);
      return;
    }

    for (const org of orgs) {
      await _pollOrg(org, recallApiKey).catch(err =>
        console.error('[calendar-poller] org ' + org.id + ' poll error:', err.message)
      );
    }
  } else {
    // Legacy single-account fallback
    if (!process.env.GOOGLE_REFRESH_TOKEN) return;
    try {
      const accessToken   = await _getLegacyAccessToken();
      const events        = await gcal.listUpcomingEventsWithToken(accessToken, {
        days: Math.max(1, Math.ceil(LOOK_AHEAD_MINUTES / (24 * 60))),
        maxResults: 20,
      });
      const companyDomain = process.env.COMPANY_DOMAIN || '';

      for (const ev of events) {
        if (ev.status === 'cancelled') continue;
        if (isProcessed(ev.id))       continue;
        if (!hasExternalAttendee(ev, companyDomain)) continue;

        const meetingUrl = getConferenceUrl(ev);
        if (!meetingUrl) { markProcessed(ev.id); continue; }

        try {
          const bot = await recall.createBot({ meetingUrl, botName: 'Outround Notetaker' }, recallApiKey);
          if (bot) {
            markProcessed(ev.id);
            console.log('[calendar-poller] (legacy) dispatched bot ' + bot.id + ' for "' + ev.summary + '"');
          }
        } catch (err) {
          console.error('[calendar-poller] (legacy) dispatch failed for "' + ev.summary + '":', err.message);
        }
      }
    } catch (err) {
      console.error('[calendar-poller] legacy poll error:', err.message);
    }
  }
}

// -- Public API ----------------------------------------------------------------

function start() {
  if (_timer) return;
  console.log('[calendar-poller] started -- polling every 5 minutes');
  poll();
  _timer = setInterval(poll, POLL_INTERVAL_MS);
  _timer.unref();
}

function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    console.log('[calendar-poller] stopped');
  }
}

async function runNow() {
  return poll();
}

module.exports = { start, stop, runNow, readState, markProcessed };
