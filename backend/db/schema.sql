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

-- ---------------------------------------------------------------------------
-- Meeting Bot (Recall.ai) — Phase 4
-- ---------------------------------------------------------------------------

-- Cached calendar events linked to a Pipedrive prospect.
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'gcal',           -- 'gcal' | 'manual'
  external_event_id TEXT,                        -- gcal event id
  title TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  attendees JSONB,                               -- [{email, name, organizer}]
  conference_url TEXT,                           -- zoom / meet / teams URL
  conference_provider TEXT,                      -- 'zoom' | 'google_meet' | 'teams'
  prospect_email TEXT,
  pipedrive_person_id BIGINT,
  pipedrive_deal_id BIGINT,
  prospect_name TEXT,
  prospect_company TEXT,
  outround_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  outround_done BOOLEAN NOT NULL DEFAULT false,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, source, external_event_id)
);
CREATE INDEX IF NOT EXISTS idx_meetings_user_time ON meetings (user_id, starts_at);

-- Recall.ai meeting bot deployments
CREATE TABLE IF NOT EXISTS meeting_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  recall_bot_id TEXT UNIQUE,
  conference_url TEXT NOT NULL,
  join_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',      -- scheduled|joining|in_call|done|failed|cancelled
  status_detail TEXT,
  transcript_url TEXT,
  recording_url TEXT,
  transcript JSONB,
  duration_seconds INTEGER,
  summary TEXT,
  next_steps JSONB,
  objections JSONB,
  competitor_mentions JSONB,
  acoustic_metrics JSONB,
  pipedrive_pushed_at TIMESTAMPTZ,
  pipedrive_note_id BIGINT,
  pipedrive_activity_id BIGINT,
  recording_deleted_at TIMESTAMPTZ,
  transcript_deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meeting_bots_user ON meeting_bots (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_bots_status ON meeting_bots (status);

-- Cached meeting-prep payload (Claude-generated prospect intel + persona assembly).
-- Stored on the meeting row so the prep page is < 200ms after first visit.
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS prep_data        JSONB;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS prep_generated_at TIMESTAMPTZ;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS prep_persona_prompt TEXT;

-- ---------------------------------------------------------------------------
-- Multi-tenant credential layer (meeting intelligence pipeline)
-- ---------------------------------------------------------------------------

-- One organisation per company. Users belong to one org.
CREATE TABLE IF NOT EXISTS organisations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  company_domain TEXT,                    -- e.g. "acme.com" — used to detect external attendees
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Per-org integration tokens (Google, Pipedrive, Slack, Recall).
-- access_token / refresh_token stored in plain text at the Supabase layer;
-- Supabase RLS + service-role key restriction provide the security boundary.
CREATE TABLE IF NOT EXISTS integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,            -- 'google' | 'pipedrive' | 'slack' | 'recall'
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}',       -- e.g. { slack_user_id, domain, company_domain }
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, provider)
);

-- Link users to orgs (nullable — existing rows unaffected until backfilled)
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id);

-- Link meeting_bots to orgs so the webhook can look up credentials
ALTER TABLE meeting_bots ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id);
-- make user_id nullable so org-dispatched bots don't require a users row
ALTER TABLE meeting_bots ALTER COLUMN user_id DROP NOT NULL;
