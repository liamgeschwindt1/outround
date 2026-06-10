import { useNavigate } from 'react-router-dom';
import { Card, CardHead } from '../../../design/primitives/Card';
import { Num } from '../../../design/primitives/Text';
import { SkeletonLines, EmptyState } from '../../../design/primitives/Skeleton';
import { Button } from '../../../design/primitives/Button';
import { T, R, scoreColor } from '../../../design/tokens';
import type { SessionHistoryItem } from '../../../api/types';

interface Props {
  data: SessionHistoryItem[] | null;
  loading: boolean;
  error: string | null;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${String(m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${String(h)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function RecentSessionsCard({ data, loading, error }: Props) {
  const nav = useNavigate();

  return (
    <Card span={6}>
      <CardHead
        kicker="RECENT"
        title="Recent meetings"
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              nav('/sessions');
            }}
          >
            All
          </Button>
        }
      />

      {loading && <SkeletonLines count={5} />}
      {!loading && error && <EmptyState title="Couldn’t load" body={error} />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState
          title="No meetings yet"
          body="Record your first meeting to start building memory."
          cta={
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                nav('/bot');
              }}
            >
              Add a meeting
            </Button>
          }
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {data.slice(0, 5).map((s) => (
            <li key={s.id}>
              <button
                onClick={() => {
                  nav(`/analysis/${s.id}`);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: R.md,
                  background: 'transparent',
                  border: `1px solid ${T.border}`,
                  textAlign: 'left',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.t1, fontWeight: 500 }}>
                    {s.persona_id ? capitalize(s.persona_id) : 'Meeting'}
                  </div>
                  <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>
                    {fmtDate(s.created_at)} · {s.mode ?? 'cold_call'}
                  </div>
                </div>
                {typeof s.score === 'number' ? (
                  <Num style={{ fontSize: 15, color: scoreColor(s.score), fontWeight: 500 }}>
                    {s.score}
                  </Num>
                ) : (
                  <span style={{ fontSize: 11, color: T.t3 }}>{s.status}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
