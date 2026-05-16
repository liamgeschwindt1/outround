'use strict';

const express = require('express');
const router = express.Router();
const db = require('../db/client');
const elevenlabs = require('../services/elevenlabs');
const claude = require('../services/claude');
const { calculateMetricsFromTranscript } = require('../services/assemblyai');

// ---------------------------------------------------------------------------
// POST /api/session/start
// ---------------------------------------------------------------------------
router.post('/start', async (req, res) => {
  const { user_name, user_email, user_role, persona_id = 'hendrik' } = req.body;

  if (!persona_id) {
    return res.status(400).json({ error: 'persona_id required' });
  }

  let persona;
  try {
    persona = require(`../personas/${persona_id}.json`);
  } catch {
    return res.status(404).json({ error: 'Persona not found' });
  }

  let sessionId;
  try {
    const result = await db.query(
      `INSERT INTO sessions (user_name, user_email, user_role, persona_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [user_name || null, user_email || null, user_role || null, persona_id]
    );
    sessionId = result.rows[0].id;
  } catch (err) {
    console.error('DB error creating session:', err.message);
    // Fall back to a temporary in-memory ID so the call still works
    const { v4: uuidv4 } = require('uuid');
    sessionId = uuidv4();
  }

  res.json({
    session_id: sessionId,
    persona: {
      name: persona.name,
      title: `${persona.title} — ${persona.company} — ${persona.location.split(',')[0]}`,
      flag: persona.flag,
      scenario: persona.scenario,
      traits: persona.traits.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
    },
    brief_expires_seconds: 30,
  });
});

// ---------------------------------------------------------------------------
// GET /api/session/:id/voice-token
// ---------------------------------------------------------------------------
router.get('/:id/voice-token', async (req, res) => {
  const { id } = req.params;

  // Determine persona for this session
  let personaId = 'hendrik';
  try {
    const result = await db.query('SELECT persona_id FROM sessions WHERE id = $1', [id]);
    if (result.rows.length > 0) personaId = result.rows[0].persona_id;
  } catch {
    // DB unavailable — use default persona
  }

  try {
    const signedUrl = await elevenlabs.getConversationToken(personaId);
    res.json({ signed_url: signedUrl });
  } catch (err) {
    console.error('ElevenLabs token error:', err.message);
    res.status(503).json({ error: 'Voice service unavailable', detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/session/:id/end
// ---------------------------------------------------------------------------
router.post('/:id/end', async (req, res) => {
  const { id } = req.params;
  const { elevenlabs_conversation_id, duration_seconds } = req.body;

  // Update ended_at immediately
  try {
    await db.query(
      `UPDATE sessions SET ended_at = NOW(), duration_seconds = $1,
       elevenlabs_conversation_id = $2 WHERE id = $3`,
      [duration_seconds || 0, elevenlabs_conversation_id || null, id]
    );
  } catch (err) {
    console.error('DB error ending session:', err.message);
  }

  // Respond immediately — analysis runs in the background
  res.json({ status: 'processing', message: 'Analysis running. Poll /api/session/:id/status' });

  // Background processing — not awaited
  processSession(id, { elevenlabs_conversation_id, duration_seconds }).catch((err) =>
    console.error('Background processing error for session', id, err.message)
  );
});

// ---------------------------------------------------------------------------
// GET /api/session/:id/status
// ---------------------------------------------------------------------------
router.get('/:id/status', async (req, res) => {
  const { id } = req.params;

  let row;
  try {
    const result = await db.query(
      `SELECT score, score_breakdown, coaching_feedback, transcript, audio_metrics
       FROM sessions WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    row = result.rows[0];
  } catch (err) {
    console.error('DB error fetching session status:', err.message);
    return res.status(503).json({ error: 'Database unavailable' });
  }

  if (row.score === null) {
    return res.json({ status: 'processing' });
  }

  const breakdown = row.score_breakdown || {};

  res.json({
    status: 'complete',
    score: row.score,
    score_breakdown: {
      opening: breakdown.opening,
      objections: breakdown.objections,
      talk_ratio: breakdown.talk_ratio,
      clear_ask: breakdown.clear_ask,
    },
    headline: breakdown.headline || null,
    coaching_feedback: row.coaching_feedback || [],
    transcript: row.transcript || [],
    audio_metrics: row.audio_metrics || {},
    sentiment_timeline: breakdown.sentiment_timeline || [],
  });
});

// ---------------------------------------------------------------------------
// Background: fetch transcript, compute metrics, grade with Claude, store
// ---------------------------------------------------------------------------
async function processSession(sessionId, { elevenlabs_conversation_id, duration_seconds }) {
  const durationSecs = duration_seconds || 0;

  // 1. Fetch transcript from ElevenLabs
  let transcript = [];
  if (elevenlabs_conversation_id) {
    try {
      const result = await elevenlabs.getConversationTranscript(elevenlabs_conversation_id);
      transcript = result.transcript;
      // Use ElevenLabs duration if more accurate
      if (result.durationSeconds > 0 && durationSecs === 0) {
        duration_seconds = result.durationSeconds;
      }
    } catch (err) {
      console.error('Failed to fetch ElevenLabs transcript:', err.message);
    }
  }

  // 2. Calculate audio metrics from transcript text
  const audioMetrics = calculateMetricsFromTranscript(transcript, durationSecs);

  // 3. Grade with Claude
  let grading;
  try {
    const persona = require('../personas/hendrik.json');
    grading = await claude.gradeSession(transcript, audioMetrics, persona);
  } catch (err) {
    console.error('Claude grading error:', err.message);
    // Store a minimal result so the UI doesn't poll forever
    await db.query(
      `UPDATE sessions SET score = 0, score_breakdown = $1, coaching_feedback = $2,
       transcript = $3, audio_metrics = $4 WHERE id = $5`,
      [
        JSON.stringify({ opening: 0, objections: 0, talk_ratio: 0, clear_ask: 0 }),
        JSON.stringify([{ title: 'Analysis unavailable', score: 0, score_label: 'bad',
          body: 'Could not complete analysis. Please try again.',
          quote: '', action: '' }]),
        JSON.stringify(transcript),
        JSON.stringify(audioMetrics),
        sessionId,
      ]
    );
    return;
  }

  // 4. Persist results
  const scoreBreakdown = {
    opening: grading.score_breakdown.opening,
    objections: grading.score_breakdown.objections,
    talk_ratio: grading.score_breakdown.talk_ratio,
    clear_ask: grading.score_breakdown.clear_ask,
    headline: grading.headline || null,
    sentiment_timeline: grading.sentiment_timeline || [],
  };

  await db.query(
    `UPDATE sessions SET
       score = $1,
       score_breakdown = $2,
       coaching_feedback = $3,
       transcript = $4,
       audio_metrics = $5
     WHERE id = $6`,
    [
      grading.overall_score,
      JSON.stringify(scoreBreakdown),
      JSON.stringify(grading.coaching_feedback),
      JSON.stringify(transcript),
      JSON.stringify(audioMetrics),
      sessionId,
    ]
  );
}

module.exports = router;
