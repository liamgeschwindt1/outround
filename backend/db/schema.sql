-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT,
  provider TEXT NOT NULL DEFAULT 'email', -- 'email' | 'google'
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  coach_id TEXT DEFAULT 'default',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth tokens (Pipedrive, Google Calendar)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'pipedrive' | 'gcal'
  access_token TEXT NOT NULL,  -- AES-256-GCM encrypted
  refresh_token TEXT,          -- AES-256-GCM encrypted
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  coach_id TEXT,
  bot_default BOOLEAN NOT NULL DEFAULT false,
  crm_push_auto BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable for backward compat
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  persona_id TEXT NOT NULL DEFAULT 'hendrik',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  transcript JSONB,
  audio_metrics JSONB,
  score INTEGER,
  score_breakdown JSONB,
  coaching_feedback JSONB,
  elevenlabs_conversation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly leaderboard view
CREATE OR REPLACE VIEW leaderboard_week AS
SELECT
  user_name,
  user_role,
  MAX(score) AS best_score,
  COUNT(*) AS session_count
FROM sessions
WHERE
  score IS NOT NULL
  AND score >= 0
  AND started_at > NOW() - INTERVAL '7 days'
GROUP BY user_name, user_role
ORDER BY best_score DESC
LIMIT 20;
