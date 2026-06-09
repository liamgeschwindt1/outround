'use strict';

const express = require('express');
const path = require('path');
const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
});

const DIST = path.join(__dirname, 'dist');

app.use(express.static(DIST));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'website' }));

// SPA fallback — all non-asset routes return index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Outround website running on port ${PORT}`));
