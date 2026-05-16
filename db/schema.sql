-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  assemblyai_transcript_id TEXT,
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
