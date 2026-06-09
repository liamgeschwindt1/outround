'use strict';

// Load .env in development (Railway injects env vars directly in production)
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch { /* dotenv optional */ }
}

const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());

// CORS — allow demo, app and internal services to call this API
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Request logger ─────────────────────────────────────────────────────────
// Loads debug module first so we can push to its ring buffer immediately.
let pushEvent = () => {};
try {
  const debug = require('./routes/debug');
  pushEvent = debug.pushEvent;
} catch { /* debug route failed to load — ignore */ }

app.use((req, res, next) => {
  const start = Date.now();
  const { method, path: reqPath, ip } = req;
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    pushEvent(level, 'http', `${method} ${reqPath} → ${status} (${ms}ms)`, {
      method, path: reqPath, status, ms,
      ip: req.headers['x-forwarded-for'] || ip || '?',
      user: req.user?.email || req.supabaseUser?.email || null,
    });
  });
  next();
});

// Routes — safeMount keeps the server up if any single route module fails to load
function safeMount(mountPath, modulePath) {
  try {
    app.use(mountPath, require(modulePath));
  } catch (err) {
    console.error(`[server] failed to mount ${modulePath} at ${mountPath}:`, err.message);
  }
}
safeMount('/auth', './routes/auth');
safeMount('/api/session', './routes/session');
safeMount('/api/leaderboard', './routes/leaderboard');
safeMount('/api/coaches', './routes/coaches');
safeMount('/api/debug', './routes/debug');
safeMount('/api', './routes/meetings');
safeMount('/api', './routes/webhooks');
safeMount('/api/intel', './routes/intel');

// Global error & rejection guards — never crash on a single bad request
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

// Health check — includes startup time so you can confirm a fresh deploy
const STARTED_AT = new Date().toISOString();
app.get('/health', (_req, res) => res.json({ status: 'ok', started_at: STARTED_AT }));

const PORT = process.env.PORT || 3001;
// Bind to :: so Railway's private network (IPv6) can reach us.
// Node's default 0.0.0.0 only binds IPv4, which makes *.railway.internal
// hostnames hang and surface as 504s at the edge.
app.listen(PORT, '::', () => {
  console.log(`Outround backend running on port ${PORT} (binding ::)`);

  // Start the calendar poller only if Google credentials are configured
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      require('./services/calendar-poller').start();
    } catch (err) {
      console.error('[server] calendar poller failed to start:', err.message);
    }
  }
});
