/**
 * Meetings + Meeting Bot routes.
 *
 *   GET    /api/meetings/upcoming           — synced GCal+Pipedrive list
 *   GET    /api/meetings/:id                — single meeting with prep data
 *   POST   /api/meetings/:id/bot            — schedule Recall bot
 *   DELETE /api/meetings/:id/bot            — cancel scheduled bot
 *   GET    /api/meetings/:id/bot            — current bot status
 *   GET    /api/bots                        — list user's bots
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../db/client');
const calendarSync = require('../services/calendar-sync');
const recall = require('../services/recall');

const router = express.Router();

function viewModel(m, bot) {
  return {
    id: m.id || m.external_event_id,
    external_event_id: m.external_event_id,
    title: m.title,
    starts_at: m.starts_at,
    ends_at: m.ends_at,
    conference: m.conference_url ? {
      url: m.conference_url,
      provider: m.conference_provider,
    } : null,
    prospect: {
      name: m.prospect_name || m.prospect_email || 'Unknown',
      email: m.prospect_email,
      company: m.prospect_company,
      pipedrive_person_id: m.pipedrive_person_id,
    },
    deal: m.pipedrive_deal_id ? { id: m.pipedrive_deal_id } : null,
    outround_done: !!m.outround_done,
    outround_session_id: m.outround_session_id || null,
    bot: bot ? {
      id: bot.id,
      status: bot.status,
      join_at: bot.join_at,
      transcript_ready: !!bot.transcript,
    } : null,
    bot_supported: !!m.conference_url,
  };
}

router.get('/meetings/upcoming', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });
  const ownerEmail = req.user?.email || req.supabaseUser?.email;

  try {
    const sync = await calendarSync.syncUpcoming(userId, ownerEmail, 7);
    if (!sync.connected) {
      return res.json({
        connected: false,
        bot_configured: recall.isConfigured(),
        error: sync.error,
        meetings: [],
      });
    }

    const pool = getPool();
    let botsByMeeting = {};
    if (pool) {
      const ids = sync.meetings.map(m => m.id).filter(Boolean);
      if (ids.length) {
        const { rows } = await pool.query(
          `SELECT DISTINCT ON (meeting_id) * FROM meeting_bots
             WHERE meeting_id = ANY($1::uuid[])
             ORDER BY meeting_id, created_at DESC`,
          [ids]
        );
        botsByMeeting = Object.fromEntries(rows.map(b => [b.meeting_id, b]));
      }
    }

    res.json({
      connected: true,
      bot_configured: recall.isConfigured(),
      meetings: sync.meetings.map(m => viewModel(m, botsByMeeting[m.id])),
    });
  } catch (err) {
    console.error('[meetings] upcoming failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/meetings/:id', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });

  const { rows } = await pool.query(
    `SELECT m.*,
            b.id AS bot_id, b.status AS bot_status, b.join_at AS bot_join_at,
            (b.transcript IS NOT NULL) AS bot_transcript_ready
       FROM meetings m
       LEFT JOIN LATERAL (
         SELECT * FROM meeting_bots WHERE meeting_id = m.id
         ORDER BY created_at DESC LIMIT 1
       ) b ON true
      WHERE m.id = $1 AND m.user_id = $2`,
    [req.params.id, userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const m = rows[0];
  res.json(viewModel(m, m.bot_id ? {
    id: m.bot_id,
    status: m.bot_status,
    join_at: m.bot_join_at,
    transcript: m.bot_transcript_ready,
  } : null));
});

router.post('/meetings/:id/bot', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });
  if (!recall.isConfigured()) {
    return res.status(503).json({ error: 'Meeting bot not configured', code: 'recall_missing' });
  }

  const { rows } = await pool.query(
    'SELECT * FROM meetings WHERE id = $1 AND user_id = $2',
    [req.params.id, userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Meeting not found' });
  const meeting = rows[0];
  if (!meeting.conference_url) {
    return res.status(400).json({ error: 'Meeting has no video conference link' });
  }

  const joinAt = meeting.starts_at
    ? new Date(new Date(meeting.starts_at).getTime() - 60 * 1000).toISOString()
    : null;

  try {
    const bot = await recall.createBot({
      meetingUrl: meeting.conference_url,
      joinAt,
      botName: 'Outround Notetaker',
    });

    const { rows: inserted } = await pool.query(
      `INSERT INTO meeting_bots
         (user_id, meeting_id, recall_bot_id, conference_url, join_at, status, status_detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [userId, meeting.id, bot.id, meeting.conference_url, joinAt, 'scheduled',
       bot.status_changes?.[0]?.code || null]
    );
    res.json({ ok: true, bot: inserted[0] });
  } catch (err) {
    console.error('[meetings] bot create failed:', err);
    res.status(502).json({ error: err.message });
  }
});

router.delete('/meetings/:id/bot', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });

  const { rows } = await pool.query(
    `SELECT * FROM meeting_bots
       WHERE meeting_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 1`,
    [req.params.id, userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'No bot' });
  const bot = rows[0];

  if (recall.isConfigured() && bot.recall_bot_id) {
    try { await recall.deleteBot(bot.recall_bot_id); }
    catch (e) { console.error('[meetings] recall delete failed:', e.message); }
  }
  await pool.query(
    `UPDATE meeting_bots SET status='cancelled', updated_at=NOW() WHERE id=$1`,
    [bot.id]
  );
  res.json({ ok: true });
});

router.get('/meetings/:id/bot', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });
  const { rows } = await pool.query(
    `SELECT * FROM meeting_bots
       WHERE meeting_id = $1 AND user_id = $2
       ORDER BY created_at DESC LIMIT 1`,
    [req.params.id, userId]
  );
  res.json(rows[0] || null);
});

router.get('/bots', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  const pool = getPool();
  if (!pool) return res.json([]);
  const { rows } = await pool.query(
    `SELECT b.*, m.title AS meeting_title, m.starts_at, m.prospect_name
       FROM meeting_bots b
       LEFT JOIN meetings m ON m.id = b.meeting_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC LIMIT 50`,
    [userId]
  );
  res.json(rows);
});

module.exports = router;
