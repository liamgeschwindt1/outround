import { Card, CardHead } from '../../../design/primitives/Card';
import { Num } from '../../../design/primitives/Text';
import { SkeletonLines, EmptyState } from '../../../design/primitives/Skeleton';
import { T, R, scoreColor } from '../../../design/tokens';
import type { LeaderboardResponse } from '../../../api/types';
import { useAuth } from '../../../auth/AuthProvider';

interface Props {
  data: LeaderboardResponse | null;
  loading: boolean;
  error: string | null;
}

export function LeaderboardCard({ data, loading, error }: Props) {
  const { user } = useAuth();
  const youName = user?.name?.toLowerCase();

  return (
    <Card span={6}>
      <CardHead kicker="THIS WEEK" title="Leaderboard" />

      {loading && <SkeletonLines count={5} />}
      {!loading && error && <EmptyState title="Couldn’t load" body={error} />}
      {!loading && !error && data?.entries.length === 0 && (
        <EmptyState title="No scores yet" body="Be first on the board." />
      )}

      {!loading && !error && data && data.entries.length > 0 && (
        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {data.entries.slice(0, 5).map((e, i) => {
            const isYou = e.is_you ?? (youName != null && e.name.toLowerCase() === youName);
            return (
              <li
                key={`${e.name}-${String(i)}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: R.md,
                  background: isYou ? 'rgba(240,90,50,0.08)' : 'transparent',
                  border: isYou ? '1px solid rgba(240,90,50,0.30)' : '1px solid transparent',
                }}
              >
                <Num style={{ width: 24, color: T.t3, fontSize: 13 }}>{i + 1}</Num>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isYou ? 600 : 500,
                      color: T.t1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {e.name} {isYou && <span style={{ color: T.coral, fontSize: 11 }}>· you</span>}
                  </div>
                  {e.role && <div style={{ fontSize: 11, color: T.t3 }}>{e.role}</div>}
                </div>
                <Num style={{ fontSize: 15, color: scoreColor(e.score), fontWeight: 500 }}>
                  {e.score}
                </Num>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
