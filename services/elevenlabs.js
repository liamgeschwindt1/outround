'use strict';

const fs = require('fs');
const path = require('path');
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
 * Load a persona JSON file by ID, searching all subdirectories of modes/.
 * @param {string} personaId
 * @returns {object}
 */
function loadPersona(personaId) {
  const modesDir = path.join(__dirname, '..', 'modes');
  for (const sub of fs.readdirSync(modesDir)) {
    const fp = path.join(modesDir, sub, `${personaId}.json`);
    if (fs.existsSync(fp)) return require(fp);
  }
  throw new Error(`Persona "${personaId}" not found in modes/ directory`);
}

/**
 * Get a signed WebSocket URL for a conversational AI session.
 * Passes conversation_config from the persona JSON as overrides so that
 * ElevenLabs uses our payload rather than the dashboard configuration.
 * @param {string} personaId
 * @returns {Promise<string>} signed_url
 */
async function getConversationToken(personaId) {
  const persona = loadPersona(personaId);

  const agentId =
    (persona._meta && persona._meta.agent_id) ||
    process.env.ELEVENLABS_AGENT_ID;

  if (!agentId) {
    throw new Error(`No agent_id found for persona "${personaId}" — set ELEVENLABS_AGENT_ID in env`);
  }

  const client = getClient();
  const payload = { agent_id: agentId };

  if (persona.conversation_config) {
    payload.conversation_config_override = persona.conversation_config;
  }

  const response = await client.conversationalAi.getSignedUrl(payload);

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
