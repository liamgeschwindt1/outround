'use strict';

/**
 * Thin HTTP wrapper for the Python AI harness.
 *
 * Replaces backend/services/claude.js — same function signatures,
 * same return shapes. Route code doesn't change.
 */

const HARNESS_URL = process.env.PYTHON_HARNESS_URL || 'http://localhost:3002';
const HARNESS_TIMEOUT = parseInt(process.env.HARNESS_TIMEOUT || '90000', 10);

async function callHarness(endpoint, payload) {
  const url = `${HARNESS_URL}/v1/ai/${endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HARNESS_TIMEOUT);

  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(`Harness unreachable at ${url}: ${err.message}`);
  }
  clearTimeout(timer);

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(`Harness ${endpoint}: ${resp.status} — ${errBody.detail}`);
  }

  return resp.json();
}

// ── Session grading ──────────────────────────────────────────────────────────

async function gradeSessionFast(transcript, audioMetrics, persona) {
  return callHarness('grade/session/fast', {
    transcript,
    audio_metrics: audioMetrics,
    persona,
  });
}

async function gradeSessionDeep(transcript, audioMetrics, persona, basicResult) {
  return callHarness('grade/session/deep', {
    transcript,
    audio_metrics: audioMetrics,
    persona,
    basic_result: basicResult,
  });
}

// ── Pitch grading ────────────────────────────────────────────────────────────

async function gradePitchFast(transcript, audioMetrics, persona) {
  return callHarness('grade/pitch/fast', {
    transcript,
    audio_metrics: audioMetrics,
    persona,
  });
}

async function gradePitchDeep(transcript, audioMetrics, persona, basicResult) {
  return callHarness('grade/pitch/deep', {
    transcript,
    audio_metrics: audioMetrics,
    persona,
    basic_result: basicResult,
  });
}

// ── Meeting prep (Phase 2) ───────────────────────────────────────────────────

async function generateMeetingPrepIntel(opts) {
  const { meeting, person, deal, notes, activities, user, userStats } = opts;
  return callHarness('meeting-prep/generate', {
    meeting: meeting || {},
    person: person || null,
    deal: deal || null,
    notes: notes || [],
    activities: activities || [],
    user: user || {},
    user_stats: userStats || null,
  });
}

// ── Post-call extraction (Phase 2) ───────────────────────────────────────────

async function extractPostcallIntel(transcript, context = {}) {
  return callHarness('postcall/extract', {
    transcript,
    context,
  });
}

module.exports = {
  gradeSessionFast,
  gradeSessionDeep,
  gradePitchFast,
  gradePitchDeep,
  generateMeetingPrepIntel,
  extractPostcallIntel,
};
