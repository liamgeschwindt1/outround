/**
 * Coach personas API
 *
 * GET  /api/coaches          — list available coach personas
 * POST /api/coaches/select   — set the current user's coach
 *
 * Coaches are distinct from prospect personas (Hendrik, Natalie).
 * Each coach has a name, style, voice_id, and a system prompt template.
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getPool } = require('../db/client');

const router = express.Router();

// ---------------------------------------------------------------------------
// Built-in coach personas (seeded until DB is configured)
// ---------------------------------------------------------------------------
const BUILT_IN_COACHES = [
  {
    id: 'alex',
    name: 'Alex',
    tagline: 'Straight-talking. No fluff.',
    description:
      'Alex has run 40-person sales teams and closed enterprise deals across three continents. Expects precision. Gets frustrated by vague answers. Will tell you exactly where you lost the call.',
    style: 'direct',
    avatar_url: null,
    voice_id: 'pNInz6obpgDQGcFmaJgB', // ElevenLabs "Adam"
  },
  {
    id: 'maya',
    name: 'Maya',
    tagline: 'Pattern recognition. Always one step ahead.',
    description:
      'Former consultant turned sales director. Obsessed with frameworks and repeatable systems. Will spot a filler word pattern before you do. Pushes you to think, not just act.',
    style: 'analytical',
    avatar_url: null,
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // ElevenLabs "Bella"
  },
];

// ---------------------------------------------------------------------------
// GET /api/coaches
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  const pool = getPool();

  // Try DB first; fall back to built-in if DB not configured
  if (pool) {
    try {
      const { rows } = await pool.query(
        'SELECT id, name, tagline, description, style, avatar_url, voice_id FROM coaches ORDER BY created_at'
      );
      if (rows.length > 0) return res.json(rows);
    } catch {
      // Table may not exist yet — fall through to built-in coaches
    }
  }

  res.json(BUILT_IN_COACHES);
});

// ---------------------------------------------------------------------------
// POST /api/coaches/select  { coach_id: string }
// ---------------------------------------------------------------------------
router.post('/select', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const { coach_id } = req.body;
  if (!coach_id) return res.status(400).json({ error: 'coach_id is required' });

  const pool = getPool();
  if (!pool) {
    // Return OK without persisting if DB is unavailable (dev mode)
    return res.json({ ok: true, coach_id });
  }

  await pool.query(
    'UPDATE users SET coach_id = $1, updated_at = NOW() WHERE id = $2',
    [coach_id, userId]
  );

  // Upsert preferences row too
  await pool.query(
    `INSERT INTO user_preferences (user_id, coach_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET coach_id = EXCLUDED.coach_id, updated_at = NOW()`,
    [userId, coach_id]
  );

  res.json({ ok: true, coach_id });
});

module.exports = router;
