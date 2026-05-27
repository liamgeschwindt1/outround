'use strict';

/**
 * GET /api/debug/logs
 *
 * Synthesises a real-time activity feed from DB tables + in-process
 * event buffer. Returns the 50 most-recent log entries across:
 *   - session lifecycle (started, scored, failed)
 *   - meeting sync events
 *   - auth events (captured by this module)
 *   - server startup info
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db/client');

// ---------------------------------------------------------------------------
// In-process event ring buffer (max 200 entries, cleared on restart)
// ---------------------------------------------------------------------------
const RING_MAX = 200;
const ring = [];

function pushEvent(level, tag, message, meta = {}) {
  ring.push({ ts: new Date().toISOString(), level, tag, message, meta });
  if (ring.length > RING_MAX) ring.shift();
}

// Capture startup time
pushEvent('info', 'server', 'Backend process started', { pid: process.pid, node: process.version });

// Expose so other modules can push events
module.exports.pushEvent = pushEvent;

// Patch console.error to capture [tag] prefixed messages into the ring
const _origError = console.error.bind(console);
console.error = (...args) => {
  _origError(...args);
  const str = args.map(a => (a instanceof Error ? a.stack : String(a))).join(' ');
  pushEvent('error', 'backend', str.slice(0, 300));
};

// ---------------------------------------------------------------------------
// GET /api/debug/logs
// ---------------------------------------------------------------------------
router.get('/logs', requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const entries = [];

  // 1. DB: recent sessions
  try {
    const pool = db.getPool ? db.getPool() : null;
    if (pool) {
      const { rows } = await pool.query(
        `SELECT
           id,
           started_at   AS ts,
           ended_at,
           persona_id,
           mode,
           score,
           user_name,
           user_email,
           duration_seconds
         FROM sessions
         ORDER BY started_at DESC
         LIMIT 30`
      );

      for (const r of rows) {
        if (r.ended_at && r.score !== null) {
          entries.push({
            ts: r.ended_at,
            level: r.score >= 70 ? 'success' : r.score >= 50 ? 'warn' : 'info',
            tag: 'session',
            message: `Round complete — ${r.persona_id || 'unknown'} — score ${r.score}`,
            meta: {
              id: r.id,
              mode: r.mode,
              user: r.user_name || r.user_email || 'anon',
              duration: r.duration_seconds,
              score: r.score,
            },
          });
        } else if (r.started_at) {
          entries.push({
            ts: r.started_at,
            level: 'info',
            tag: 'session',
            message: `Round started — ${r.persona_id || 'unknown'}`,
            meta: {
              id: r.id,
              mode: r.mode,
              user: r.user_name || r.user_email || 'anon',
            },
          });
        }
      }

      // 2. DB: recent meeting syncs
      const { rows: mtgs } = await pool.query(
        `SELECT
           id,
           title,
           starts_at,
           created_at  AS ts,
           updated_at,
           outround_done,
           source
         FROM meetings
         ORDER BY updated_at DESC
         LIMIT 20`
      );

      for (const m of mtgs) {
        entries.push({
          ts: m.ts,
          level: 'info',
          tag: 'meeting',
          message: `Meeting synced — ${m.title || 'Untitled'} — ${new Date(m.starts_at).toLocaleDateString()}`,
          meta: { id: m.id, source: m.source, outround_done: m.outround_done },
        });
      }
    }
  } catch (err) {
    entries.push({
      ts: new Date().toISOString(),
      level: 'error',
      tag: 'db',
      message: `DB query failed: ${err.message}`,
      meta: {},
    });
  }

  // 3. In-process ring buffer
  for (const e of ring) {
    entries.push(e);
  }

  // Sort by ts desc, dedupe by ts+message, take limit
  entries.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  const seen = new Set();
  const deduped = [];
  for (const e of entries) {
    const key = `${e.ts}|${e.tag}|${e.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(e);
    }
    if (deduped.length >= limit) break;
  }

  res.json({ logs: deduped, generated_at: new Date().toISOString() });
});

module.exports = router;
module.exports.pushEvent = pushEvent;
