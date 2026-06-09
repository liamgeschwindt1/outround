import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboardData';
import { T, R, scoreColor } from '../../design/tokens';
import { Button } from '../../design/primitives/Button';
import { SkeletonLines } from '../../design/primitives/Skeleton';
import type { UpcomingMeeting, SessionHistoryItem } from '../../api/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}
function minsUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      borderRadius: R.xl,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ fontSize: 10, fontFamily: T.mono, letterSpacing: 0.8, color: T.t3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || T.t1, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.t3 }}>{sub}</div>}
    </div>
  );
}

// ─── Next meeting card ────────────────────────────────────────────────────────

function NextMeetingCard({ meeting }: { meeting: UpcomingMeeting }) {
  const nav = useNavigate();
  const mins = minsUntil(meeting.starts_at);
  const isPast = mins < 0;
  const p = meeting.prospect;
  const inCrm = !!p.pipedrive_person_id;

  let timeLabel: string;
  if (!isPast && mins < 60) timeLabel = `In ${mins}m`;
  else if (!isPast && mins < 1440) timeLabel = `In ${Math.round(mins / 60)}h`;
  else timeLabel = fmtDateShort(meeting.starts_at);

  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.borderMd}`,
      borderRadius: R.xl,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: T.mono, letterSpacing: 0.8, color: T.t3, marginBottom: 6, textTransform: 'uppercase' }}>
            {isPast ? 'Last meeting' : 'Next meeting'}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.t1, lineHeight: 1.3 }}>{meeting.title}</div>
          {p.company && <div style={{ fontSize: 13, color: T.t2, marginTop: 2 }}>{p.company}</div>}
        </div>
        <div style={{
          fontSize: 12,
          fontFamily: T.mono,
          color: isPast ? T.t3 : mins < 60 ? T.coral : T.sky,
          fontWeight: 600,
          flexShrink: 0,
          marginLeft: 12,
        }}>
          {timeLabel}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.t3 }}>
          {fmtTime(meeting.starts_at)}
        </span>
        {inCrm ? (
          <span style={{
            fontSize: 9, fontFamily: T.mono, letterSpacing: 0.5, color: T.sky,
            background: 'rgba(61,159,212,0.1)', border: '1px solid rgba(61,159,212,0.25)',
            borderRadius: R.pill, padding: '2px 8px', textTransform: 'uppercase',
          }}>In CRM</span>
        ) : (
          <span style={{
            fontSize: 9, fontFamily: T.mono, letterSpacing: 0.5, color: T.t3,
            background: T.bgSub, border: `1px solid ${T.border}`,
            borderRadius: R.pill, padding: '2px 8px', textTransform: 'uppercase',
          }}>Not in CRM</span>
        )}
        {meeting.bot && (
          <span style={{
            fontSize: 9, fontFamily: T.mono, letterSpacing: 0.5,
            color: meeting.bot.status === 'done' ? T.green : T.sky,
            background: meeting.bot.status === 'done' ? 'rgba(22,163,74,0.1)' : 'rgba(61,159,212,0.1)',
            border: `1px solid ${meeting.bot.status === 'done' ? 'rgba(22,163,74,0.25)' : 'rgba(61,159,212,0.25)'}`,
            borderRadius: R.pill, padding: '2px 8px', textTransform: 'uppercase',
          }}>
            {meeting.bot.status === 'done' ? 'Recorded' : 'Notetaker on'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {meeting.id && (
          <Button variant="primary" size="sm" onClick={() => nav(`/meeting/${meeting.id}`)}>
            {isPast ? 'View details' : 'Get ready →'}
          </Button>
        )}
        {!isPast && (
          <Button variant="ghost" size="sm" onClick={() => nav('/round')}>
            Go a round
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Recent rounds row ───────────────────────────────────────────────────────

function RecentRounds({ history }: { history: SessionHistoryItem[] }) {
  const nav = useNavigate();
  const recent = history.slice(0, 5);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {recent.map(s => (
        <div
          key={s.id}
          onClick={() => nav(`/analysis/${s.id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: R.lg,
            cursor: 'pointer',
            transition: 'background 100ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = T.bgElevate)}
          onMouseLeave={e => (e.currentTarget.style.background = T.bgCard)}
        >
          <div style={{
            width: 36, height: 36, borderRadius: R.md,
            background: s.score != null ? `${scoreColor(s.score)}22` : T.bgSub,
            border: `1px solid ${s.score != null ? `${scoreColor(s.score)}44` : T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: s.score != null ? scoreColor(s.score) : T.t3,
            flexShrink: 0, fontVariantNumeric: 'tabular-nums',
          }}>
            {s.score ?? '—'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.t1, fontWeight: 500 }}>
              {s.persona_id ? s.persona_id.replace(/_/g, ' ') : 'Round'}
            </div>
            <div style={{ fontSize: 11, color: T.t3, fontFamily: T.mono }}>
              {new Date(s.created_at || s.started_at || '').toLocaleDateString([], { month: 'short', day: 'numeric' })}
              {s.duration_seconds && ` · ${Math.round(s.duration_seconds / 60)}m`}
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.t3 }}>→</div>
        </div>
      ))}
      {recent.length === 0 && (
        <div style={{ fontSize: 13, color: T.t3, padding: '12px 0' }}>No rounds yet.</div>
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const nav = useNavigate();
  const { meetings, stats, history } = useDashboardData();

  const allMeetings = meetings.data?.meetings ?? [];
  const now = new Date();
  const nextMeeting = allMeetings.find(m => new Date(m.starts_at) >= now)
    ?? allMeetings[allMeetings.length - 1] ?? null;

  const s = stats.data;
  const recentHistory = history.data?.sessions ?? [];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.t3, marginBottom: 4 }}>DASHBOARD</div>
          <h1 style={{ fontFamily: T.display, fontWeight: 600, fontSize: 24, letterSpacing: -0.5, margin: 0, color: T.t1 }}>
            Ready for today?
          </h1>
        </div>
        <Button variant="primary" size="md" onClick={() => nav('/round')}>
          Go a round →
        </Button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard
          label="Rounds"
          value={s?.total_sessions ?? '—'}
          sub="all time"
        />
        <StatCard
          label="Avg score"
          value={s?.avg_score != null ? `${s.avg_score}` : '—'}
          sub="last sessions"
          accent={s?.avg_score != null ? scoreColor(s.avg_score) : undefined}
        />
        <StatCard
          label="Best score"
          value={s?.best_score != null ? `${s.best_score}` : '—'}
          sub="/100"
          accent={s?.best_score != null ? scoreColor(s.best_score) : undefined}
        />
        <StatCard
          label="Streak"
          value={s?.current_streak ?? 0}
          sub="days in a row"
          accent={s?.current_streak ? T.coral : undefined}
        />
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Left — recent rounds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.t3, textTransform: 'uppercase' }}>
              Recent rounds
            </div>
            <Button variant="ghost" size="sm" onClick={() => nav('/round')}>New round</Button>
          </div>
          {history.loading ? (
            <SkeletonLines count={4} />
          ) : (
            <RecentRounds history={recentHistory} />
          )}
        </div>

        {/* Right — next meeting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.8, color: T.t3, textTransform: 'uppercase' }}>
            Upcoming
          </div>
          {meetings.loading ? (
            <SkeletonLines count={4} />
          ) : nextMeeting ? (
            <NextMeetingCard meeting={nextMeeting} />
          ) : (
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: '18px 20px',
              fontSize: 13, color: T.t3,
            }}>
              {meetings.data?.connected === false
                ? 'Connect Google Calendar to see upcoming meetings.'
                : 'No upcoming meetings.'}
            </div>
          )}

          {/* More meetings link */}
          {allMeetings.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => nav('/meetings')} style={{ alignSelf: 'flex-start' }}>
              View all meetings →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

