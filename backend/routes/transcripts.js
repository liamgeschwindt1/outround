'use strict';

/**
 * Transcripts routes
 *
 *   GET /api/transcripts           — list completed bot transcripts (with summary)
 *   GET /api/transcripts/:botId    — full transcript + intelligence for one bot
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../db/client');

const router = express.Router();

router.get('/transcripts', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });

  try {
    const { rows } = await pool.query(
      `SELECT
         b.id,
         b.recall_bot_id,
         b.conference_url,
         b.status,
         b.join_at,
         b.duration_seconds,
         b.summary,
         b.next_steps,
         b.objections,
         b.created_at,
         b.updated_at,
         (b.transcript IS NOT NULL) AS has_transcript,
         m.title AS meeting_title,
         m.prospect_name,
         m.prospect_company,
         m.starts_at
       FROM meeting_bots b
       LEFT JOIN meetings m ON m.id = b.meeting_id
       WHERE b.user_id = $1
       AND b.status IN ('done', 'in_call', 'joining')
       ORDER BY b.created_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json({
      transcripts: rows.map((r) => ({
        id: r.id,
        recall_bot_id: r.recall_bot_id,
        meeting_title: r.meeting_title || 'Untitled meeting',
        prospect_name: r.prospect_name || null,
        prospect_company: r.prospect_company || null,
        starts_at: r.starts_at || r.join_at,
        status: r.status,
        duration_seconds: r.duration_seconds,
        has_transcript: r.has_transcript,
        summary: r.summary || null,
        next_steps: r.next_steps || [],
        objections: r.objections || [],
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error('[transcripts] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/transcripts/:botId', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'DB not available' });

  try {
    const { rows } = await pool.query(
      `SELECT b.*, m.title AS meeting_title, m.prospect_name, m.prospect_company, m.starts_at
       FROM meeting_bots b
       LEFT JOIN meetings m ON m.id = b.meeting_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.botId, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const b = rows[0];
    res.json({
      id: b.id,
      meeting_title: b.meeting_title || 'Untitled meeting',
      prospect_name: b.prospect_name || null,
      prospect_company: b.prospect_company || null,
      starts_at: b.starts_at || b.join_at,
      status: b.status,
      duration_seconds: b.duration_seconds,
      summary: b.summary || null,
      next_steps: b.next_steps || [],
      objections: b.objections || [],
      competitor_mentions: b.competitor_mentions || [],
      transcript: b.transcript || null,
      acoustic_metrics: b.acoustic_metrics || null,
      pipedrive_pushed_at: b.pipedrive_pushed_at || null,
      created_at: b.created_at,
    });
  } catch (err) {
    console.error('[transcripts] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
