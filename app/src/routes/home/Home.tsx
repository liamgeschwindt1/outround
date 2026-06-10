import { useNavigate } from 'react-router-dom';
import { T, R, scoreColor } from '../../design/tokens';
import { Card, CardHead } from '../../design/primitives/Card';
import { Num } from '../../design/primitives/Text';
import { useDashboardData } from '../../hooks/useDashboardData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Kicker({ children }: { children: string }) {
  return (
    <div
      style={{
        fontFamily: T.mono,
        fontSize: 10,
        letterSpacing: 0.6,
        color: T.t3,
        marginBottom: 6,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function GetReadyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginTop: 10,
        padding: '7px 14px',
        background: T.grad,
        border: 'none',
        borderRadius: R.md,
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Get ready →
    </button>
  );
}

function MiniBar({ value, color }: { value: number; color?: string }) {
  return (
    <div style={{ height: 3, width: '100%', background: T.bgHover, borderRadius: 2 }}>
      <div
        style={{
          height: '100%',
          width: `${String(Math.min(value, 100))}%`,
          background: color ?? T.grad,
          borderRadius: 2,
          transition: 'width 600ms ease',
        }}
      />
    </div>
  );
}

function Delta({ v }: { v: number }) {
  return (
    <span style={{ fontSize: 11, color: v >= 0 ? T.green : T.red, fontWeight: 600 }}>
      {v >= 0 ? `↑ +${String(v)}` : `↓ ${String(v)}`}
    </span>
  );
}

// ─── Seeded data (used when real data is empty/loading) ───────────────────────

const SEED_MEETINGS = [
  {
    id: '1',
    title: 'Acme Corp · CFO discovery',
    starts_at: new Date(Date.now() + 12 * 60000).toISOString(),
  },
  {
    id: '2',
    title: 'Series A pitch · Volta Capital',
    starts_at: new Date(Date.now() + 4 * 3600000).toISOString(),
  },
];

const SEED_HISTORY = [
  {
    id: '1',
    score: 67,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    persona_name: 'Hendrik',
    mode: 'Cold Call',
    summary: 'You handed him an exit at 0:47',
  },
];

function fmtRelative(isoStr: string): string {
  const diff = new Date(isoStr).getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${String(mins)} min`;
  const hrs = Math.round(diff / 3600000);
  return `in ${String(hrs)}h`;
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const nav = useNavigate();
  const { stats, meetings, history } = useDashboardData();

  // Resolve data with seeds
  const score = stats.data?.avg_score ? Math.round(stats.data.avg_score) : 67;
  const scoreDelta = 4;
  const elo = 1847;
  const eloDelta = 23;
  const streak = stats.data?.current_streak ?? 4;
  const totalRounds = stats.data?.total_sessions ?? 23;
  const usageMin = 67;
  const usageMax = 150;
  const upcomingMeetings = (
    meetings.data?.meetings.length ? meetings.data.meetings : SEED_MEETINGS
  ) as { id: string; title: string; starts_at: string }[];
  const lastRound = (
    history.data?.sessions.length ? history.data.sessions[0] : SEED_HISTORY[0]
  ) as {
    id: string;
    score: number;
    created_at: string;
    persona_name?: string;
    mode?: string;
    summary?: string;
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 14,
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {/* ── Row 1: 3 stat cards ── */}

        {/* TODAY'S BRIEF */}
        <Card
          span={4}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <Kicker>Today&apos;s Brief</Kicker>
            <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.5 }}>
              {upcomingMeetings.length > 0 ? (
                <>
                  <span style={{ color: T.t1, fontWeight: 600 }}>
                    {upcomingMeetings[0].title.split('·')[0].trim()}
                  </span>
                  <br />
                  {fmtRelative(upcomingMeetings[0].starts_at)}
                </>
              ) : (
                'No meetings today. Run a round anyway.'
              )}
            </div>
          </div>
          <GetReadyBtn
            onClick={() => {
              nav('/round');
            }}
          />
        </Card>

        {/* READINESS SCORE */}
        <Card span={4}>
          <Kicker>Readiness</Kicker>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <Num style={{ fontSize: 52, fontWeight: 500, lineHeight: 1, color: scoreColor(score) }}>
              {score}
            </Num>
            <span style={{ fontSize: 14, color: T.t3 }}>/100</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MiniBar value={score} color={scoreColor(score)} />
            <Delta v={scoreDelta} />
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>this week</div>
        </Card>

        {/* YOUR ELO */}
        <Card span={4}>
          <Kicker>Your ELO</Kicker>
          <Num
            style={{
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1,
              background: T.grad,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'block',
            }}
          >
            {elo.toLocaleString()}
          </Num>
          <div style={{ fontSize: 13, color: T.t2, marginTop: 6 }}>
            Elite · <Delta v={eloDelta} />
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 4 }}>Top 8%</div>
        </Card>

        {/* ── Row 2-3: Meetings left, Usage+Stats right ── */}

        {/* UPCOMING MEETINGS */}
        <Card span={8} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <CardHead
            kicker="Upcoming Meetings"
            title=""
            right={
              <span style={{ fontSize: 12, color: T.t3 }}>{upcomingMeetings.length} today</span>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingMeetings.slice(0, 3).map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: T.bgElevate,
                  borderRadius: R.md,
                  border: `1px solid ${T.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>
                    {fmtRelative(m.starts_at)}
                  </div>
                </div>
                <GetReadyBtn
                  onClick={() => {
                    nav('/round');
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* USAGE */}
        <Card span={4} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Kicker>Usage</Kicker>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <Num style={{ fontSize: 28, fontWeight: 600, color: T.t1 }}>{usageMin}</Num>
              <span style={{ fontSize: 13, color: T.t3 }}>/ {usageMax} min</span>
            </div>
            <MiniBar value={(usageMin / usageMax) * 100} />
            <button
              onClick={() => {
                nav('/settings/billing');
              }}
              style={{
                marginTop: 8,
                padding: '5px 10px',
                background: 'transparent',
                border: `1px solid ${T.borderMd}`,
                borderRadius: R.md,
                color: T.t2,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Upgrade
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <Kicker>This Week</Kicker>
            <div style={{ fontSize: 28, fontWeight: 600, color: T.t1, fontFamily: T.numeric }}>
              {Math.min(totalRounds, 5)} rounds
            </div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>🔥 {streak} day streak</div>
          </div>
        </Card>

        {/* ── Row 3: Last round + Quick challenge ── */}

        {/* LAST ROUND */}
        <Card span={6}>
          <Kicker>Last Round</Kicker>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: T.t2, marginBottom: 6 }}>
                {lastRound.persona_name ?? 'Hendrik'} · {lastRound.mode ?? 'Cold Call'}
              </div>
              {lastRound.summary && (
                <div
                  style={{
                    fontSize: 12,
                    color: T.t3,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    maxWidth: 280,
                  }}
                >
                  &quot;{lastRound.summary}&quot;
                </div>
              )}
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    nav('/round');
                  }}
                  style={{
                    padding: '7px 14px',
                    background: T.bgHover,
                    border: `1px solid ${T.borderMd}`,
                    borderRadius: R.md,
                    color: T.t1,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Go again
                </button>
                {lastRound.id && (
                  <button
                    onClick={() => {
                      nav(`/analysis/${lastRound.id}`);
                    }}
                    style={{
                      padding: '7px 14px',
                      background: 'transparent',
                      border: `1px solid ${T.border}`,
                      borderRadius: R.md,
                      color: T.t2,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    View report
                  </button>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <Num
                style={{
                  fontSize: 48,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: scoreColor(lastRound.score),
                }}
              >
                {lastRound.score}
              </Num>
              <div style={{ fontSize: 11, color: T.t3 }}>/100</div>
            </div>
          </div>
        </Card>

        {/* QUICK CHALLENGE */}
        <Card
          span={6}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <Kicker>Quick Challenge</Kicker>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: T.t1,
                lineHeight: 1.4,
                marginBottom: 6,
              }}
            >
              Beat your last score against Hendrik
            </div>
            <div style={{ fontSize: 12, color: T.t3 }}>
              Current best: <span style={{ color: T.t1, fontWeight: 600 }}>{lastRound.score}</span>{' '}
              / 100
            </div>
          </div>
          <GetReadyBtn
            onClick={() => {
              nav('/round');
            }}
          />
        </Card>
      </div>
    </div>
  );
}
