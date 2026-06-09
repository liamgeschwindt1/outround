'use strict';

/**
 * Token manager — multi-tenant credential layer backed by Supabase.
 *
 * Tables (in Supabase):
 *   organisations  (id, name, company_domain, created_at)
 *   integrations   (id, org_id, provider, access_token, refresh_token, expires_at, metadata)
 *
 * Env vars required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *
 * Optional per-provider OAuth app credentials (for refresh flows):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 */

const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}

function isConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

// ── Integration CRUD ────────────────────────────────────────────────────────

/**
 * Fetch an integration for an org by provider.
 * Automatically refreshes Google access tokens when they are within 5 minutes of expiry.
 *
 * @returns {{ accessToken, refreshToken, expiresAt, metadata } | null}
 */
async function getIntegration(orgId, provider) {
  const sb = getClient();
  const { data, error } = await sb
    .from('integrations')
    .select('*')
    .eq('org_id', orgId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) throw new Error(`getIntegration failed: ${error.message}`);
  if (!data) return null;

  // Auto-refresh Google token if expiring within 5 minutes
  if (provider === 'google' && data.expires_at) {
    const expiresAt = new Date(data.expires_at).getTime();
    if (expiresAt < Date.now() + 5 * 60 * 1000) {
      return _refreshGoogleToken(orgId, data);
    }
  }

  return _normalise(data);
}

/**
 * Save (upsert) an integration for an org.
 *
 * @param {string} orgId
 * @param {string} provider — 'google' | 'pipedrive' | 'slack' | 'recall'
 * @param {{ accessToken, refreshToken?, expiresAt? }} tokens
 * @param {object} [metadata] — provider-specific extras (slack_user_id, domain, etc.)
 */
async function saveIntegration(orgId, provider, tokens, metadata = {}) {
  const sb = getClient();

  const row = {
    org_id: orgId,
    provider,
    access_token: tokens.accessToken,
    updated_at: new Date().toISOString(),
  };
  if (tokens.refreshToken) row.refresh_token = tokens.refreshToken;
  if (tokens.expiresAt)    row.expires_at    = tokens.expiresAt;
  if (Object.keys(metadata).length) row.metadata = metadata;

  const { error } = await sb
    .from('integrations')
    .upsert(row, { onConflict: 'org_id,provider' });

  if (error) throw new Error(`saveIntegration failed: ${error.message}`);
}

// ── Google token refresh ────────────────────────────────────────────────────

async function _refreshGoogleToken(orgId, row) {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET required for token refresh');
  }
  if (!row.refresh_token) {
    throw new Error(`No refresh_token stored for org ${orgId} / google`);
  }

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: row.refresh_token,
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Google token refresh failed: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

  // Google does not re-issue the refresh token — preserve the existing one
  await saveIntegration(
    orgId, 'google',
    { accessToken: data.access_token, refreshToken: row.refresh_token, expiresAt },
    row.metadata || {}
  );

  return {
    accessToken:  data.access_token,
    refreshToken: row.refresh_token,
    expiresAt,
    metadata:     row.metadata || {},
  };
}

function _normalise(row) {
  return {
    accessToken:  row.access_token,
    refreshToken: row.refresh_token || null,
    expiresAt:    row.expires_at    || null,
    metadata:     row.metadata      || {},
  };
}

// ── Organisation helpers ────────────────────────────────────────────────────

/**
 * List all organisations.
 */
async function listOrgs() {
  const sb = getClient();
  const { data, error } = await sb.from('organisations').select('*');
  if (error) throw new Error(`listOrgs failed: ${error.message}`);
  return data || [];
}

/**
 * Ensure an org exists for a given user.
 * If the user row has no org_id, creates one and links it.
 * Returns the org_id (string).
 */
async function ensureOrgForUser(userId, userEmail) {
  const sb = getClient();

  // Check if user already belongs to an org
  const { data: user } = await sb
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle();

  if (user?.org_id) return user.org_id;

  // Derive a sensible org name / domain from the email
  const domain = userEmail ? userEmail.split('@')[1] : null;

  const { data: org, error: orgErr } = await sb
    .from('organisations')
    .insert({ name: domain || 'My Organisation', company_domain: domain })
    .select('id')
    .single();

  if (orgErr) throw new Error(`Failed to create org: ${orgErr.message}`);

  // Link user → org
  await sb.from('users').update({ org_id: org.id }).eq('id', userId);

  return org.id;
}

// ── Convenience bundle ──────────────────────────────────────────────────────

/**
 * Return all credentials needed to run the post-call pipeline for an org.
 * Shared service keys (Gladia, Anthropic, Recall) still come from env vars
 * per spec — only per-org tokens are fetched from Supabase.
 *
 * @returns {Promise<{
 *   googleAccessToken,
 *   pipedriveApiKey, pipedriveDomain,
 *   slackBotToken, slackUserId,
 *   gladiaApiKey, anthropicApiKey, recallApiKey
 * }>}
 */
async function getOrgCredentials(orgId) {
  const [google, pipedrive, slack] = await Promise.all([
    getIntegration(orgId, 'google').catch(() => null),
    getIntegration(orgId, 'pipedrive').catch(() => null),
    getIntegration(orgId, 'slack').catch(() => null),
  ]);

  return {
    googleAccessToken:  google?.accessToken                      || null,
    pipedriveApiKey:    pipedrive?.accessToken                   || null,
    pipedriveDomain:    pipedrive?.metadata?.domain              || null,
    slackBotToken:      slack?.accessToken                       || null,
    slackUserId:        slack?.metadata?.slack_user_id           || null,
    // Shared service credentials — remain in Railway env vars
    gladiaApiKey:       process.env.GLADIA_API_KEY               || null,
    anthropicApiKey:    process.env.ANTHROPIC_API_KEY            || null,
    recallApiKey:       process.env.RECALL_API_KEY               || null,
  };
}

module.exports = {
  isConfigured,
  getClient,
  getIntegration,
  saveIntegration,
  listOrgs,
  ensureOrgForUser,
  getOrgCredentials,
};
