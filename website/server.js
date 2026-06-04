'use strict';

const express = require('express');
const path = require('path');
const app = express();

const DIST = path.join(__dirname, 'dist');

app.use(express.static(DIST));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'website' }));

// SPA fallback — all non-asset routes return index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Outround website running on port ${PORT}`));
