/**
 * AES-256-GCM encryption helpers for storing OAuth tokens at rest.
 * Requires ENCRYPTION_KEY env var — 32-byte hex string (64 hex chars).
 *
 * Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns a base64 string: iv(12):authTag(16):ciphertext
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypt a base64 string produced by encrypt().
 */
function decrypt(ciphertext) {
  const key = getKey();
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = buf.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Sign an OAuth state payload with HMAC-SHA256 to prevent tampering.
 * Returns a base64url string: payload.base64url:hmac.base64url
 *
 * @param {object} payload — key/value pairs to protect
 * @returns {string}
 */
function signState(payload) {
  const key = getStateSecret();
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString('base64url');
  const hmac = crypto.createHmac('sha256', key).update(encoded).digest('base64url');
  return `${encoded}:${hmac}`;
}

/**
 * Verify and decode an HMAC-signed OAuth state.
 * Returns the parsed payload, or null if the signature is invalid.
 *
 * @param {string} state — the state string from the OAuth callback
 * @returns {object|null}
 */
function verifyState(state) {
  if (!state || !state.includes(':')) {
    // Legacy fallback: state was just a base64url-encoded userId
    try {
      const userId = Buffer.from(state, 'base64url').toString('utf8');
      if (userId && userId.length > 0 && !userId.includes('{')) {
        return { userId, legacy: true };
      }
    } catch {
      /* not valid legacy format either */
    }
    return null;
  }

  const parts = state.split(':');
  if (parts.length < 2) return null;
  // The last part is the HMAC; everything before it is the payload
  const hmac = parts.pop();
  const encoded = parts.join(':');

  const key = getStateSecret();
  const expectedHmac = crypto.createHmac('sha256', key).update(encoded).digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Get the signing secret for OAuth state parameters.
 * Uses STATE_SECRET env var, or falls back to ENCRYPTION_KEY (first 32 bytes).
 */
function getStateSecret() {
  if (process.env.STATE_SECRET) {
    return Buffer.from(process.env.STATE_SECRET.slice(0, 64).padEnd(32, '0'));
  }
  // Fall back to encryption key
  const hex = process.env.ENCRYPTION_KEY;
  if (hex && hex.length >= 32) {
    return Buffer.from(hex.slice(0, 64), 'hex');
  }

  // No secret configured
  if (process.env.NODE_ENV === 'production') {
    // Fatal: refusing to run in production without a signing secret
    throw new Error(
      '[crypto] FATAL: STATE_SECRET or ENCRYPTION_KEY must be set in production. ' +
        'OAuth state signing requires a persistent secret to prevent CSRF attacks.'
    );
  }

  // Non-production: generate a random secret at startup so OAuth works,
  // but state will not survive server restarts.
  const randomSecret = crypto.randomBytes(32);
  console.warn(
    '[crypto] ⚠️  No STATE_SECRET or ENCRYPTION_KEY set — using a random OAuth state secret. ' +
      'OAuth flows WILL break on server restart. Set STATE_SECRET in production.'
  );
  return randomSecret;
}

module.exports = { encrypt, decrypt, signState, verifyState };
