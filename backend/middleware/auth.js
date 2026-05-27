/**
 * requireAuth middleware — verifies the Supabase JWT from:
 *   1. Authorization: Bearer <token> header
 *   2. sb_token httpOnly cookie (set by /auth/google/callback)
 *
 * Attaches req.supabaseUser (raw Supabase user) and req.user (local DB row).
 *
 * If SUPABASE_URL / SUPABASE_SERVICE_KEY are not configured,
 * auth is skipped in development (pass-through with a warning).
 */

const { getUserFromToken, getOrCreateLocalUser } = require('../services/auth');
const { getPool } = require('../db/client');

let pushEvent = () => {};
try { pushEvent = require('../routes/debug').pushEvent; } catch {}

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEV_TOKEN_PREFIX = 'dev:';

async function requireAuth(req, res, next) {
  // Extract token from header or cookie
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies && req.cookies.sb_token) {
    token = req.cookies.sb_token;
  }

  // Dev / shell login bypass — works when ALLOW_DEV_LOGIN=true or SHELL_MODE=true
  const devAllowed = process.env.ALLOW_DEV_LOGIN === 'true' || process.env.SHELL_MODE === 'true';
  if (token && token.startsWith(DEV_TOKEN_PREFIX) && devAllowed) {
    const devId = token.slice(DEV_TOKEN_PREFIX.length) || DEV_USER_ID;
    req.supabaseUser = {
      id: devId,
      email: 'dev@outround.local',
      user_metadata: { full_name: 'Dev User' },
      app_metadata: { provider: 'dev' },
    };
    const pool = getPool();
    if (pool) {
      try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [devId]);
        req.user = rows[0] || null;
      } catch (err) {
        console.error('[auth] dev-login user load failed:', err.message);
      }
    }
    pushEvent('info', 'auth', `Shell auth — ${req.method} ${req.path}`, { user: 'dev@outround.local' });
    return next();
  }

  // Auth bypass when Supabase is not configured (dev / demo environment)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return next();
  }

  if (!token) {
    pushEvent('warn', 'auth', `Unauthorised — no token — ${req.method} ${req.path}`, { path: req.path });
    return res.status(401).json({ error: 'Unauthorised — no token provided' });
  }

  let supabaseUser;
  try {
    supabaseUser = await getUserFromToken(token);
  } catch (err) {
    pushEvent('error', 'auth', `getUserFromToken threw: ${err.message}`, { path: req.path, error: err.message });
    console.error('[auth] getUserFromToken threw:', err.message);
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
  if (!supabaseUser) {
    pushEvent('warn', 'auth', `Invalid/expired token — ${req.method} ${req.path}`, { path: req.path });
    return res.status(401).json({ error: 'Unauthorised — invalid or expired token' });
  }

  req.supabaseUser = supabaseUser;
  pushEvent('info', 'auth', `Token valid — ${supabaseUser.email}`, { email: supabaseUser.email, path: req.path });

  // Attach local DB user if DB is available
  const pool = getPool();
  if (pool) {
    try {
      req.user = await getOrCreateLocalUser(pool, supabaseUser);
    } catch (err) {
      console.error('[auth] Failed to load local user:', err.message);
    }
  }

  next();
}

module.exports = { requireAuth, DEV_USER_ID, DEV_TOKEN_PREFIX };
