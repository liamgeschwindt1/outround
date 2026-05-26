/**
 * Pipedrive OAuth 2.0 service.
 *
 * Env vars required:
 *   PIPEDRIVE_CLIENT_ID
 *   PIPEDRIVE_CLIENT_SECRET
 *   PIPEDRIVE_REDIRECT_URI  — e.g. https://your-backend.com/auth/pipedrive/callback
 *
 * Scopes used: deals:read contacts:read notes:read activities:read
 *
 * Tokens are stored encrypted in the oauth_tokens table.
 */

const { encrypt, decrypt } = require('../utils/crypto');
const { getPool } = require('../db/client');

const PIPEDRIVE_AUTH_URL = 'https://oauth.pipedrive.com/oauth/authorize';
const PIPEDRIVE_TOKEN_URL = 'https://oauth.pipedrive.com/oauth/token';
const SCOPES = 'deals:read contacts:read notes:read activities:read';

function getRedirectUri() {
  return process.env.PIPEDRIVE_REDIRECT_URI || `${process.env.BACKEND_URL || ''}/auth/pipedrive/callback`;
}

/**
 * Build the OAuth authorisation URL for a given user.
 * state = base64(userId) so we can retrieve the user in the callback.
 */
function getAuthUrl(userId) {
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  if (!clientId) throw new Error('PIPEDRIVE_CLIENT_ID is not set');

  const state = Buffer.from(userId).toString('base64url');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    state,
  });
  return `${PIPEDRIVE_AUTH_URL}?${params}`;
}

/**
 * Exchange an authorisation code for access + refresh tokens and persist them.
 */
async function exchangeCode(code, userId) {
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Pipedrive OAuth credentials not configured');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const resp = await fetch(PIPEDRIVE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Pipedrive token exchange failed: ${resp.status} ${body}`);
  }

  const data = await resp.json();
  await saveTokens(userId, data);
  return data;
}

/**
 * Refresh an expired access token using the stored refresh token.
 */
async function refreshToken(userId) {
  const pool = getPool();
  if (!pool) throw new Error('Database not available');

  const { rows } = await pool.query(
    'SELECT refresh_token FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
    [userId, 'pipedrive']
  );
  if (!rows.length || !rows[0].refresh_token) {
    throw new Error('No Pipedrive refresh token stored for user');
  }

  const storedRefresh = decrypt(rows[0].refresh_token);
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const resp = await fetch(PIPEDRIVE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: storedRefresh,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Pipedrive token refresh failed: ${resp.status} ${body}`);
  }

  const data = await resp.json();
  await saveTokens(userId, data);
  return data;
}

async function saveTokens(userId, tokenData) {
  const pool = getPool();
  if (!pool) return;

  const encAccessToken = encrypt(tokenData.access_token);
  const encRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  await pool.query(
    `INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at, scope)
     VALUES ($1, 'pipedrive', $2, $3, $4, $5)
     ON CONFLICT (user_id, provider) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
       expires_at = EXCLUDED.expires_at,
       scope = EXCLUDED.scope,
       updated_at = NOW()`,
    [userId, encAccessToken, encRefreshToken, expiresAt, tokenData.scope || SCOPES]
  );
}

/**
 * Make an authenticated GET request to the Pipedrive API.
 * Automatically refreshes the token if it has expired.
 */
async function get(userId, path) {
  const token = await getValidAccessToken(userId);
  const baseUrl = process.env.PIPEDRIVE_API_URL || 'https://api.pipedrive.com/v1';

  const resp = await fetch(`${baseUrl}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (resp.status === 401) {
    // Try refresh once
    await refreshToken(userId);
    const newToken = await getValidAccessToken(userId);
    const retry = await fetch(`${baseUrl}${path}`, {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });
    if (!retry.ok) throw new Error(`Pipedrive API error: ${retry.status}`);
    return retry.json();
  }

  if (!resp.ok) throw new Error(`Pipedrive API error: ${resp.status}`);
  return resp.json();
}

async function getValidAccessToken(userId) {
  const pool = getPool();
  if (!pool) throw new Error('Database not available');

  const { rows } = await pool.query(
    'SELECT access_token, expires_at FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
    [userId, 'pipedrive']
  );

  if (!rows.length) throw new Error('No Pipedrive token for user — connect Pipedrive first');

  const { access_token, expires_at } = rows[0];

  // Refresh proactively if token expires within 5 minutes
  if (expires_at && new Date(expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
    await refreshToken(userId);
    const { rows: fresh } = await pool.query(
      'SELECT access_token FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
      [userId, 'pipedrive']
    );
    return decrypt(fresh[0].access_token);
  }

  return decrypt(access_token);
}

/**
 * Check whether a user has a connected Pipedrive account.
 */
async function isConnected(userId) {
  const pool = getPool();
  if (!pool) return false;
  const { rows } = await pool.query(
    'SELECT 1 FROM oauth_tokens WHERE user_id = $1 AND provider = $2',
    [userId, 'pipedrive']
  );
  return rows.length > 0;
}

/**
 * Higher-level fetch helpers used by the meeting prep page.
 * Each returns a normalised, view-friendly object — never the raw Pipedrive payload.
 * All swallow per-request errors and return null/[] so a single failure can't break the page.
 */

async function getPerson(userId, personId) {
  if (!personId) return null;
  try {
    const data = await get(userId, `/persons/${personId}`);
    const p = data?.data;
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      first_name: p.first_name,
      last_name: p.last_name,
      title: p.job_title || null,
      org: p.org_name || p.organization?.name || null,
      org_id: p.org_id?.value || p.org_id || null,
      email: Array.isArray(p.email) ? (p.email[0]?.value || null) : (p.email || null),
      phone: Array.isArray(p.phone) ? (p.phone[0]?.value || null) : (p.phone || null),
      linkedin: p.linkedin || null,
      open_deals_count: p.open_deals_count ?? null,
      closed_deals_count: p.closed_deals_count ?? null,
      last_activity_date: p.last_activity_date || null,
      next_activity_date: p.next_activity_date || null,
      photo_url: p.picture_id?.pictures?.['512'] || null,
    };
  } catch (err) {
    console.error('[pipedrive] getPerson failed:', err.message);
    return null;
  }
}

async function getDeal(userId, dealId) {
  if (!dealId) return null;
  try {
    const data = await get(userId, `/deals/${dealId}`);
    const d = data?.data;
    if (!d) return null;
    const stageChangedAt = d.stage_change_time || d.add_time;
    const daysInStage = stageChangedAt
      ? Math.max(0, Math.round((Date.now() - new Date(stageChangedAt).getTime()) / 86400000))
      : null;
    return {
      id: d.id,
      title: d.title,
      stage_id: d.stage_id,
      stage_name: d.stage_id ? `Stage ${d.stage_id}` : null,
      value: d.value || 0,
      currency: d.currency || null,
      status: d.status,
      probability: d.probability ?? null,
      days_in_stage: daysInStage,
      expected_close_date: d.expected_close_date || null,
      next_activity_subject: d.next_activity_subject || null,
      next_activity_date: d.next_activity_date || null,
      owner_name: d.owner_name || null,
    };
  } catch (err) {
    console.error('[pipedrive] getDeal failed:', err.message);
    return null;
  }
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function getPersonNotes(userId, personId, limit = 25) {
  if (!personId) return [];
  try {
    const data = await get(userId, `/notes?person_id=${personId}&limit=${limit}&sort=add_time%20DESC`);
    return (data?.data || []).map(n => ({
      id: n.id,
      content: stripHtml(n.content),
      add_time: n.add_time,
      user_name: n.user?.name || null,
      deal_id: n.deal_id || null,
    }));
  } catch (err) {
    console.error('[pipedrive] getPersonNotes failed:', err.message);
    return [];
  }
}

async function getDealNotes(userId, dealId, limit = 25) {
  if (!dealId) return [];
  try {
    const data = await get(userId, `/notes?deal_id=${dealId}&limit=${limit}&sort=add_time%20DESC`);
    return (data?.data || []).map(n => ({
      id: n.id,
      content: stripHtml(n.content),
      add_time: n.add_time,
      user_name: n.user?.name || null,
      deal_id: n.deal_id || null,
    }));
  } catch (err) {
    console.error('[pipedrive] getDealNotes failed:', err.message);
    return [];
  }
}

async function getPersonActivities(userId, personId, limit = 25) {
  if (!personId) return [];
  try {
    const data = await get(userId, `/persons/${personId}/activities?limit=${limit}`);
    return (data?.data || []).map(a => ({
      id: a.id,
      type: a.type,
      subject: a.subject,
      done: !!a.done,
      due_date: a.due_date,
      due_time: a.due_time,
      duration: a.duration,
      note: stripHtml(a.note),
      add_time: a.add_time,
      marked_as_done_time: a.marked_as_done_time,
      deal_id: a.deal_id,
    }));
  } catch (err) {
    console.error('[pipedrive] getPersonActivities failed:', err.message);
    return [];
  }
}

module.exports = {
  getAuthUrl,
  exchangeCode,
  refreshToken,
  get,
  isConnected,
  getPerson,
  getDeal,
  getPersonNotes,
  getDealNotes,
  getPersonActivities,
};
