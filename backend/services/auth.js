/**
 * Supabase Auth service — server-side admin operations.
 *
 * Env vars required:
 *   SUPABASE_URL          — your project URL
 *   SUPABASE_SERVICE_KEY  — service_role key (never expose to client)
 */

const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getAdminClient() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn('[auth] SUPABASE_URL or SUPABASE_SERVICE_KEY not set — auth disabled');
    return null;
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return _client;
}

/**
 * Verify a JWT issued by Supabase and return the user object.
 * Returns null if the token is invalid or auth is not configured.
 */
async function getUserFromToken(jwt) {
  const client = getAdminClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Look up the local users row for a given Supabase auth user ID.
 * Creates the row on first login if it doesn't exist.
 */
async function getOrCreateLocalUser(db, supabaseUser) {
  if (!db) return null;

  const { id, email, user_metadata } = supabaseUser;
  const name = user_metadata?.full_name || user_metadata?.name || null;
  const avatar_url = user_metadata?.avatar_url || null;
  const google_id = supabaseUser.app_metadata?.provider === 'google' ? id : null;
  const provider = supabaseUser.app_metadata?.provider || 'email';

  const { rows } = await db.query(
    `INSERT INTO users (id, email, name, avatar_url, google_id, provider)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = COALESCE(users.name, EXCLUDED.name),
       avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url),
       updated_at = NOW()
     RETURNING *`,
    [id, email, name, avatar_url, google_id, provider]
  );
  return rows[0] || null;
}

module.exports = { getUserFromToken, getOrCreateLocalUser };
