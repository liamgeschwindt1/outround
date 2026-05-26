import { Card, CardHead } from '../../../design/primitives/Card';
import { Tag } from '../../../design/primitives/Text';
import { SkeletonLines, EmptyState } from '../../../design/primitives/Skeleton';
import { Button } from '../../../design/primitives/Button';
import { T, R } from '../../../design/tokens';
import type { MeetingsResponse } from '../../../api/types';

interface Props {
  data: MeetingsResponse | null;
  loading: boolean;
  error: string | null;
}

export function MeetingsScrollerCard({ data, loading, error }: Props) {
  return (
    <Card span={8}>
      <CardHead
        kicker="NEXT UP"
        title="Upcoming meetings"
        right={
          data?.connected && (
            <Tag kind={data.bot_configured ? 'good' : 'neutral'}>
              {data.bot_configured ? 'BOT READY' : 'BOT OFF'}
            </Tag>
          )
        }
      />

      {loading && <SkeletonLines count={2} />}

      {!loading && error && (
        <EmptyState title="Couldn’t load meetings" body={error} />
      )}

      {!loading && !error && data && !data.connected && (
        <EmptyState
          title="Calendar not connected"
          body="Sync Google Calendar to see your next round."
          cta={
            <Button variant="primary" size="md" onClick={() => { window.location.href = '/auth/gcal'; }}>
              Connect calendar
            </Button>
          }
        />
      )}

      {!loading && !error && data?.connected && data.meetings.length === 0 && (
        <EmptyState
          title="Nothing on deck"
          body="When you book your next call, it shows up here."
        />
      )}

      {!loading && !error && data?.connected && data.meetings.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollSnapType: 'x mandatory',
          }}
        >
          {data.meetings.map((m) => (
            <MeetingTile key={m.id} m={m} />
          ))}
        </div>
      )}
    </Card>
  );
}

function MeetingTile({ m }: { m: MeetingsResponse['meetings'][number] }) {
  const start = new Date(m.starts_at);
  const time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const day = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <a
      href={`/meeting/${m.id}`}
      style={{
        flex: '0 0 240px',
        scrollSnapAlign: 'start',
        background: T.bgSub,
        border: `1px solid ${T.border}`,
        borderRadius: R.lg,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, letterSpacing: 0.5 }}>
          {day.toUpperCase()}
        </div>
        {m.outround_done && <Tag kind="good">READIED</Tag>}
      </div>
      <div
        style={{
          fontFamily: T.display,
          fontWeight: 600,
          fontSize: 14,
          color: T.t1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {m.title}
      </div>
      {m.prospect.company && (
        <div style={{ fontSize: 12, color: T.t2 }}>{m.prospect.company}</div>
      )}
      <div style={{ fontFamily: T.numeric, fontSize: 12, color: T.t2, marginTop: 'auto' }}>
        {time}
      </div>
    </a>
  );
}
