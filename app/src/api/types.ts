// API response types — derived from backend/routes/*.js

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  avatar_url: string | null;
  coach_id: string | null;
  onboarding_complete: boolean;
  integrations: {
    pipedrive: boolean;
    gcal: boolean;
  };
}

export interface Coach {
  id: string;
  name: string;
  tagline: string;
  description: string;
  style: string;
  avatar_url: string | null;
  voice_id: string;
}

export interface LeaderboardEntry {
  name: string;
  role: string | null;
  score: number;
  is_you?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  week_start: string;
}

export interface MeetingProspect {
  name: string | null;
  email: string | null;
  company: string | null;
  pipedrive_person_id: string | null;
}

export interface MeetingBot {
  id: string;
  status: string;
  join_at: string | null;
  transcript_ready: boolean;
}

export interface UpcomingMeeting {
  id: string;
  external_event_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  conference: { url: string; provider: string } | null;
  prospect: MeetingProspect;
  deal: unknown;
  outround_done: boolean;
  outround_session_id: string | null;
  bot: MeetingBot | null;
  bot_supported: boolean;
}

export interface MeetingsResponse {
  connected: boolean;
  bot_configured: boolean;
  error?: string;
  meetings: UpcomingMeeting[];
}

export interface SessionHistoryItem {
  id: string;
  created_at: string;
  persona_id: string | null;
  mode: string | null;
  score: number | null;
  duration_seconds: number | null;
  status: string;
}

export interface SessionStats {
  total_sessions: number;
  avg_score: number | null;
  best_score: number | null;
  current_streak: number;
}
