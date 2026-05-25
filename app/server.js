'use strict';

if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch { /* dotenv optional */ }
}

const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Proxy API and auth calls to the backend service
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
}));

app.use('/auth', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  // Preserve cookies set by the backend (httpOnly auth cookies)
  onProxyRes(proxyRes) {
    const setCookie = proxyRes.headers['set-cookie'];
    if (setCookie) {
      // Strip Secure flag when running on http in dev so cookies still work
      proxyRes.headers['set-cookie'] = setCookie.map(c =>
        process.env.NODE_ENV !== 'production' ? c.replace(/; ?Secure/i, '') : c
      );
    }
  },
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'app' }));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ui.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Outround app running on port ${PORT} → backend: ${BACKEND_URL}`);
});
