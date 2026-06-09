/**
 * Google Calendar OAuth 2.0 service.
 *
 * Env vars required:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GCAL_REDIRECT_URI  — e.g. https://your-backend.com/auth/gcal/callback
 *
 * Scope: https://www.googleapis.com/auth/calendar.readonly
 *
 * Tokens are stored encrypted in the oauth_tokens table.
 */

const { encrypt, decrypt, signState } = require('../utils/crypto');
const { getPool } = require('../db/client');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

function getRedirectUri() {
  return process.env.GCAL_REDIRECT_URI || `${process.env.BACKEND_URL || ''}/auth/gcal/callback`;
}

/**
 * Build the OAuth authorisation URL for a given user.
 * state = base64(userId)
 */
function getAuthUrl(userId, returnTo = '/onboarding') {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');

  const state = signState({ userId, returnTo });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: GCAL_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

/**
 * Exchange an authorisation code for tokens and persist them.
 */
async function exchangeCode(code, userId) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth credentials not configured');

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Google token exchange failed: ${resp.status} ${body}`);
  }

  const data = await resp.json();
  await saveTokens(userId, data);
  return data;
}

/**
 * Refresh an expired access token.
 */
async function refreshToken(userId) {
  const pool = getPool();
  if (!pool) throw new Error('Database not available');

  const { rows } = await pool.query(
    'SELECT refresh_token FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
    [userId, 'gcal']
  );
  if (!rows.length || !rows[0].refresh_token) {
    throw new Error('No Google Calendar refresh token stored for user');
  }

  const storedRefresh = decrypt(rows[0].refresh_token);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: storedRefresh,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Google token refresh failed: ${resp.status} ${body}`);
  }

  const data = await resp.json();
  // Google doesn't re-issue refresh_token on refresh — preserve existing
  await saveTokens(userId, data, { preserveRefresh: true });
  return data;
}

async function saveTokens(userId, tokenData, options = {}) {
  const pool = getPool();
  if (!pool) return;

  const encAccessToken = encrypt(tokenData.access_token);
  const encRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  if (options.preserveRefresh) {
    await pool.query(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, expires_at, scope)
       VALUES ($1, 'gcal', $2, $3, $4)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         expires_at = EXCLUDED.expires_at,
         scope = EXCLUDED.scope,
         updated_at = NOW()`,
      [userId, encAccessToken, expiresAt, GCAL_SCOPE]
    );
  } else {
    await pool.query(
      `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at, scope)
       VALUES ($1, 'gcal', $2, $3, $4, $5)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
         expires_at = EXCLUDED.expires_at,
         scope = EXCLUDED.scope,
         updated_at = NOW()`,
      [userId, encAccessToken, encRefreshToken, expiresAt, GCAL_SCOPE]
    );
  }
}

async function getValidAccessToken(userId) {
  const pool = getPool();
  if (!pool) throw new Error('Database not available');

  const { rows } = await pool.query(
    'SELECT access_token, expires_at FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
    [userId, 'gcal']
  );

  if (!rows.length) throw new Error('No Google Calendar token — connect Google Calendar first');

  const { access_token, expires_at } = rows[0];

  if (expires_at && new Date(expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
    await refreshToken(userId);
    const { rows: fresh } = await pool.query(
      'SELECT access_token FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
      [userId, 'gcal']
    );
    return decrypt(fresh[0].access_token);
  }

  return decrypt(access_token);
}

/**
 * List upcoming calendar events for the next N days.
 * Returns raw Google Calendar API response.
 */
async function listUpcomingEvents(userId, days = 7) {
  const token = await getValidAccessToken(userId);
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const resp = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (resp.status === 401) {
    await refreshToken(userId);
    return listUpcomingEvents(userId, days);
  }

  if (!resp.ok) throw new Error(`Google Calendar API error: ${resp.status}`);
  return resp.json();
}

/**
 * Check whether a user has a connected Google Calendar account.
 */
async function isConnected(userId) {
  const pool = getPool();
  if (!pool) return false;
  const { rows } = await pool.query(
    'SELECT 1 FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
    [userId, 'gcal']
  );
  return rows.length > 0;
}

/**
 * List upcoming calendar events using a raw access token (no DB lookup).
 * Used by the multi-tenant calendar poller.
 *
 * @param {string} accessToken — Google OAuth access token
 * @param {object} [opts]
 * @param {number} [opts.days]         — look-ahead window (default 7)
 * @param {number} [opts.maxResults]   — default 50
 * @returns {Promise<Array>}           — raw Google Calendar event items
 */
async function listUpcomingEventsWithToken(accessToken, opts = {}) {
  const days = opts.days || 7;
  const maxResults = opts.maxResults || 50;
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(maxResults),
  });

  const resp = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Google Calendar API error: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  return data.items || [];
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshToken,
  listUpcomingEvents,
  listUpcomingEventsWithToken,
  isConnected,
};
