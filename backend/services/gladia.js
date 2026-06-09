'use strict';

/**
 * Gladia transcription service.
 *
 * Env vars required:
 *   GLADIA_API_KEY — Gladia API key
 *
 * Docs: https://docs.gladia.io
 *
 * All functions no-op gracefully when GLADIA_API_KEY is missing.
 */

const GLADIA_BASE = 'https://api.gladia.io';

function isConfigured(apiKey) {
  return !!(apiKey || process.env.GLADIA_API_KEY);
}

function headers(apiKey) {
  const key = apiKey || process.env.GLADIA_API_KEY;
  if (!key) throw new Error('GLADIA_API_KEY not provided and not set in env');
  return {
    'x-gladia-key': key,
    'Content-Type': 'application/json',
  };
}

/**
 * Submit an audio file (by public URL) for transcription with speaker diarization.
 * Returns a Gladia transcription ID.
 *
 * @param {string} audioUrl — publicly accessible URL to the audio file
 * @param {object} [opts]
 * @param {string} [opts.apiKey]       — Gladia API key (falls back to GLADIA_API_KEY env)
 * @param {string} [opts.language]     — e.g. 'en' (auto-detected if omitted)
 * @param {boolean} [opts.diarization] — default true
 * @returns {Promise<string>} transcription id
 */
async function submitTranscription(audioUrl, opts = {}) {
  const apiKey = opts.apiKey || process.env.GLADIA_API_KEY;
  if (!apiKey) throw new Error('GLADIA_API_KEY not provided');

  const body = {
    audio_url: audioUrl,
    diarization: opts.diarization !== false,
    diarization_config: { number_of_speakers: opts.numSpeakers || null },
    language_config: opts.language
      ? { language: opts.language }
      : { languages: [], code_switching: false },
  };

  const resp = await fetch(`${GLADIA_BASE}/v2/transcription`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gladia submit error: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  return data.id;
}

/**
 * Poll until the transcription is complete.
 * Returns the full Gladia result object.
 *
 * @param {string} transcriptionId
 * @param {object} [opts]
 * @param {number} [opts.pollIntervalMs]  — default 3000
 * @param {number} [opts.timeoutMs]       — default 10 minutes
 */
async function pollUntilDone(transcriptionId, opts = {}) {
  const apiKey = opts.apiKey || process.env.GLADIA_API_KEY;
  if (!apiKey) throw new Error('GLADIA_API_KEY not provided');

  const interval = opts.pollIntervalMs || 3000;
  const timeout = opts.timeoutMs || 10 * 60 * 1000;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const resp = await fetch(
      `${GLADIA_BASE}/v2/transcription/${transcriptionId}`,
      { headers: { 'x-gladia-key': apiKey } }
    );

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Gladia poll error: ${resp.status} ${txt}`);
    }

    const data = await resp.json();

    if (data.status === 'done') return data;
    if (data.status === 'error') throw new Error(`Gladia transcription failed: ${data.error_code}`);

    await sleep(interval);
  }

  throw new Error(`Gladia transcription timed out after ${timeout / 1000}s`);
}

/**
 * Transcribe an audio file by URL. Submits and polls until complete.
 *
 * @param {string} audioUrl
 * @param {object} [opts]
 * @returns {Promise<NormalisedTranscript>}
 */
async function transcribe(audioUrl, opts = {}) {
  const id = await submitTranscription(audioUrl, opts);
  const result = await pollUntilDone(id, opts);
  return normalise(result);
}

/**
 * Normalise Gladia's result into a flat array of utterances compatible
 * with the rest of the pipeline.
 *
 * @returns {{ utterances: Array<{speaker: string, text: string, start: number, end: number}>, raw: object }}
 */
function normalise(gladiaResult) {
  const utterances = (gladiaResult?.result?.transcription?.utterances || []).map(u => ({
    speaker: u.speaker != null ? `Speaker ${u.speaker}` : 'unknown',
    text: u.transcript || '',
    start: u.start ?? 0,
    end: u.end ?? 0,
  }));

  return {
    utterances,
    fullText: utterances.map(u => `[${u.speaker}] ${u.text}`).join('\n'),
    raw: gladiaResult,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { isConfigured, submitTranscription, pollUntilDone, transcribe };
