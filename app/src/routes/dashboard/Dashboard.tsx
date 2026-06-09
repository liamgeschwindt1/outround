import { useDashboardData } from '../../hooks/useDashboardData';
import { WeekCalendar } from './WeekCalendar';
import { T } from '../../design/tokens';

export default function Dashboard() {
  const { meetings } = useDashboardData();

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 6,
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: 0.8,
          color: T.t3,
        }}
      >
        MEETINGS
      </div>
      <WeekCalendar {...meetings} />
    </div>
  );
}
