'use strict';

const { ElevenLabsClient } = require('elevenlabs');

function getClient() {
  if (!process.env.ELEVENLABS_KEY) {
    throw new Error('ELEVENLABS_KEY not configured');
  }
  return new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_KEY });
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
  const response = await client.conversationalAi.conversations.getSignedUrl({
    agent_id: agentId,
  });

  return response.signed_url;
}

/**
 * Fetch the transcript and metadata for a completed conversation.
 * @param {string} conversationId
 * @returns {Promise<{transcript: Array, durationSeconds: number}>}
 */
async function getConversationTranscript(conversationId) {
  const client = getClient();
  const conversation = await client.conversationalAi.conversations.getConversationById(
    conversationId
  );

  const transcript = (conversation.transcript || []).map((t) => ({
    speaker: t.role === 'agent' ? 'hendrik' : 'rep',
    text: t.message || '',
    start_ms: Math.round((t.time_in_call_secs || 0) * 1000),
    end_ms: 0,
  }));

  const durationSeconds =
    conversation.metadata?.call_duration_secs || 0;

  return { transcript, durationSeconds };
}

module.exports = { getConversationToken, getConversationTranscript };
