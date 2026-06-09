/**
 * Auth routes
 *
 * GET  /auth/google                  — redirect to Supabase Google OAuth
 * GET  /auth/google/callback         — handle Supabase code exchange, set cookie
 * POST /auth/logout                  — clear auth cookie
 *
 * GET  /auth/pipedrive               — redirect to Pipedrive OAuth
 * GET  /auth/pipedrive/callback      — exchange code, store tokens
 *
 * GET  /auth/gcal                    — redirect to Google Calendar OAuth
 * GET  /auth/gcal/callback           — exchange code, store tokens
 *
 * GET  /auth/me                      — return current user profile + integration status
 * PUT  /auth/me                      — update name / role
 *
 * POST /auth/onboarding/complete     — mark onboarding as done
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const pipedrive = require('../services/pipedrive');
const gcal = require('../services/gcal');
const { requireAuth, rateLimit } = require('../middleware/auth');
const { getPool } = require('../db/client');
const tokenManager = require('../services/token-manager');
const { getUserFromToken, getOrCreateLocalUser } = require('../services/auth');
const { verifyState, signState } = require('../utils/crypto');

let pushEvent = () => {};
try {
  pushEvent = require('./debug').pushEvent;
} catch {}

const router = express.Router();

// Quick health check exposed through the /auth proxy so the frontend
// can confirm the backend is up and read the startup timestamp.
const STARTED_AT = new Date().toISOString();
router.get('/health', (_req, res) => res.json({ status: 'ok', started_at: STARTED_AT }));

// ---------------------------------------------------------------------------
// Supabase public client (anon key — safe to use server-side for auth flows)
// ---------------------------------------------------------------------------
function getAnonClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

// ---------------------------------------------------------------------------
// Email / password sign-in and sign-up
// These proxy to the Supabase Auth REST API so the frontend never needs
// the Supabase anon key.
// ---------------------------------------------------------------------------
async function supabaseAuthRequest(path, body) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Auth not configured');

  const resp = await fetch(`${url}/auth/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
    },
    body: JSON.stringify(body),
  });
  return { status: resp.status, data: await resp.json() };
}

// POST /auth/confirm — exchange a Supabase access_token from a hash redirect
// (email confirmation links land here via the frontend, which extracts the token
// from window.location.hash and POSTs it here to set the HTTP-only cookie)
router.post('/confirm', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token || typeof access_token !== 'string') {
    pushEvent('warn', 'auth', 'Confirm called without access_token');
    return res.status(400).json({ error: 'access_token required' });
  }

  // Basic sanity: must look like a JWT (three base64url segments)
  if ((access_token.match(/\./g) || []).length !== 2) {
    pushEvent('warn', 'auth', 'Confirm called with malformed token (not a JWT)');
    return res.status(400).json({ error: 'Invalid token format' });
  }

  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('sb_token', access_token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Ensure the local users row exists immediately so /auth/me works right away.
  // Without this, the first /auth/me after email confirmation returns 401 because
  // the user doesn't exist in the local DB yet.
  let userId = null;
  try {
    const pool = getPool();
    if (pool) {
      const supabaseUser = await getUserFromToken(access_token);
      if (supabaseUser) {
        await getOrCreateLocalUser(pool, supabaseUser);
        userId = supabaseUser.id;
        pushEvent('success', 'auth', `Email confirmed — user upserted: ${supabaseUser.email}`, {
          email: supabaseUser.email,
        });
      } else {
        pushEvent('warn', 'auth', 'Confirm: token valid but getUserFromToken returned null');
      }
    }
  } catch (err) {
    // Non-fatal: requireAuth middleware will create the user on the next request
    pushEvent('warn', 'auth', `Confirm: user upsert failed (non-fatal): ${err.message}`, {
      error: err.message,
    });
    console.error('[auth/confirm] user upsert failed:', err.message);
  }

  res.json({ ok: true, user_id: userId });
});

router.post(
  '/login',
  rateLimit({ windowMs: 60_000, max: 10, keyFn: (r) => r.ip }),
  async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    pushEvent('info', 'auth', `Login attempt — ${email}`, { email });

    try {
      const { status, data } = await supabaseAuthRequest('/token?grant_type=password', {
        email,
        password,
      });

      if (status !== 200 || !data.access_token) {
        pushEvent('warn', 'auth', `Login failed — ${email}`, {
          email,
          status,
          reason: data.error_description,
        });
        return res.status(401).json({ error: data.error_description || 'Invalid credentials' });
      }

      const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
      res.cookie('sb_token', data.access_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      pushEvent('success', 'auth', `Login success — ${email}`, { email });
      res.json({ ok: true });
    } catch (err) {
      pushEvent('error', 'auth', `Login error — ${email}: ${err.message}`, {
        email,
        error: err.message,
      });
      console.error('[auth] Email login error:', err.message);
      res.status(503).json({ error: 'Auth service unavailable' });
    }
  }
);

router.post(
  '/signup',
  rateLimit({ windowMs: 60_000, max: 10, keyFn: (r) => r.ip }),
  async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    try {
      const { status, data } = await supabaseAuthRequest('/signup', {
        email,
        password,
        data: { full_name: name || '' },
      });

      if (status >= 400) {
        return res.status(status).json({
          error: data.error_description || data.msg || data.error || 'Signup failed',
        });
      }

      // Email confirmation required — Supabase returns user but no access_token
      if (!data.access_token) {
        return res.json({ ok: true, email_confirmation: true });
      }

      const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
      res.cookie('sb_token', data.access_token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ ok: true, user_id: data.user?.id });
    } catch (err) {
      console.error('[auth] Signup error:', err.message);
      res.status(503).json({ error: 'Auth service unavailable' });
    }
  }
);

// ---------------------------------------------------------------------------
// Supabase Google SSO via Supabase
router.get('/google', async (req, res) => {
  const client = getAnonClient();
  if (!client) {
    return res.status(503).json({ error: 'Auth not configured' });
  }

  const redirectTo = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/auth/google/callback`;

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error || !data?.url) {
    console.error('[auth] Google OAuth init error:', error?.message);
    return res.redirect(`${getAppUrl()}/login?error=oauth_failed`);
  }

  res.redirect(data.url);
});

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    console.error('[auth] Google callback error:', error);
    return res.redirect(`${getAppUrl()}/login?error=oauth_denied`);
  }

  const client = getAnonClient();
  if (!client) return res.redirect(`${getAppUrl()}/login?error=auth_not_configured`);

  const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(code);

  if (exchangeError || !data?.session) {
    console.error('[auth] Code exchange error:', exchangeError?.message);
    return res.redirect(`${getAppUrl()}/login?error=exchange_failed`);
  }

  const token = data.session.access_token;
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie('sb_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Check onboarding status via DB
  const pool = getPool();
  if (pool) {
    try {
      const { rows } = await pool.query('SELECT onboarding_complete FROM users WHERE id = $1', [
        data.user.id,
      ]);
      if (!rows.length || !rows[0].onboarding_complete) {
        return res.redirect(`${getAppUrl()}/onboarding`);
      }
    } catch (err) {
      console.error('[auth] Onboarding check error:', err.message);
    }
  }

  res.redirect(getAppUrl());
});

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
router.post('/logout', (req, res) => {
  res.clearCookie('sb_token');
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Dev / Shell login — bypass Supabase entirely.
// Enabled when ALLOW_DEV_LOGIN=true or SHELL_MODE=true.
// Creates/refreshes a single dev user and sets a synthetic sb_token cookie
// that requireAuth recognises.
// ---------------------------------------------------------------------------
function shellAllowed() {
  return process.env.ALLOW_DEV_LOGIN === 'true' || process.env.SHELL_MODE === 'true';
}

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

async function upsertDevUser(pool) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO users (id, email, name, provider, onboarding_complete)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET updated_at = NOW(), onboarding_complete = true`,
    [DEV_USER_ID, 'dev@outround.local', 'Dev User', 'dev', true]
  );
}

router.post(
  '/dev-login',
  rateLimit({ windowMs: 60_000, max: 5, keyFn: (r) => r.ip }),
  async (req, res) => {
    if (!shellAllowed()) {
      return res.status(404).json({ error: 'Not found' });
    }

    const pool = getPool();
    try {
      await upsertDevUser(pool);
    } catch (err) {
      console.error('[auth] dev-login user upsert failed:', err.message);
    }

    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('sb_token', `dev:${DEV_USER_ID}`, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    pushEvent('success', 'auth', 'Dev login — shell access granted', { user_id: DEV_USER_ID });
    res.json({ ok: true, dev: true, user_id: DEV_USER_ID });
  }
);

// GET /auth/shell-config — tells frontend whether shell mode is available
router.get('/shell-config', (_req, res) => {
  res.json({ shell_available: shellAllowed() });
});

// ---------------------------------------------------------------------------
// Pipedrive OAuth
// ---------------------------------------------------------------------------
router.get('/pipedrive', requireAuth, (req, res) => {
  if (!process.env.PIPEDRIVE_CLIENT_ID) {
    return res.status(503).json({ error: 'Pipedrive integration not configured' });
  }
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const returnTo = req.query.return_to || '/settings';
  try {
    res.redirect(pipedrive.getAuthUrl(userId, returnTo));
  } catch (err) {
    console.error('[auth] Pipedrive auth URL error:', err.message);
    res.redirect(`${getAppUrl()}/settings?error=pipedrive_failed`);
  }
});

router.get('/pipedrive/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.redirect(`${getAppUrl()}/settings?error=pipedrive_denied`);
  }

  const decoded = verifyState(state);
  if (!decoded || !decoded.userId) {
    return res.redirect(`${getAppUrl()}/settings?error=invalid_state`);
  }
  const userId = decoded.userId;
  const returnTo = decoded.returnTo || '/settings';

  try {
    const tokenData = await pipedrive.exchangeCode(code, userId);

    // Also save to multi-tenant integrations table
    if (tokenManager.isConfigured() && userId && tokenData) {
      try {
        const pool = getPool();
        let userEmail = null;
        if (pool) {
          const { rows } = await pool
            .query('SELECT email FROM users WHERE id = $1', [userId])
            .catch(() => ({ rows: [] }));
          userEmail = rows[0]?.email || null;
        }
        const orgId = await tokenManager.ensureOrgForUser(userId, userEmail);
        const expiresAt = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null;
        await tokenManager.saveIntegration(
          orgId,
          'pipedrive',
          {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token || null,
            expiresAt,
          },
          { domain: tokenData.api_domain || null }
        );
      } catch (e) {
        console.error('[auth] pipedrive integrations save failed:', e.message);
      }
    }

    res.redirect(`${getAppUrl()}${returnTo}?pipedrive=connected`);
  } catch (err) {
    console.error('[auth] Pipedrive token exchange error:', err.message);
    res.redirect(`${getAppUrl()}${returnTo}?error=pipedrive_exchange_failed`);
  }
});

router.delete('/pipedrive', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database not available' });

  await pool.query(`DELETE FROM oauth_tokens WHERE user_id = $1 AND provider = 'pipedrive'`, [
    userId,
  ]);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Google Calendar OAuth
// ---------------------------------------------------------------------------
router.get('/gcal', requireAuth, (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google Calendar integration not configured' });
  }
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const returnTo = req.query.return_to || '/onboarding';
  try {
    res.redirect(gcal.getAuthUrl(userId, returnTo));
  } catch (err) {
    console.error('[auth] GCal auth URL error:', err.message);
    res.redirect(`${getAppUrl()}/settings?error=gcal_failed`);
  }
});

router.get('/gcal/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    return res.redirect(`${getAppUrl()}/settings?error=gcal_denied`);
  }

  const decoded = verifyState(state);
  if (!decoded || !decoded.userId) {
    return res.redirect(`${getAppUrl()}/settings?error=invalid_state`);
  }
  const userId = decoded.userId;
  const returnTo = decoded.returnTo || '/onboarding';

  try {
    const tokenData = await gcal.exchangeCode(code, userId);

    // Also save to multi-tenant integrations table
    if (tokenManager.isConfigured() && userId && tokenData) {
      try {
        const pool = getPool();
        let userEmail = null;
        if (pool) {
          const { rows } = await pool
            .query('SELECT email FROM users WHERE id = $1', [userId])
            .catch(() => ({ rows: [] }));
          userEmail = rows[0]?.email || null;
        }
        const orgId = await tokenManager.ensureOrgForUser(userId, userEmail);
        const expiresAt = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null;
        await tokenManager.saveIntegration(orgId, 'google', {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          expiresAt,
        });
      } catch (e) {
        console.error('[auth] gcal integrations save failed:', e.message);
      }
    }

    res.redirect(`${getAppUrl()}${returnTo}?gcal=connected`);
  } catch (err) {
    console.error('[auth] GCal token exchange error:', err.message);
    res.redirect(`${getAppUrl()}${returnTo}?error=gcal_exchange_failed`);
  }
});

router.delete('/gcal', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database not available' });

  await pool.query(`DELETE FROM oauth_tokens WHERE user_id = $1 AND provider = 'gcal'`, [userId]);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Slack OAuth (saves bot token + user ID to integrations table)
// Requires env vars: SLACK_CLIENT_ID, SLACK_CLIENT_SECRET
// ---------------------------------------------------------------------------

router.get('/slack', requireAuth, (req, res) => {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Slack integration not configured' });

  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const returnTo = req.query.return_to || '/settings';
  const stateData = signState({ userId, returnTo });
  const redirectUri = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/auth/slack/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'chat:write',
    redirect_uri: redirectUri,
    state: stateData,
  });
  res.redirect('https://slack.com/oauth/v2/authorize?' + params);
});

router.get('/slack/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code || !state) {
    return res.redirect(`${getAppUrl()}/settings?error=slack_denied`);
  }

  const decoded = verifyState(state);
  if (!decoded || !decoded.userId) {
    return res.redirect(`${getAppUrl()}/settings?error=invalid_state`);
  }
  const userId = decoded.userId;
  const returnTo = decoded.returnTo || '/settings';

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.redirect(`${getAppUrl()}${returnTo}?error=slack_not_configured`);
  }

  const redirectUri = `${process.env.BACKEND_URL || req.protocol + '://' + req.get('host')}/auth/slack/callback`;

  try {
    const resp = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    const data = await resp.json();
    if (!data.ok) throw new Error('Slack OAuth error: ' + data.error);

    const botToken = data.access_token;
    const slackUserId = data.authed_user?.id || null;

    if (tokenManager.isConfigured() && userId) {
      const pool = getPool();
      let userEmail = null;
      if (pool) {
        const { rows } = await pool
          .query('SELECT email FROM users WHERE id = $1', [userId])
          .catch(() => ({ rows: [] }));
        userEmail = rows[0]?.email || null;
      }
      const orgId = await tokenManager.ensureOrgForUser(userId, userEmail);
      await tokenManager.saveIntegration(
        orgId,
        'slack',
        { accessToken: botToken },
        { slack_user_id: slackUserId }
      );
    }

    res.redirect(`${getAppUrl()}${returnTo}?slack=connected`);
  } catch (err) {
    console.error('[auth] Slack OAuth error:', err.message);
    res.redirect(`${getAppUrl()}${returnTo}?error=slack_exchange_failed`);
  }
});

router.delete('/slack', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  if (tokenManager.isConfigured()) {
    try {
      const sb = tokenManager.getClient();
      // Look up orgId from users table
      const { data: user } = await sb.from('users').select('org_id').eq('id', userId).maybeSingle();
      if (user?.org_id) {
        await sb.from('integrations').delete().eq('org_id', user.org_id).eq('provider', 'slack');
      }
    } catch (err) {
      console.error('[auth] slack disconnect error:', err.message);
    }
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Current user profile
// ---------------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res) => {
  const user = req.user;
  const supabaseUser = req.supabaseUser;

  if (!supabaseUser && !user) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  // Integration connection status
  const userId = user?.id || supabaseUser.id;
  const [pipedriveConnected, gcalConnected] = await Promise.all([
    pipedrive.isConnected(userId).catch(() => false),
    gcal.isConnected(userId).catch(() => false),
  ]);

  // Slack connection status (from integrations table)
  let slackConnected = false;
  if (tokenManager.isConfigured()) {
    try {
      const sb = tokenManager.getClient();
      const { data: userRow } = await sb
        .from('users')
        .select('org_id')
        .eq('id', userId)
        .maybeSingle();
      if (userRow?.org_id) {
        const { data: slack } = await sb
          .from('integrations')
          .select('id')
          .eq('org_id', userRow.org_id)
          .eq('provider', 'slack')
          .maybeSingle();
        slackConnected = !!slack;
      }
    } catch {
      /* ignore */
    }
  }

  res.json({
    id: userId,
    email: user?.email || supabaseUser?.email || null,
    name: user?.name || supabaseUser?.user_metadata?.full_name || null,
    role: user?.role || null,
    avatar_url: user?.avatar_url || supabaseUser?.user_metadata?.avatar_url || null,
    coach_id: user?.coach_id || null,
    onboarding_complete:
      user?.onboarding_complete || req.supabaseUser?.app_metadata?.provider === 'dev' || false,
    integrations: {
      pipedrive: pipedriveConnected,
      gcal: gcalConnected,
      slack: slackConnected,
    },
  });
});

router.put('/me', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const { name, role } = req.body;
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database not available' });

  const { rows } = await pool.query(
    `UPDATE users SET
       name = COALESCE($1, name),
       role = COALESCE($2, role),
       updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [name || null, role || null, userId]
  );

  res.json(rows[0] || {});
});

// ---------------------------------------------------------------------------
// Complete onboarding
// ---------------------------------------------------------------------------
router.post('/onboarding/complete', requireAuth, async (req, res) => {
  const userId = req.user?.id || req.supabaseUser?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database not available' });

  await pool.query(
    'UPDATE users SET onboarding_complete = true, updated_at = NOW() WHERE id = $1',
    [userId]
  );

  res.json({ ok: true });
});

module.exports = router;
