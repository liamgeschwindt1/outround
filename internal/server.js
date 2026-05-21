'use strict';

const express = require('express');
const app = express();

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'internal' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Outround internal running on port ${PORT}`));
