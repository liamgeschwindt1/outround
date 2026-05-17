'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/client');
const elevenlabs = require('../services/elevenlabs');
const claude = require('../services/claude');
const { calculateMetricsFromTranscript } = require('../services/metrics');

// In-memory session store — transparent fallback when DB is unavailable
const memStore = new Map();

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
    sessionId = uuidv4();
  }

  // Always keep a memStore entry (source of truth when DB is down)
  memStore.set(sessionId, {
    id: sessionId,
    persona_id,
    user_name: user_name || null,
    status: 'pending',
  });

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

  // Determine persona — check memStore first, then DB
  let personaId = memStore.get(id)?.persona_id || 'hendrik';
  try {
    const result = await db.query('SELECT persona_id FROM sessions WHERE id = $1', [id]);
    if (result.rows.length > 0) personaId = result.rows[0].persona_id;
  } catch {
    // DB unavailable — use memStore value
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

  // Update DB
  try {
    await db.query(
      `UPDATE sessions SET ended_at = NOW(), duration_seconds = $1,
       elevenlabs_conversation_id = $2 WHERE id = $3`,
      [duration_seconds || 0, elevenlabs_conversation_id || null, id]
    );
  } catch (err) {
    console.error('DB error ending session:', err.message);
  }

  // Update memStore (create entry if it doesn't exist yet)
  const existing = memStore.get(id) || { id, persona_id: 'hendrik' };
  memStore.set(id, {
    ...existing,
    elevenlabs_conversation_id: elevenlabs_conversation_id || null,
    duration_seconds: duration_seconds || 0,
    status: 'processing',
  });

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

  // Try DB first
  try {
    const result = await db.query(
      `SELECT score, score_breakdown, coaching_feedback, transcript, audio_metrics
       FROM sessions WHERE id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      if (row.score === null) return res.json({ status: 'processing' });
      const breakdown = row.score_breakdown || {};
      return res.json({
        status: 'complete',
        score: row.score,
        score_breakdown: {
          opening: breakdown.opening,
          objections: breakdown.objections,
          talk_ratio: breakdown.talk_ratio,
          clear_ask: breakdown.clear_ask,
        },
        headline: breakdown.headline || null,
        call_verdict: breakdown.call_verdict || null,
        call_momentum: breakdown.call_momentum || null,
        next_session_focus: breakdown.next_session_focus || null,
        coaching_feedback: row.coaching_feedback || [],
        transcript: row.transcript || [],
        audio_metrics: row.audio_metrics || {},
        sentiment_timeline: breakdown.sentiment_timeline || [],
      });
    }
  } catch (err) {
    console.error('DB status check failed:', err.message);
    // Fall through to memStore
  }

  // Fall back to in-memory store
  const mem = memStore.get(id);
  if (!mem) return res.status(404).json({ error: 'Session not found' });
  if (mem.status === 'complete' && mem.result) return res.json({ status: 'complete', ...mem.result });
  if (mem.status === 'error') return res.status(500).json({ error: mem.errorMessage || 'Analysis failed' });
  return res.json({ status: 'processing' });
});

// ---------------------------------------------------------------------------
// Background: fetch transcript, compute metrics, grade with Claude, store
// ---------------------------------------------------------------------------
async function processSession(sessionId, { elevenlabs_conversation_id, duration_seconds }) {
  const durationSecs = duration_seconds || 0;
  const memSession = memStore.get(sessionId);
  const personaId = memSession?.persona_id || 'hendrik';

  // Check session exists in DB or memStore — proceed as long as one has it
  let useMemOnly = false;
  try {
    const check = await db.query('SELECT id FROM sessions WHERE id = $1', [sessionId]);
    if (check.rows.length === 0 && !memSession) {
      console.error('processSession: session not found anywhere, skipping —', sessionId);
      return;
    }
    useMemOnly = check.rows.length === 0;
  } catch (err) {
    console.error('processSession: DB check failed —', err.message);
    if (!memSession) return;
    useMemOnly = true;
  }

  // 1. Fetch transcript from ElevenLabs
  let transcript = [];
  let actualDuration = durationSecs;
  if (elevenlabs_conversation_id) {
    try {
      const result = await elevenlabs.getConversationTranscript(elevenlabs_conversation_id);
      transcript = result.transcript;
      if (result.durationSeconds > 0) actualDuration = result.durationSeconds;
    } catch (err) {
      console.error('Failed to fetch ElevenLabs transcript:', err.message);
    }
  }

  // 2. Calculate audio metrics
  const audioMetrics = calculateMetricsFromTranscript(transcript, actualDuration);

  // 3. Grade with Claude
  let grading;
  try {
    const persona = require(`../personas/${personaId}.json`);
    grading = await claude.gradeSession(transcript, audioMetrics, persona);
  } catch (err) {
    console.error('Claude grading error:', err.message);
    grading = {
      overall_score: 0,
      score_breakdown: { opening: 0, objections: 0, talk_ratio: 0, clear_ask: 0 },
      headline: 'Analysis failed — check server logs',
      call_verdict: null, call_momentum: null, next_session_focus: null,
      coaching_feedback: [{ title: 'Analysis unavailable', score: 0, score_label: 'bad',
        body: 'Could not complete analysis: ' + err.message, quote: '', action: '', category: null }],
      sentiment_timeline: [],
    };
  }

  // 4. Persist results
  await storeResults(sessionId, useMemOnly, grading, transcript, audioMetrics);
}

async function storeResults(sessionId, useMemOnly, grading, transcript, audioMetrics) {
  const scoreBreakdown = {
    opening: grading.score_breakdown.opening,
    objections: grading.score_breakdown.objections,
    talk_ratio: grading.score_breakdown.talk_ratio,
    clear_ask: grading.score_breakdown.clear_ask,
    headline: grading.headline || null,
    call_verdict: grading.call_verdict || null,
    call_momentum: grading.call_momentum || null,
    next_session_focus: grading.next_session_focus || null,
    sentiment_timeline: grading.sentiment_timeline || [],
  };

  let savedToDb = false;
  if (!useMemOnly) {
    try {
      await db.query(
        `UPDATE sessions SET score = $1, score_breakdown = $2, coaching_feedback = $3,
         transcript = $4, audio_metrics = $5 WHERE id = $6`,
        [
          grading.overall_score,
          JSON.stringify(scoreBreakdown),
          JSON.stringify(grading.coaching_feedback),
          JSON.stringify(transcript),
          JSON.stringify(audioMetrics),
          sessionId,
        ]
      );
      savedToDb = true;
    } catch (err) {
      console.error('processSession: DB save failed, using memStore —', err.message);
    }
  }

  // Always update memStore (as primary or fallback)
  const existing = memStore.get(sessionId) || { id: sessionId };
  memStore.set(sessionId, {
    ...existing,
    status: 'complete',
    result: {
      score: grading.overall_score,
      score_breakdown: {
        opening: grading.score_breakdown.opening,
        objections: grading.score_breakdown.objections,
        talk_ratio: grading.score_breakdown.talk_ratio,
        clear_ask: grading.score_breakdown.clear_ask,
      },
      headline: grading.headline || null,
      call_verdict: grading.call_verdict || null,
      call_momentum: grading.call_momentum || null,
      next_session_focus: grading.next_session_focus || null,
      coaching_feedback: grading.coaching_feedback || [],
      transcript,
      audio_metrics: audioMetrics,
      sentiment_timeline: grading.sentiment_timeline || [],
    },
  });

  console.log(`Session ${sessionId} — score: ${grading.overall_score}, verdict: ${grading.call_verdict || 'n/a'} (${savedToDb ? 'DB+mem' : 'mem only'})`);
}

module.exports = router;
