'use strict';

if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch { /* dotenv optional */ }
}

const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Proxy all API calls to the backend service
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/' },
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'demo' }));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ui.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Outround demo running on port ${PORT} → backend: ${BACKEND_URL}`);
});
