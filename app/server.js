'use strict';

if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch { /* dotenv optional */ }
}

const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Proxy API and auth calls to the backend service.
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
}));

app.use('/auth', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  onProxyRes(proxyRes) {
    const setCookie = proxyRes.headers['set-cookie'];
    if (setCookie) {
      // Strip Secure flag in dev so cookies still work over http.
      proxyRes.headers['set-cookie'] = setCookie.map(c =>
        process.env.NODE_ENV !== 'production' ? c.replace(/; ?Secure/i, '') : c
      );
    }
  },
}));

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
