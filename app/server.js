'use strict';

if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch {
    /* dotenv optional */
  }
}

const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Strict-Transport-Security',
    process.env.NODE_ENV === 'production'
      ? 'max-age=63072000; includeSubDomains; preload'
      : 'max-age=0'
  );
  next();
});

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Shared proxy error handler — surface real failures instead of hanging
// until the edge returns a generic 504.
function handleProxyError(err, _req, res) {
  console.error(`[proxy] ${err.code || 'ERROR'} → ${BACKEND_URL}:`, err.message);
  if (res.headersSent) return;
  res.status(502).json({
    error: 'Backend unreachable',
    code: err.code || 'PROXY_ERROR',
    target: BACKEND_URL,
  });
}

// Proxy API and auth calls to the backend service.
// pathRewrite restores the prefix that Express strips before passing to the middleware.
app.use(
  '/api',
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: { '^': '/api' },
    proxyTimeout: 25000,
    timeout: 25000,
    onError: handleProxyError,
  })
);

app.use(
  '/auth',
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: { '^': '/auth' },
    proxyTimeout: 25000,
    timeout: 25000,
    onError: handleProxyError,
    onProxyRes(proxyRes) {
      const setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        // Strip Secure flag in dev so cookies still work over http.
        proxyRes.headers['set-cookie'] = setCookie.map((c) =>
          process.env.NODE_ENV !== 'production' ? c.replace(/; ?Secure/i, '') : c
        );
      }
    },
  })
);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'app' }));

// Static: prefer built Vite output; also serve legacy /public for raw assets (images, svgs).
if (fs.existsSync(DIST_DIR)) app.use(express.static(DIST_DIR));
if (fs.existsSync(PUBLIC_DIR)) app.use(express.static(PUBLIC_DIR));

// SPA fallback — every other GET returns index.html so client routing works on refresh.
app.get('*', (_req, res) => {
  const indexFile = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(503).send('App not built. Run "npm run build".');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Outround app running on port ${PORT} → backend: ${BACKEND_URL}`);
});
