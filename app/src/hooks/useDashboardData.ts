import { useApi } from '../api/hooks';
import type {
  LeaderboardResponse,
  MeetingsResponse,
  SessionHistoryItem,
  SessionStats,
} from '../api/types';

export interface DashboardData {
  stats: { data: SessionStats | null; loading: boolean; error: string | null };
  leaderboard: { data: LeaderboardResponse | null; loading: boolean; error: string | null };
  meetings: { data: MeetingsResponse | null; loading: boolean; error: string | null };
  history: {
    data: { sessions: SessionHistoryItem[] } | null;
    loading: boolean;
    error: string | null;
  };
}

export function useDashboardData(): DashboardData {
  const stats = useApi<SessionStats>('/api/session/stats');
  const leaderboard = useApi<LeaderboardResponse>('/api/leaderboard');
  const meetings = useApi<MeetingsResponse>('/api/meetings/upcoming');
  const history = useApi<{ sessions: SessionHistoryItem[] }>('/api/session/history');

  return { stats, leaderboard, meetings, history };
}
