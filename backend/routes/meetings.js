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
const pipedrive = require('../services/pipedrive');
const claude = require('../services/claude');

const router = express.Router();

function viewModel(m, bot) {
  return {
    id: m.id || m.external_event_id,
    external_event_id: m.external_event_id,
    title: m.title,
    starts_at: m.starts_at,
    ends_at: m.ends_at,
    conference: m.conference_url
      ? {
          url: m.conference_url,
          provider: m.conference_provider,
        }
      : null,
    prospect: {
      name: m.prospect_name || m.prospect_email || 'Unknown',
      email: m.prospect_email,
      company: m.prospect_company,
      pipedrive_person_id: m.pipedrive_person_id,
    },
    deal: m.pipedrive_deal_id ? { id: m.pipedrive_deal_id } : null,
    outround_done: !!m.outround_done,
    outround_session_id: m.outround_session_id || null,
    bot: bot
      ? {
          id: bot.id,
          status: bot.status,
          join_at: bot.join_at,
          transcript_ready: !!bot.transcript,
        }
      : null,
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
      const ids = sync.meetings.map((m) => m.id).filter(Boolean);
      if (ids.length) {
        const { rows } = await pool.query(
          `SELECT DISTINCT ON (meeting_id) * FROM meeting_bots
             WHERE meeting_id = ANY($1::uuid[])
             ORDER BY meeting_id, created_at DESC`,
          [ids]
        );
        botsByMeeting = Object.fromEntries(rows.map((b) => [b.meeting_id, b]));
      }
    }

    res.json({
      connected: true,
      bot_configured: recall.isConfigured(),
      meetings: sync.meetings.map((m) => viewModel(m, botsByMeeting[m.id])),
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
  res.json(
    viewModel(
      m,
      m.bot_id
        ? {
            id: m.bot_id,
            status: m.bot_status,
            join_at: m.bot_join_at,
            transcript: m.bot_transcript_ready,
          }
        : null
    )
  );
});

router.post('/meetings/:id/bot', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });
  if (!recall.isConfigured()) {
    return res.status(503).json({ error: 'Meeting bot not configured', code: 'recall_missing' });
  }

  const { rows } = await pool.query('SELECT * FROM meetings WHERE id = $1 AND user_id = $2', [
    req.params.id,
    userId,
  ]);
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
      [
        userId,
        meeting.id,
        bot.id,
        meeting.conference_url,
        joinAt,
        'scheduled',
        bot.status_changes?.[0]?.code || null,
      ]
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
    try {
      await recall.deleteBot(bot.recall_bot_id);
    } catch (e) {
      console.error('[meetings] recall delete failed:', e.message);
    }
  }
  await pool.query(`UPDATE meeting_bots SET status='cancelled', updated_at=NOW() WHERE id=$1`, [
    bot.id,
  ]);
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

/**
 * GET /api/meetings/:id/prep
 *
 * Returns the full prep payload for a meeting: prospect, deal, recent notes,
 * recent activities, AI prospect summary, coaching notes, and the user-facing
 * persona summary. The raw persona system prompt is NEVER returned to the
 * client — it lives in the meetings.prep_persona_prompt column and is only
 * used server-side when starting a round.
 *
 * Caching: result is cached on the meeting row for 24h. Pass ?refresh=1 to bypass.
 */
router.get('/meetings/:id/prep', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });

  const { rows } = await pool.query(
    `SELECT m.*, u.name AS user_name, u.role AS user_role
       FROM meetings m
       LEFT JOIN users u ON u.id = m.user_id
      WHERE m.id = $1 AND m.user_id = $2`,
    [req.params.id, userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const m = rows[0];

  const refresh = req.query.refresh === '1';
  const cacheAgeMs = m.prep_generated_at
    ? Date.now() - new Date(m.prep_generated_at).getTime()
    : Infinity;
  const cacheValid = !refresh && m.prep_data && cacheAgeMs < 24 * 3600 * 1000;

  if (cacheValid) {
    return res.json({
      cached: true,
      generated_at: m.prep_generated_at,
      meeting: viewModel(m, null),
      ...m.prep_data,
    });
  }

  // Pull CRM data (each call is best-effort — partial data is fine)
  const personId = m.pipedrive_person_id;
  const dealId = m.pipedrive_deal_id;

  const [person, deal, personNotes, dealNotes, activities] = await Promise.all([
    personId ? pipedrive.getPerson(userId, personId) : Promise.resolve(null),
    dealId ? pipedrive.getDeal(userId, dealId) : Promise.resolve(null),
    personId ? pipedrive.getPersonNotes(userId, personId, 25) : Promise.resolve([]),
    dealId ? pipedrive.getDealNotes(userId, dealId, 25) : Promise.resolve([]),
    personId ? pipedrive.getPersonActivities(userId, personId, 25) : Promise.resolve([]),
  ]);

  // Merge & dedupe notes by id, keep most recent first
  const allNotes = [...dealNotes, ...personNotes];
  const seen = new Set();
  const notes = allNotes
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    })
    .sort((a, b) => new Date(b.add_time) - new Date(a.add_time));

  // Pull user's recent stats for coaching-note context
  let userStats = null;
  try {
    const { rows: statRows } = await pool.query(
      `SELECT score_breakdown FROM sessions
         WHERE user_id = $1 AND score_breakdown IS NOT NULL
         ORDER BY started_at DESC LIMIT 5`,
      [userId]
    );
    if (statRows.length) {
      // Average sub-scores across recent sessions
      const sums = {};
      const counts = {};
      for (const r of statRows) {
        for (const [k, v] of Object.entries(r.score_breakdown || {})) {
          if (typeof v === 'number') {
            sums[k] = (sums[k] || 0) + v;
            counts[k] = (counts[k] || 0) + 1;
          }
        }
      }
      const avg = {};
      for (const k of Object.keys(sums)) avg[k] = Math.round(sums[k] / counts[k]);
      userStats = { score_breakdown: avg };
    }
  } catch (err) {
    console.error('[meetings/prep] user stats fetch failed:', err.message);
  }

  let intel;
  let intelError = null;
  try {
    intel = await claude.generateMeetingPrepIntel({
      meeting: m,
      person,
      deal,
      notes,
      activities,
      user: { name: m.user_name, role: m.user_role },
      userStats,
    });
  } catch (err) {
    console.error('[meetings/prep] Claude intel failed:', err.message);
    intelError = err.message;
    intel = {
      prospect_summary: 'Prospect intel could not be generated. Try refreshing.',
      last_interaction: null,
      open_next_steps: [],
      coaching_notes: [],
      persona: null,
    };
  }

  const personaSummary = intel.persona?.summary || null;
  const personaPrompt = intel.persona?.system_prompt || null;

  // Strip system_prompt before persisting/returning — UI must never see it.
  const persistable = {
    prospect: person,
    deal,
    notes: notes.slice(0, 10),
    activities: activities.slice(0, 10),
    prospect_summary: intel.prospect_summary,
    last_interaction: intel.last_interaction,
    open_next_steps: intel.open_next_steps || [],
    coaching_notes: intel.coaching_notes || [],
    persona_summary: personaSummary,
    insufficient_crm_data: !person && !deal && notes.length === 0,
  };

  if (!intelError) {
    try {
      await pool.query(
        `UPDATE meetings
            SET prep_data = $1,
                prep_persona_prompt = $2,
                prep_generated_at = NOW(),
                updated_at = NOW()
          WHERE id = $3`,
        [persistable, personaPrompt, m.id]
      );
    } catch (err) {
      console.error('[meetings/prep] cache write failed:', err.message);
    }
  }

  res.json({
    cached: false,
    generated_at: new Date().toISOString(),
    meeting: viewModel(m, null),
    ...persistable,
    ...(intelError ? { intel_error: intelError } : {}),
  });
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

// POST /api/bots/dispatch — send a bot to any meeting URL (no calendar meeting required)
router.post('/bots/dispatch', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  if (!recall.isConfigured()) {
    return res.status(503).json({ error: 'Meeting bot not configured', code: 'recall_missing' });
  }

  const { meeting_url, join_at, bot_name } = req.body;
  if (!meeting_url) return res.status(400).json({ error: 'meeting_url required' });

  const pool = getPool();

  try {
    const bot = await recall.createBot({
      meetingUrl: meeting_url,
      joinAt: join_at || null,
      botName: bot_name || 'Outround Notetaker',
    });

    let inserted = null;
    if (pool) {
      const { rows } = await pool.query(
        `INSERT INTO meeting_bots
           (user_id, recall_bot_id, conference_url, join_at, status)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [userId, bot.id, meeting_url, join_at || null, 'scheduled']
      );
      inserted = rows[0];
    }

    res.json({
      ok: true,
      bot: inserted || { recall_bot_id: bot.id, conference_url: meeting_url, status: 'scheduled' },
    });
  } catch (err) {
    console.error('[bots] dispatch failed:', err.message);
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;
