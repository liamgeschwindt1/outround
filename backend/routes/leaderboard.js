'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');

// GET /api/leaderboard
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_name, user_role, MAX(score) AS best_score
       FROM sessions
       WHERE score IS NOT NULL AND score >= 0
         AND started_at > NOW() - INTERVAL '7 days'
       GROUP BY user_name, user_role
       ORDER BY best_score DESC
       LIMIT 20`
    );

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const entries = result.rows.map((r) => ({
      name: r.user_name || 'Anonymous',
      role: r.user_role || '',
      score: parseInt(r.best_score, 10),
    }));

    res.json({ entries, week_start: weekStart.toISOString() });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    // Return empty leaderboard rather than error — DB might not be seeded yet
    res.json({ entries: [], week_start: new Date().toISOString() });
  }
});

module.exports = router;
