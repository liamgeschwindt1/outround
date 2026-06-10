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
try {
  pushEvent = require('../routes/debug').pushEvent;
} catch {}

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
  // ONLY the hardcoded DEV_USER_ID is accepted — never allow arbitrary IDs via dev: prefix
  const devAllowed = process.env.ALLOW_DEV_LOGIN === 'true' || process.env.SHELL_MODE === 'true';
  if (token && token.startsWith(DEV_TOKEN_PREFIX) && devAllowed) {
    const providedId = token.slice(DEV_TOKEN_PREFIX.length);
    // Reject any token that tries to use a custom ID — only the exact dev: token
    // (without a custom ID) or the explicit DEV_USER_ID is accepted
    if (providedId && providedId !== DEV_USER_ID) {
      pushEvent('warn', 'auth', `Rejected dev token with custom ID: ${providedId.slice(0, 8)}...`, {
        path: req.path,
      });
      return res.status(401).json({ error: 'Unauthorised — invalid dev token' });
    }
    const devId = DEV_USER_ID;
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
    pushEvent('info', 'auth', `Shell auth — ${req.method} ${req.path}`, {
      user: 'dev@outround.local',
    });
    return next();
  }

  // Auth bypass when Supabase is not configured (dev / demo environment)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return next();
  }

  if (!token) {
    pushEvent('warn', 'auth', `Unauthorised — no token — ${req.method} ${req.path}`, {
      path: req.path,
    });
    return res.status(401).json({ error: 'Unauthorised — no token provided' });
  }

  let supabaseUser;
  try {
    supabaseUser = await getUserFromToken(token);
  } catch (err) {
    pushEvent('error', 'auth', `getUserFromToken threw: ${err.message}`, {
      path: req.path,
      error: err.message,
    });
    console.error('[auth] getUserFromToken threw:', err.message);
    return res.status(503).json({ error: 'Auth service unavailable' });
  }
  if (!supabaseUser) {
    pushEvent('warn', 'auth', `Invalid/expired token — ${req.method} ${req.path}`, {
      path: req.path,
    });
    return res.status(401).json({ error: 'Unauthorised — invalid or expired token' });
  }

  req.supabaseUser = supabaseUser;
  pushEvent('info', 'auth', `Token valid — ${supabaseUser.email}`, {
    email: supabaseUser.email,
    path: req.path,
  });

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

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Simple in-memory sliding-window rate limiter.
// Cleans up stale entries every 5 minutes automatically.

const rateLimitStore = new Map();

function rateLimit({ windowMs = 60_000, max = 10, keyFn }) {
  // Auto-cleanup every 5 minutes
  if (rateLimitStore._cleanupTimer == null) {
    rateLimitStore._cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [k, v] of rateLimitStore) {
        // Remove entries older than the largest window we track (15 min)
        if (now - v.reset > 900_000) rateLimitStore.delete(k);
      }
    }, 300_000);
    // Allow the process to exit even with this timer running
    if (rateLimitStore._cleanupTimer.unref) rateLimitStore._cleanupTimer.unref();
  }

  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip;
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.reset) {
      entry = { count: 0, reset: now + windowMs };
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.reset - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many requests — please try again later',
        retry_after_seconds: retryAfter,
      });
    }

    rateLimitStore.set(key, entry);
    next();
  };
}

module.exports = { requireAuth, rateLimit, DEV_USER_ID, DEV_TOKEN_PREFIX };
