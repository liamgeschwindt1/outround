'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set — database features disabled');
      return null;
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected DB pool error:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('Database not configured');
  return p.query(text, params);
}

/**
 * Apply schema.sql against the Postgres database on boot.
 *
 * The schema is fully idempotent (every statement uses IF NOT EXISTS /
 * ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE), so it is safe to run on
 * every startup. This keeps the live database in sync with the checked-in
 * schema without a manual migration step.
 *
 * No-ops gracefully when DATABASE_URL is not configured.
 */
async function applySchema() {
  const p = getPool();
  if (!p) return;
  const schemaPath = path.join(__dirname, 'schema.sql');
  let sql;
  try {
    sql = fs.readFileSync(schemaPath, 'utf8');
  } catch (err) {
    console.error('[db] could not read schema.sql:', err.message);
    return;
  }
  try {
    await p.query(sql);
    console.log('[db] schema applied');
  } catch (err) {
    console.error('[db] schema apply failed:', err.message);
  }
}

module.exports = { query, getPool, applySchema };
