import { Card, CardHead } from '../../../design/primitives/Card';
import { Num } from '../../../design/primitives/Text';
import { SkeletonLines, EmptyState } from '../../../design/primitives/Skeleton';
import { T, scoreColor } from '../../../design/tokens';
import type { SessionStats } from '../../../api/types';

interface Props {
  data: SessionStats | null;
  loading: boolean;
  error: string | null;
}

export function ScoreCard({ data, loading, error }: Props) {
  return (
    <Card span={4}>
      <CardHead kicker="THIS WEEK" title="Your readiness" />
      {loading && <SkeletonLines count={3} />}
      {error && !loading && (
        <EmptyState title="Score unavailable" body={error} />
      )}
      {!loading && !error && data && data.total_sessions === 0 && (
        <EmptyState
          title="No score yet"
          body="One round and you're on the board."
        />
      )}
      {!loading && !error && data && data.total_sessions > 0 && (
        <div>
          <Num
            style={{
              fontSize: 56,
              fontWeight: 500,
              lineHeight: 1,
              color: scoreColor(data.avg_score ?? 0),
              display: 'block',
            }}
          >
            {Math.round(data.avg_score ?? 0)}
          </Num>
          <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 12, color: T.t2 }}>
            <div>
              <div style={{ color: T.t3, fontSize: 10, letterSpacing: 0.5 }}>BEST</div>
              <Num style={{ fontSize: 16, color: T.t1 }}>{data.best_score ?? '—'}</Num>
            </div>
            <div>
              <div style={{ color: T.t3, fontSize: 10, letterSpacing: 0.5 }}>STREAK</div>
              <Num style={{ fontSize: 16, color: T.t1 }}>{data.current_streak}</Num>
            </div>
            <div>
              <div style={{ color: T.t3, fontSize: 10, letterSpacing: 0.5 }}>ROUNDS</div>
              <Num style={{ fontSize: 16, color: T.t1 }}>{data.total_sessions}</Num>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
