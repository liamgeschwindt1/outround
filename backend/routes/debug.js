'use strict';

/**
 * Debug / LogBook endpoints
 *
 *   GET /api/debug/logs    — merged feed: DB rows + ring buffer (sessions, meetings, auth, http, errors)
 *   GET /api/debug/status  — system health snapshot (DB, Supabase config, env, memory, uptime)
 */

const express = require('express');
const router = express.Router();
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');

// ---------------------------------------------------------------------------
// In-process event ring buffer — 500 entries, survives route reloads
// ---------------------------------------------------------------------------
const RING_MAX = 500;
const ring = [];

function pushEvent(level, tag, message, meta = {}) {
  ring.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
    level,
    tag,
    message: String(message).slice(0, 500),
    meta,
  });
  if (ring.length > RING_MAX) ring.shift();
}

// Capture startup
pushEvent('info', 'server', 'Backend process started', {
  pid: process.pid,
  node: process.version,
  env: process.env.NODE_ENV || 'development',
  supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
  db: !!process.env.DATABASE_URL,
  dev_login: process.env.ALLOW_DEV_LOGIN === 'true',
});

// Export early so server.js can import before routes are mounted
module.exports.pushEvent = pushEvent;

// Redact PII and key material from log metadata before returning to clients
function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const safe = { ...meta };
  // Redact email addresses
  if (safe.email) safe.email = redactEmail(safe.email);
  if (safe.user && typeof safe.user === 'string' && safe.user.includes('@')) {
    safe.user = redactEmail(safe.user);
  }
  // Strip key prefixes if they leaked
  if (safe.key_prefix) delete safe.key_prefix;
  if (safe.token_preview) delete safe.token_preview;
  return safe;
}

function redactEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const visible = local.length <= 3 ? local[0] : local.slice(0, 2);
  return `${visible}***@${domain}`;
}

// Patch console.error + console.warn to feed into ring
const _origError = console.error.bind(console);
const _origWarn = console.warn.bind(console);
console.error = (...args) => {
  _origError(...args);
  const str = args.map((a) => (a instanceof Error ? a.stack : String(a))).join(' ');
  pushEvent('error', 'backend', str.slice(0, 500));
};
console.warn = (...args) => {
  _origWarn(...args);
  const str = args.map((a) => String(a)).join(' ');
  pushEvent('warn', 'backend', str.slice(0, 500));
};

// ---------------------------------------------------------------------------
// GET /api/debug/auth-test  — public endpoint to diagnose auth config without logging in
// Returns Supabase config status and the last 20 auth ring-buffer events.
// Sensitive values (service key) are NEVER exposed — only boolean presence.
// ---------------------------------------------------------------------------
router.get('/auth-test', (req, res) => {
  const authEvents = ring.filter((e) => e.tag === 'auth').slice(-20);
  // Redact any key material from auth events before returning
  const safeEvents = authEvents.map((e) => ({
    ...e,
    meta: sanitizeMeta(e.meta),
  }));
  res.json({
    config: {
      supabase_url: process.env.SUPABASE_URL
        ? process.env.SUPABASE_URL.replace(/https:\/\//, '').slice(0, 25) + '...'
        : 'NOT SET',
      has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
      has_anon_key: !!process.env.SUPABASE_ANON_KEY,
      node_version: process.version,
    },
    recent_auth_events: safeEvents,
  });
});

// GET /api/debug/logs  — requires auth; redacts PII from returned data
// ---------------------------------------------------------------------------
router.get('/logs', requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const entries = [];

  // 1. DB: recent sessions
  try {
    const pool = db.getPool ? db.getPool() : null;
    if (pool) {
      const { rows } = await pool.query(
        `SELECT
           id, started_at AS ts, ended_at, persona_id, mode, score,
           user_name, user_email, user_role, duration_seconds
         FROM sessions
         ORDER BY started_at DESC LIMIT 50`
      );
      for (const r of rows) {
        entries.push({
          id: `sess-${r.id}`,
          ts: r.ended_at || r.ts,
          level:
            r.score == null ? 'info' : r.score >= 70 ? 'success' : r.score >= 50 ? 'warn' : 'error',
          tag: 'session',
          message:
            r.ended_at && r.score != null
              ? `Round scored ${r.score}/100 — ${r.persona_id || '?'} — ${r.user_name || r.user_email || 'anon'}`
              : `Round started — ${r.persona_id || '?'} — ${r.user_name || r.user_email || 'anon'}`,
          meta: {
            session_id: r.id,
            user: r.user_name || r.user_email || 'anon',
            role: r.user_role,
            persona: r.persona_id,
            mode: r.mode,
            score: r.score,
            duration_s: r.duration_seconds,
            started: r.ts,
            ended: r.ended_at,
          },
        });
      }

      // 2. DB: recent users
      const { rows: users } = await pool.query(
        `SELECT id, email, name, role, provider, onboarding_complete, created_at, updated_at
         FROM users ORDER BY updated_at DESC LIMIT 20`
      );
      for (const u of users) {
        entries.push({
          id: `user-${u.id}`,
          ts: u.updated_at || u.created_at,
          level: 'info',
          tag: 'auth',
          message: `User record — ${u.email} (${u.provider}) onboarding=${u.onboarding_complete}`,
          meta: {
            user_id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            provider: u.provider,
            onboarding_complete: u.onboarding_complete,
            created: u.created_at,
          },
        });
      }

      // 3. DB: recent meetings (only those starting in the last 24h or upcoming,
      //    so the log isn't flooded with long-past calendar events)
      try {
        const { rows: mtgs } = await pool.query(
          `SELECT id, title, starts_at, created_at AS ts, updated_at, outround_done, source
           FROM meetings
           WHERE starts_at >= NOW() - INTERVAL '1 day'
           ORDER BY starts_at ASC LIMIT 15`
        );
        for (const m of mtgs) {
          entries.push({
            id: `mtg-${m.id}`,
            ts: m.ts,
            level: 'info',
            tag: 'meeting',
            message: `Meeting — ${m.title || 'Untitled'} — ${new Date(m.starts_at).toLocaleDateString()}`,
            meta: {
              id: m.id,
              source: m.source,
              outround_done: m.outround_done,
              starts_at: m.starts_at,
            },
          });
        }
      } catch {
        /* meetings table may not exist */
      }
    }
  } catch (err) {
    entries.push({
      id: `dberr-${Date.now()}`,
      ts: new Date().toISOString(),
      level: 'error',
      tag: 'db',
      message: `DB query failed: ${err.message}`,
      meta: { error: err.message },
    });
  }

  // 4. In-process ring buffer (includes http requests, auth events, errors)
  for (const e of ring) entries.push(e);

  // Sort newest-first, dedupe by id, respect limit
  entries.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  const seen = new Set();
  const deduped = [];
  for (const e of entries) {
    const key = e.id || `${e.ts}|${e.tag}|${e.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      // Redact PII before returning
      deduped.push({
        ...e,
        message: redactEmail(e.message),
        meta: sanitizeMeta(e.meta),
        ...(e.meta?.user && typeof e.meta.user === 'string'
          ? { meta: { ...sanitizeMeta(e.meta), user: redactEmail(e.meta.user) } }
          : {}),
      });
    }
    if (deduped.length >= limit) break;
  }

  res.json({ logs: deduped, total: deduped.length, generated_at: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// GET /api/debug/status  — system health snapshot, requires auth
// ---------------------------------------------------------------------------
router.get('/status', requireAuth, async (req, res) => {
  const pool = db.getPool ? db.getPool() : null;
  let dbStatus = 'not_configured';
  let dbMs = null;

  if (pool) {
    const t0 = Date.now();
    try {
      await pool.query('SELECT 1');
      dbStatus = 'ok';
      dbMs = Date.now() - t0;
    } catch (err) {
      dbStatus = `error: ${err.message}`;
    }
  }

  const mem = process.memoryUsage();
  const upSecs = Math.floor(process.uptime());

  res.json({
    ts: new Date().toISOString(),
    uptime_seconds: upSecs,
    uptime_human: `${Math.floor(upSecs / 3600)}h ${Math.floor((upSecs % 3600) / 60)}m ${upSecs % 60}s`,
    env: process.env.NODE_ENV || 'development',
    node_version: process.version,
    pid: process.pid,
    db: { status: dbStatus, response_ms: dbMs },
    auth: {
      supabase_url_set: !!process.env.SUPABASE_URL,
      supabase_service_key_set: !!process.env.SUPABASE_SERVICE_KEY,
      supabase_anon_key_set: !!process.env.SUPABASE_ANON_KEY,
      allow_dev_login: process.env.ALLOW_DEV_LOGIN === 'true',
    },
    integrations: {
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      assemblyai: !!process.env.ASSEMBLYAI_API_KEY,
      vapi: !!process.env.VAPI_API_KEY,
      claude: !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY,
      recall: !!process.env.RECALL_API_KEY,
      pipedrive: !!process.env.PIPEDRIVE_CLIENT_ID,
      gcal: !!process.env.GOOGLE_CLIENT_ID,
    },
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    ring_buffer: { size: ring.length, capacity: RING_MAX },
  });
});

module.exports = router;
module.exports.pushEvent = pushEvent;
