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

// Global error & rejection guards — never crash on a single bad request
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
// Bind to :: so Railway's private network (IPv6) can reach us.
// Node's default 0.0.0.0 only binds IPv4, which makes *.railway.internal
// hostnames hang and surface as 504s at the edge.
app.listen(PORT, '::', () => {
  console.log(`Outround backend running on port ${PORT} (binding ::)`);
});
