'use strict';

const fs = require('fs');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/client');
const elevenlabs = require('../services/elevenlabs');
const claude = require('../services/claude');
const { calculateMetricsFromTranscript } = require('../services/metrics');
const { requireAuth } = require('../middleware/auth');

// In-memory session store — transparent fallback when DB is unavailable
const memStore = new Map();

// Ensure deep analysis columns exist on the sessions table (safe to run repeatedly)
db.query(`ALTER TABLE IF EXISTS sessions ADD COLUMN IF NOT EXISTS deep_analysis JSONB`).catch(() => {});
db.query(`ALTER TABLE IF EXISTS sessions ADD COLUMN IF NOT EXISTS deep_analysis_status TEXT`).catch(() => {});
db.query(`ALTER TABLE IF EXISTS sessions ADD COLUMN IF NOT EXISTS mode TEXT`).catch(() => {});

// ---------------------------------------------------------------------------
// Persona loading — searches all modes/ subdirectories
// ---------------------------------------------------------------------------
function loadPersonaFile(personaId) {
  const modesDir = require('path').join(__dirname, '..', 'personas');
  for (const sub of fs.readdirSync(modesDir)) {
    const fp = require('path').join(modesDir, sub, `${personaId}.json`);
    if (fs.existsSync(fp)) return require(fp);
  }
  throw new Error(`Persona "${personaId}" not found`);
}

/**
 * Normalise persona to a flat object regardless of which JSON format is used.
 * New format (modes/) stores character fields inside _meta.
 */
function normalisePersona(raw) {
  if (!raw._meta) return raw; // old flat format
  const m = raw._meta;
  return {
    ...raw,
    // surface _meta fields at top level for backward-compat grading code
    canonical_name: m.canonical_name,
    phonetic_variants: m.phonetic_variants || [m.canonical_name],
    name: m.name || raw.name,
    title: m.title || '',
    company: m.company || '',
    location: m.location || '',
    flag: m.flag || '',
    traits: m.traits || [],
    scenario: m.grading_context?.scenario || '',
    mode: m.mode || 'cold_call',
  };
}

// ---------------------------------------------------------------------------
// POST /api/session/start
// ---------------------------------------------------------------------------
router.post('/start', requireAuth, async (req, res) => {
  const { user_name, user_email, user_role, persona_id = 'hendrik', mode = 'cold_call' } = req.body;

  if (!persona_id) {
    return res.status(400).json({ error: 'persona_id required' });
  }

  let personaRaw;
  try {
    personaRaw = loadPersonaFile(persona_id);
  } catch {
    return res.status(404).json({ error: 'Persona not found' });
  }
  const persona = normalisePersona(personaRaw);

  // Prefer authenticated user ID over anonymous session data
  const userId = req.user?.id || req.supabaseUser?.id || null;

  let sessionId;
  try {
    const result = await db.query(
      `INSERT INTO sessions (user_id, user_name, user_email, user_role, persona_id, mode)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, user_name || null, user_email || null, user_role || null, persona_id, mode]
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
    mode,
    user_name: user_name || null,
    status: 'pending',
  });

  res.json({
    session_id: sessionId,
    mode,
    persona: {
      name: persona.name,
      title: persona.title ? `${persona.title} — ${persona.company} — ${persona.location.split(',')[0]}` : persona.name,
      flag: persona.flag,
      scenario: persona.scenario,
      traits: (persona.traits || []).map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
    },
    brief_expires_seconds: 30,
  });
});

// ---------------------------------------------------------------------------
// GET /api/session/:id/voice-token
// ---------------------------------------------------------------------------
router.get('/:id/voice-token', async (req, res) => {
  const { id } = req.params;

  // Determine persona — memStore is authoritative when present; only hit DB as fallback
  let personaId = memStore.get(id)?.persona_id;  if (!personaId) {
    try {
      const result = await db.query('SELECT persona_id FROM sessions WHERE id = $1', [id]);
      if (result.rows.length > 0) personaId = result.rows[0].persona_id;
    } catch {
      // DB unavailable — fall back to default
    }
    personaId = personaId || 'hendrik';
  }

  try {
    const { signed_url, overrides } = await elevenlabs.getConversationToken(personaId);
    res.json({ signed_url, overrides: overrides || null });
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
// POST /api/session/:id/end-test — inject a sample transcript, skip ElevenLabs
// ---------------------------------------------------------------------------
router.post('/:id/end-test', async (req, res) => {
  const { id } = req.params;
  const { transcript, duration_seconds } = req.body;

  if (!Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ error: 'transcript array required' });
  }

  try {
    await db.query(
      `UPDATE sessions SET ended_at = NOW(), duration_seconds = $1 WHERE id = $2`,
      [duration_seconds || 90, id]
    );
  } catch (err) {
    console.error('DB error ending test session:', err.message);
  }

  const existing = memStore.get(id) || { id, persona_id: 'hendrik', mode: 'cold_call' };
  memStore.set(id, { ...existing, status: 'processing' });

  res.json({ status: 'processing', message: 'Test analysis running. Poll /api/session/:id/status' });

  _processTestSession(id, transcript, duration_seconds || 90).catch((err) =>
    console.error('Test session error for', id, err.message)
  );
});

async function _processTestSession(sessionId, injectedTranscript, durationSecs) {
  const memSession = memStore.get(sessionId);
  let personaId = memSession?.persona_id || null;
  let sessionMode = memSession?.mode || null;
  let useMemOnly = false;

  try {
    const check = await db.query('SELECT id, persona_id, mode FROM sessions WHERE id = $1', [sessionId]);
    useMemOnly = check.rows.length === 0;
    if (check.rows.length > 0) {
      if (!personaId) personaId = check.rows[0].persona_id || 'hendrik';
      if (!sessionMode) sessionMode = check.rows[0].mode || 'cold_call';
    }
  } catch (err) {
    console.error('_processTestSession: DB check failed —', err.message);
    useMemOnly = true;
  }

  if (!personaId) personaId = 'hendrik';
  if (!sessionMode) sessionMode = 'cold_call';

  const audioMetrics = calculateMetricsFromTranscript(injectedTranscript, durationSecs);

  if (!useMemOnly) {
    try {
      await db.query(
        `UPDATE sessions SET transcript = $1, audio_metrics = $2 WHERE id = $3`,
        [JSON.stringify(injectedTranscript), JSON.stringify(audioMetrics), sessionId]
      );
    } catch (err) { console.error('DB error saving test transcript:', err.message); }
  }

  memStore.set(sessionId, {
    ...(memStore.get(sessionId) || { id: sessionId }),
    status: 'processing',
    transcript: injectedTranscript,
    audio_metrics: audioMetrics,
  });

  let grading;
  try {
    const personaRaw = loadPersonaFile(personaId);
    const persona = normalisePersona(personaRaw);
    grading = sessionMode === 'investor_pitch'
      ? await claude.gradePitchFast(injectedTranscript, audioMetrics, persona)
      : await claude.gradeSessionFast(injectedTranscript, audioMetrics, persona);
  } catch (err) {
    console.error('Test grading error:', err.message);
    grading = sessionMode === 'investor_pitch'
      ? { overall_score: 0, score_breakdown: { problem_clarity: 0, why_now: 0, right_to_win: 0, ask_clarity: 0 }, headline: 'Analysis failed', call_verdict: null, call_momentum: null, next_session_focus: null }
      : { overall_score: 0, score_breakdown: { opening: 0, objections: 0, talk_ratio: 0, clear_ask: 0 }, headline: 'Analysis failed', call_verdict: null, call_momentum: null, next_session_focus: null };
  }

  await storeResults(sessionId, useMemOnly, grading, injectedTranscript, audioMetrics, sessionMode);
}

// ---------------------------------------------------------------------------
// GET /api/session/:id/status
// ---------------------------------------------------------------------------
router.get('/:id/status', async (req, res) => {
  const { id } = req.params;

  // Try DB first
  try {
    const result = await db.query(
      `SELECT score, score_breakdown, transcript, audio_metrics, mode
       FROM sessions WHERE id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      if (row.score === null) {
        return res.json({
          status: 'processing',
          transcript: row.transcript || [],
          audio_metrics: row.audio_metrics || {},
          mode: row.mode || 'cold_call',
        });
      }
      const breakdown = row.score_breakdown || {};
      return res.json({
        status: 'complete',
        score: row.score,
        mode: row.mode || breakdown.mode || 'cold_call',
        score_breakdown: breakdown,
        headline: breakdown.headline || null,
        call_verdict: breakdown.call_verdict || null,
        call_momentum: breakdown.call_momentum || null,
        next_session_focus: breakdown.next_session_focus || null,
        transcript: row.transcript || [],
        audio_metrics: row.audio_metrics || {},
      });
    }
  } catch (err) {
    console.error('DB status check failed:', err.message);
    // Fall through to memStore
  }

  // Fall back to in-memory store
  const mem = memStore.get(id);
  if (!mem) return res.status(404).json({ error: 'Session not found' });
  if (mem.status === 'complete' && mem.result) return res.json({ status: 'complete', ...mem.result, mode: mem.mode || mem.result?.mode || 'cold_call' });
  if (mem.status === 'error') return res.status(500).json({ error: mem.errorMessage || 'Analysis failed' });
  return res.json({ status: 'processing', mode: mem.mode || 'cold_call' });
});

// ---------------------------------------------------------------------------
// Background: fetch transcript, compute metrics, grade with Claude, store
// ---------------------------------------------------------------------------
async function processSession(sessionId, { elevenlabs_conversation_id, duration_seconds }) {
  const durationSecs = duration_seconds || 0;
  const memSession = memStore.get(sessionId);

  // Resolve persona_id and mode — prefer memStore, fall back to DB so server
  // restarts don't silently downgrade investor_pitch sessions to cold_call grading.
  let personaId = memSession?.persona_id || null;
  let sessionMode = memSession?.mode || null;

  // Check session exists in DB or memStore — proceed as long as one has it
  let useMemOnly = false;
  try {
    const check = await db.query('SELECT id, persona_id, mode FROM sessions WHERE id = $1', [sessionId]);
    if (check.rows.length === 0 && !memSession) {
      console.error('processSession: session not found anywhere, skipping —', sessionId);
      return;
    }
    useMemOnly = check.rows.length === 0;
    if (check.rows.length > 0) {
      if (!personaId) personaId = check.rows[0].persona_id || 'hendrik';
      if (!sessionMode) sessionMode = check.rows[0].mode || 'cold_call';
    }
  } catch (err) {
    console.error('processSession: DB check failed —', err.message);
    if (!memSession) return;
    useMemOnly = true;
  }

  // Final defaults if DB was also unavailable
  if (!personaId) personaId = 'hendrik';
  if (!sessionMode) sessionMode = 'cold_call';

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

  // Surface transcript and deterministic metrics before grading completes so the UI can render early.
  if (!useMemOnly) {
    try {
      await db.query(
        `UPDATE sessions SET transcript = $1, audio_metrics = $2 WHERE id = $3`,
        [JSON.stringify(transcript), JSON.stringify(audioMetrics), sessionId]
      );
    } catch (err) {
      console.error('DB error saving partial analysis:', err.message);
    }
  }

  if (memSession) {
    memStore.set(sessionId, {
      ...memSession,
      status: 'processing',
      transcript,
      audio_metrics: audioMetrics,
      duration_seconds: actualDuration,
    });
  }

  // 3. Fast-grade with Claude — route to pitch grading if investor_pitch mode
  let grading;
  try {
    const personaRaw = loadPersonaFile(personaId);
    const persona = normalisePersona(personaRaw);
    if (sessionMode === 'investor_pitch') {
      grading = await claude.gradePitchFast(transcript, audioMetrics, persona);
    } else {
      grading = await claude.gradeSessionFast(transcript, audioMetrics, persona);
    }
  } catch (err) {
    console.error('Claude fast grading error:', err.message);
    grading = sessionMode === 'investor_pitch'
      ? { overall_score: 0, score_breakdown: { problem_clarity: 0, why_now: 0, right_to_win: 0, ask_clarity: 0 }, headline: 'Analysis failed — check server logs', call_verdict: null, call_momentum: null, next_session_focus: null }
      : { overall_score: 0, score_breakdown: { opening: 0, objections: 0, talk_ratio: 0, clear_ask: 0 }, headline: 'Analysis failed — check server logs', call_verdict: null, call_momentum: null, next_session_focus: null };
  }

  // 4. Persist results
  await storeResults(sessionId, useMemOnly, grading, transcript, audioMetrics, sessionMode);
}

async function storeResults(sessionId, useMemOnly, grading, transcript, audioMetrics, sessionMode) {
  const scoreBreakdown = {
    ...grading.score_breakdown,
    headline: grading.headline || null,
    call_verdict: grading.call_verdict || null,
    call_momentum: grading.call_momentum || null,
    next_session_focus: grading.next_session_focus || null,
    mode: sessionMode || 'cold_call',  // persist mode in JSON so status API can read it even if column is NULL
  };

  let savedToDb = false;
  if (!useMemOnly) {
    try {
      await db.query(
        `UPDATE sessions SET score = $1, score_breakdown = $2,
         transcript = $3, audio_metrics = $4 WHERE id = $5`,
        [
          grading.overall_score,
          JSON.stringify(scoreBreakdown),
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
      score_breakdown: grading.score_breakdown,
      headline: grading.headline || null,
      call_verdict: grading.call_verdict || null,
      call_momentum: grading.call_momentum || null,
      next_session_focus: grading.next_session_focus || null,
      transcript,
      audio_metrics: audioMetrics,
      mode: sessionMode || existing.mode || 'cold_call',
    },
  });

  console.log(`Session ${sessionId} (${sessionMode}) — score: ${grading.overall_score}, verdict: ${grading.call_verdict || 'n/a'} (${savedToDb ? 'DB+mem' : 'mem only'})`);
}

// ---------------------------------------------------------------------------
// POST /api/session/:id/deep-analysis  — trigger on-demand deep annotation
// ---------------------------------------------------------------------------
router.post('/:id/deep-analysis', async (req, res) => {
  const { id } = req.params;
  const mem = memStore.get(id);

  // Must have basic analysis done first
  if (!mem || mem.status !== 'complete') {
    return res.status(400).json({ error: 'Basic analysis not yet complete' });
  }
  if (mem.deep_status === 'complete') {
    return res.json({ status: 'complete', ...mem.deep_result });
  }
  if (mem.deep_status === 'processing') {
    return res.json({ status: 'processing' });
  }

  // Mark as processing
  memStore.set(id, { ...mem, deep_status: 'processing' });
  res.json({ status: 'processing', message: 'Deep analysis started' });

  // Run in background
  processDeepSession(id).catch((err) =>
    console.error('Deep analysis error for session', id, err.message)
  );
});

// ---------------------------------------------------------------------------
// GET /api/session/:id/deep-status
// ---------------------------------------------------------------------------
router.get('/:id/deep-status', async (req, res) => {
  const { id } = req.params;

  // Try DB first
  try {
    const result = await db.query(
      `SELECT deep_analysis, deep_analysis_status FROM sessions WHERE id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      if (row.deep_analysis_status === 'complete' && row.deep_analysis) {
        return res.json({ status: 'complete', ...row.deep_analysis });
      }
      if (row.deep_analysis_status === 'processing') {
        return res.json({ status: 'processing' });
      }
    }
  } catch {
    // Fall through to memStore
  }

  const mem = memStore.get(id);
  if (!mem) return res.status(404).json({ error: 'Session not found' });
  if (mem.deep_status === 'complete' && mem.deep_result) return res.json({ status: 'complete', ...mem.deep_result });
  if (mem.deep_status === 'processing') return res.json({ status: 'processing' });
  return res.json({ status: 'pending' });
});

// ---------------------------------------------------------------------------
// Background: deep analysis — annotates transcript, detailed coaching
// ---------------------------------------------------------------------------
async function processDeepSession(sessionId) {
  const mem = memStore.get(sessionId);
  if (!mem) throw new Error('Session not in memStore');

  const personaId = mem.persona_id || 'hendrik';
  const sessionMode = mem.mode || mem.result?.mode || 'cold_call';
  const personaRaw = loadPersonaFile(personaId);
  const persona = normalisePersona(personaRaw);
  const transcript = mem.result?.transcript || [];
  const audioMetrics = mem.result?.audio_metrics || {};
  const basicResult = mem.result || {};

  let deepResult;
  try {
    if (sessionMode === 'investor_pitch') {
      deepResult = await claude.gradePitchDeep(transcript, audioMetrics, persona, basicResult);
    } else {
      deepResult = await claude.gradeSessionDeep(transcript, audioMetrics, persona, basicResult);
    }
  } catch (err) {
    console.error('Deep grading error:', err.message);
    memStore.set(sessionId, { ...memStore.get(sessionId), deep_status: 'error', deep_error: err.message });
    // Also update DB
    try {
      await db.query(
        `UPDATE sessions SET deep_analysis_status = 'error' WHERE id = $1`, [sessionId]
      );
    } catch { /* ignore DB errors */ }
    return;
  }

  // Store in memStore
  memStore.set(sessionId, {
    ...memStore.get(sessionId),
    deep_status: 'complete',
    deep_result: deepResult,
  });

  // Persist to DB
  try {
    await db.query(
      `UPDATE sessions SET deep_analysis = $1, deep_analysis_status = 'complete' WHERE id = $2`,
      [JSON.stringify(deepResult), sessionId]
    );
  } catch (err) {
    console.error('DB error saving deep analysis:', err.message);
  }

  console.log(`Deep analysis complete for session ${sessionId} — ${(deepResult.annotated_transcript || []).length} turns annotated`);
}

module.exports = router;
