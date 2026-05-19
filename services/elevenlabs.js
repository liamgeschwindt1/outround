'use strict';

const { ElevenLabsClient } = require('elevenlabs');

let _client = null;
function getClient() {
  if (_client) return _client;
  if (!process.env.ELEVENLABS_KEY) {
    throw new Error('ELEVENLABS_KEY not configured');
  }
  _client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_KEY });
  return _client;
}

/**
 * Get a signed WebSocket URL for a conversational AI session.
 * @param {string} personaId
 * @returns {Promise<string>} signed_url
 */
async function getConversationToken(personaId) {
  const agentId = process.env[`ELEVENLABS_AGENT_ID_${personaId.toUpperCase()}`];
  if (!agentId) {
    throw new Error(`ELEVENLABS_AGENT_ID_${personaId.toUpperCase()} not configured`);
  }

  const client = getClient();
  const response = await client.conversationalAi.getSignedUrl({
    agent_id: agentId,
  });

  return response.signed_url;
}

/**
 * Fetch the transcript and metadata for a completed conversation.
 * Polls until ElevenLabs marks the conversation as "done" (max ~90 s).
 * @param {string} conversationId
 * @returns {Promise<{transcript: Array, durationSeconds: number}>}
 */
async function getConversationTranscript(conversationId) {
  const client = getClient();

  // ElevenLabs processes conversations asynchronously; poll until done.
  const MAX_ATTEMPTS = 18;  // 18 × 5 s = 90 s ceiling
  const POLL_INTERVAL_MS = 5000;

  let conversation;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    conversation = await client.conversationalAi.getConversation(conversationId);
    if (conversation.status === 'done' || conversation.status === 'failed') break;
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
    }
  }

  const transcript = (conversation.transcript || []).map((t) => ({
    speaker: t.role === 'agent' ? 'hendrik' : 'rep',
    text: t.message || '',
    start_ms: Math.round((t.time_in_call_secs || 0) * 1000),
    end_ms: 0,
  }));

  const durationSeconds = conversation.metadata?.call_duration_secs || 0;

  return { transcript, durationSeconds };
}

module.exports = { getConversationToken, getConversationTranscript };
