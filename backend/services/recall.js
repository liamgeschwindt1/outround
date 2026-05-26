/**
 * Recall.ai meeting bot service.
 *
 * Env:
 *   RECALL_API_KEY       — Recall.ai API key
 *   RECALL_SECRET        — webhook signing secret (HMAC SHA-256)
 *   RECALL_REGION        — 'eu-central-1' (default) | 'us-west-2'
 *   RECALL_WEBHOOK_URL   — public webhook target, e.g. https://backend/api/bots/webhook
 *
 * Docs: https://docs.recall.ai
 *
 * All functions no-op (return null) when RECALL_API_KEY is missing so the
 * rest of the app keeps working without a Recall account configured.
 */

const crypto = require('crypto');

function baseUrl() {
  const region = process.env.RECALL_REGION || 'eu-central-1';
  return `https://${region}.recall.ai/api/v1`;
}

function isConfigured() {
  return !!process.env.RECALL_API_KEY;
}

async function rcall(method, path, body) {
  if (!isConfigured()) return null;
  const resp = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      'Authorization': `Token ${process.env.RECALL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Recall ${method} ${path} → ${resp.status}: ${txt}`);
  }
  return resp.status === 204 ? null : resp.json();
}

/**
 * Create (schedule) a bot to join a meeting.
 */
async function createBot({ meetingUrl, joinAt, botName = 'Outround Notetaker' }) {
  const payload = {
    meeting_url: meetingUrl,
    bot_name: botName,
    transcription_options: { provider: 'gladia' },
    recording_mode: 'speaker_view',
  };
  if (process.env.RECALL_WEBHOOK_URL) payload.webhook_url = process.env.RECALL_WEBHOOK_URL;
  if (joinAt) payload.join_at = joinAt;
  return rcall('POST', '/bot/', payload);
}

async function getBot(botId) {
  return rcall('GET', `/bot/${botId}/`);
}

async function deleteBot(botId) {
  return rcall('DELETE', `/bot/${botId}/`);
}

async function getTranscript(botId) {
  return rcall('GET', `/bot/${botId}/transcript/`);
}

/**
 * Verify a Recall webhook signature (HMAC-SHA256 of the raw body).
 */
function verifyWebhook(rawBody, signatureHeader) {
  const secret = process.env.RECALL_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch {
    return false;
  }
}

module.exports = { isConfigured, createBot, getBot, deleteBot, getTranscript, verifyWebhook };
