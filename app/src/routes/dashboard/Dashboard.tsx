import { useDashboardData } from '../../hooks/useDashboardData';
import { ScoreCard } from './cards/ScoreCard';
import { CoachOrbCard } from './cards/CoachOrbCard';
import { MeetingsScrollerCard } from './cards/MeetingsScrollerCard';
import { LeaderboardCard } from './cards/LeaderboardCard';
import { RecentSessionsCard } from './cards/RecentSessionsCard';
import { PersonaLibraryCard } from './cards/PersonaLibraryCard';

export default function Dashboard() {
  const { stats, leaderboard, meetings, history } = useDashboardData();

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 16,
        }}
      >
        <ScoreCard {...stats} />
        <MeetingsScrollerCard {...meetings} />
        <CoachOrbCard />

        <LeaderboardCard {...leaderboard} />
        <RecentSessionsCard {...history} />
        <PersonaLibraryCard />
      </div>
    </div>
  );
}
