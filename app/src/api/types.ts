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
    slack: boolean;
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

// ─── Meeting Prep ────────────────────────────────────────────────────────────

export interface PipedrivePerson {
  id: number;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  org: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  open_deals_count: number | null;
  closed_deals_count: number | null;
  last_activity_date: string | null;
  next_activity_date: string | null;
  photo_url: string | null;
}

export interface PipedriveDeal {
  id: number;
  title: string;
  stage_id: number | null;
  stage_name: string | null;
  value: number;
  currency: string | null;
  status: string;
  probability: number | null;
  days_in_stage: number | null;
  expected_close_date: string | null;
  next_activity_subject: string | null;
  next_activity_date: string | null;
  owner_name: string | null;
}

export interface PipedriveNote {
  id: number;
  content: string;
  add_time: string;
  user_name: string | null;
  deal_id: number | null;
}

export interface PipedriveActivity {
  id: number;
  type: string | null;
  subject: string | null;
  done: boolean;
  due_date: string | null;
  due_time: string | null;
  duration: string | null;
  note: string;
  add_time: string | null;
  marked_as_done_time: string | null;
  deal_id: number | null;
}

export interface PersonaSummary {
  communication_style: string;
  known_objections: string[];
  resistance_level: number; // 1–5
  what_moves_them: string[];
}

export interface MeetingPrepResponse {
  cached: boolean;
  generated_at: string;
  meeting: UpcomingMeeting;
  prospect: PipedrivePerson | null;
  deal: PipedriveDeal | null;
  notes: PipedriveNote[];
  activities: PipedriveActivity[];
  prospect_summary: string;
  last_interaction: string | null;
  open_next_steps: string[];
  coaching_notes: string[];
  persona_summary: PersonaSummary | null;
  insufficient_crm_data: boolean;
  intel_error?: string;
}
