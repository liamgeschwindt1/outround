'use strict';

// Load .env in development (Railway injects env vars directly in production)
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch { /* dotenv optional */ }
}

const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/session', require('./routes/session'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Serve UI for any non-API route
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ui.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Outround running on port ${PORT}`);
});
