import { T, R, scoreColor } from '../../design/tokens';
import { Card, CardHead } from '../../design/primitives/Card';
import { Num } from '../../design/primitives/Text';

// ─── Seeded data ──────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  {
    name: 'Sophie R.',
    role: 'VP Sales',
    elo: 1920,
    rounds: 8,
    weakSpot: 'Closing',
    lastRound: 'Today',
    score: 84,
  },
  {
    name: 'Marcus T.',
    role: 'AE',
    elo: 1847,
    rounds: 5,
    weakSpot: 'Pace',
    lastRound: 'Yesterday',
    score: 71,
  },
  {
    name: 'Lena K.',
    role: 'SDR',
    elo: 1654,
    rounds: 3,
    weakSpot: 'Objections',
    lastRound: '3d ago',
    score: 58,
  },
  {
    name: 'Dev',
    role: 'AE',
    elo: 1847,
    rounds: 5,
    weakSpot: 'Objections',
    lastRound: 'Today',
    score: 67,
    isYou: true,
  },
];

const HEATMAP_ITEMS = [
  { label: 'Objection handling', count: 8, total: 12 },
  { label: 'Pace under pressure', count: 6, total: 12 },
  { label: 'Talk ratio', count: 4, total: 12 },
  { label: 'Closing', count: 3, total: 12 },
];

// ─── Kicker ───────────────────────────────────────────────────────────────────

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

// ─── Team page ────────────────────────────────────────────────────────────────

export default function Team() {
  const avgScore = 74;
  const weekRounds = 47;
  const notPrepared = 3;

  return (
    <div>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14 }}>
          {/* ── Stat pills ── */}
          <Card span={4}>
            <Kicker>Team Ready</Kicker>
            <Num
              style={{
                fontSize: 44,
                fontWeight: 600,
                lineHeight: 1,
                color: scoreColor(avgScore),
                display: 'block',
              }}
            >
              {avgScore}
            </Num>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
              avg readiness · <span style={{ color: T.green }}>↑ 6 pts</span>
            </div>
          </Card>

          <Card span={4}>
            <Kicker>Rounds This Week</Kicker>
            <Num
              style={{
                fontSize: 44,
                fontWeight: 600,
                lineHeight: 1,
                color: T.t1,
                display: 'block',
              }}
            >
              {weekRounds}
            </Num>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>+12 vs last week</div>
          </Card>

          <Card
            span={4}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <Kicker>Not Prepared</Kicker>
              <Num
                style={{
                  fontSize: 44,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: T.amber,
                  display: 'block',
                }}
              >
                {notPrepared}
              </Num>
              <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
                reps haven&apos;t run a round this week
              </div>
            </div>
            <button
              style={{
                padding: '7px 12px',
                background: 'transparent',
                border: `1px solid ${T.borderMd}`,
                borderRadius: R.md,
                color: T.t2,
                fontSize: 12,
                cursor: 'pointer',
                marginTop: 8,
                textAlign: 'left',
              }}
            >
              Nudge all →
            </button>
          </Card>

          {/* ── Heatmap ── */}
          <Card span={12}>
            <CardHead kicker="Weak Spot Heatmap" title="" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HEATMAP_ITEMS.map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 13, color: T.t2, width: 200, flexShrink: 0 }}>
                    {item.label}
                  </span>
                  <div style={{ flex: 1, height: 6, background: T.bgHover, borderRadius: 3 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${String((item.count / item.total) * 100)}%`,
                        background:
                          item.count >= 7
                            ? `rgba(240,90,50,0.7)`
                            : item.count >= 5
                              ? `rgba(217,119,6,0.7)`
                              : `rgba(22,163,74,0.7)`,
                        borderRadius: 3,
                        transition: 'width 500ms ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: T.t3,
                      width: 70,
                      flexShrink: 0,
                      textAlign: 'right',
                    }}
                  >
                    {item.count}/{item.total} reps
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Member table ── */}
          <Card span={12}>
            <CardHead
              kicker="Team Members"
              title=""
              right={
                <button
                  style={{
                    padding: '6px 12px',
                    background: T.grad,
                    border: 'none',
                    borderRadius: R.md,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Invite
                </button>
              }
            />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Name', 'ELO', 'Rounds', 'Weak spot', 'Last ready'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '0 0 10px',
                        fontSize: 10,
                        fontFamily: T.mono,
                        color: T.t4,
                        letterSpacing: 0.5,
                        fontWeight: 400,
                        paddingRight: 16,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEAM_MEMBERS.map((m) => (
                  <tr
                    key={m.name}
                    style={{
                      borderTop: `1px solid ${T.border}`,
                      background: m.isYou ? `rgba(240,90,50,0.04)` : 'transparent',
                    }}
                  >
                    <td style={{ padding: '10px 16px 10px 0' }}>
                      <span style={{ color: T.t1, fontWeight: m.isYou ? 600 : 400 }}>{m.name}</span>
                      {m.isYou && (
                        <span style={{ fontSize: 10, color: T.coral, marginLeft: 6 }}>you</span>
                      )}
                      <div style={{ fontSize: 11, color: T.t3 }}>{m.role}</div>
                    </td>
                    <td style={{ padding: '10px 16px 10px 0', fontFamily: T.numeric, color: T.t2 }}>
                      {m.elo.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px 10px 0', color: T.t2 }}>{m.rounds}</td>
                    <td style={{ padding: '10px 16px 10px 0', color: T.amber, fontSize: 12 }}>
                      {m.weakSpot}
                    </td>
                    <td
                      style={{
                        padding: '10px 0',
                        color: m.lastRound === 'Today' ? T.green : T.t3,
                        fontSize: 12,
                      }}
                    >
                      {m.lastRound}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
