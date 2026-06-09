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

function isConfigured(apiKey) {
  return !!(apiKey || process.env.RECALL_API_KEY);
}

async function rcall(method, path, body, apiKey) {
  const key = apiKey || process.env.RECALL_API_KEY;
  if (!key) return null;
  const resp = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      'Authorization': `Token ${key}`,
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
 *
 * @param {object} opts
 * @param {string} [apiKey] — Recall API key; falls back to RECALL_API_KEY env var
 */
async function createBot({ meetingUrl, joinAt, botName = 'Outround Notetaker' }, apiKey) {
  const payload = {
    meeting_url: meetingUrl,
    bot_name: botName,
  };
  if (process.env.RECALL_WEBHOOK_URL) payload.webhook_url = process.env.RECALL_WEBHOOK_URL;
  if (joinAt) payload.join_at = joinAt;
  return rcall('POST', '/bot/', payload, apiKey);
}

async function getBot(botId, apiKey) {
  return rcall('GET', `/bot/${botId}/`, undefined, apiKey);
}

async function deleteBot(botId, apiKey) {
  return rcall('DELETE', `/bot/${botId}/`, undefined, apiKey);
}

async function getTranscript(botId, apiKey) {
  return rcall('GET', `/bot/${botId}/transcript/`, undefined, apiKey);
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
