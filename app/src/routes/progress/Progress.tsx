import { useNavigate } from 'react-router-dom';
import { T, R, scoreColor } from '../../design/tokens';
import { Card, CardHead } from '../../design/primitives/Card';
import { Num } from '../../design/primitives/Text';
import { useApi } from '../../api/hooks';
import type { SessionStats, SessionHistoryItem } from '../../api/types';

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

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.t2 }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: T.numeric, color: scoreColor(score) }}>
          {score}
        </span>
      </div>
      <div style={{ height: 4, background: T.bgHover, borderRadius: 2 }}>
        <div
          style={{
            height: '100%',
            width: `${String(score)}%`,
            background: scoreColor(score),
            borderRadius: 2,
            transition: 'width 600ms ease',
          }}
        />
      </div>
    </div>
  );
}

// ─── Seeded data ──────────────────────────────────────────────────────────────

const SEED_SCORES = [
  58, 61, 60, 63, 65, 67, 64, 68, 71, 69, 72, 74, 71, 73, 67, 70, 72, 75, 73, 76,
];

const SEED_HISTORY: (SessionHistoryItem & { persona_name?: string })[] = [
  {
    id: '1',
    score: 67,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    persona_id: 'hendrik',
    persona_name: 'Hendrik',
    mode: 'Cold Call',
    duration_seconds: 187,
    status: 'completed',
  },
  {
    id: '2',
    score: 71,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    persona_id: 'natalie',
    persona_name: 'Natalie',
    mode: 'Discovery',
    duration_seconds: 203,
    status: 'completed',
  },
  {
    id: '3',
    score: 63,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    persona_id: 'hendrik',
    persona_name: 'Hendrik',
    mode: 'Cold Call',
    duration_seconds: 154,
    status: 'completed',
  },
  {
    id: '4',
    score: 70,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    persona_id: 'hendrik',
    persona_name: 'Hendrik',
    mode: 'Cold Call',
    duration_seconds: 211,
    status: 'completed',
  },
  {
    id: '5',
    score: 65,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    persona_id: 'hendrik',
    persona_name: 'Hendrik',
    mode: 'Cold Call',
    duration_seconds: 178,
    status: 'completed',
  },
];

const SUB_SCORES = [
  { label: 'Opening', score: 82 },
  { label: 'Objections', score: 58 },
  { label: 'Pace', score: 71 },
  { label: 'Talk ratio', score: 65 },
  { label: 'Closing', score: 74 },
];

const WEAK_SPOTS = [
  { label: 'Pace under objection', detail: 'Flagged 6 of last 8 rounds' },
  { label: 'Monologue too long', detail: '3 rounds this week' },
];

// ─── Tiny sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100 / (data.length - 1);
  const points = data.map((v, i) => `${String(i * w)},${String(100 - ((v - min) / range) * 80 - 10)}`).join(' ');
  return (
    <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" style={{ width: '100%', height: 80 }}>
      <polyline
        points={points}
        fill="none"
        stroke="url(#scoreGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f05a32" />
          <stop offset="100%" stopColor="#3d9fd4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Progress page ────────────────────────────────────────────────────────────

export default function Progress() {
  const nav = useNavigate();
  const { data: stats } = useApi<SessionStats>('/api/session/stats');
  const { data: historyRaw } = useApi<SessionHistoryItem[]>('/api/session/history');

  const totalRounds = stats?.total_sessions ?? 23;
  const elo = 1847;
  const streak = stats?.current_streak ?? 4;
  const history = (historyRaw?.length ? historyRaw : SEED_HISTORY) as (SessionHistoryItem & {
    persona_name?: string;
  })[];

  return (
    <div>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14 }}>
          {/* ── Row 1: Stat pills ── */}
          <Card span={4}>
            <Kicker>ELO Rating</Kicker>
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
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>Elite · Top 8%</div>
          </Card>

          <Card span={4}>
            <Kicker>Rounds</Kicker>
            <Num
              style={{
                fontSize: 44,
                fontWeight: 600,
                lineHeight: 1,
                color: T.t1,
                display: 'block',
              }}
            >
              {totalRounds}
            </Num>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>+5 this week</div>
          </Card>

          <Card span={4}>
            <Kicker>Streak</Kicker>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 32 }}>🔥</span>
              <Num
                style={{
                  fontSize: 44,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: T.t1,
                  display: 'block',
                }}
              >
                {streak}
              </Num>
            </div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>days · Personal best: 12</div>
          </Card>

          {/* ── Score trend ── */}
          <Card span={12}>
            <CardHead
              kicker="Score Trend"
              title=""
              right={<span style={{ fontSize: 12, color: T.t3 }}>last 30 days</span>}
            />
            <Sparkline data={SEED_SCORES} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: T.t4 }}>30d ago</span>
              <span style={{ fontSize: 11, color: T.t4 }}>today</span>
            </div>
          </Card>

          {/* ── Sub-scores ── */}
          <Card span={6}>
            <CardHead kicker="Sub-scores" title="" />
            {SUB_SCORES.map((d) => (
              <ScoreBar key={d.label} label={d.label} score={d.score} />
            ))}
          </Card>

          {/* ── Weak spots ── */}
          <Card span={6}>
            <CardHead kicker="Weak Spots" title="" />
            {WEAK_SPOTS.map((ws) => (
              <div
                key={ws.label}
                style={{
                  padding: '12px 14px',
                  background: `rgba(240,90,50,0.06)`,
                  border: `1px solid rgba(240,90,50,0.2)`,
                  borderRadius: R.md,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 13, color: T.t1, fontWeight: 600 }}>{ws.label}</div>
                <div style={{ fontSize: 12, color: T.t3, marginTop: 3 }}>{ws.detail}</div>
              </div>
            ))}
            <button
              onClick={() => {
                nav('/round');
              }}
              style={{
                marginTop: 4,
                padding: '8px 16px',
                background: T.grad,
                border: 'none',
                borderRadius: R.md,
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Run a targeted round →
            </button>
          </Card>

          {/* ── Round history ── */}
          <Card span={12}>
            <CardHead kicker="Round History" title="" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Date', 'Persona', 'Mode', 'Score', 'Delta'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '0 12px 10px 0',
                        fontSize: 10,
                        fontFamily: T.mono,
                        color: T.t4,
                        letterSpacing: 0.5,
                        fontWeight: 400,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => {
                  const prev = history[i + 1]?.score;
                  const delta = prev != null ? (row.score ?? 0) - prev : null;
                  return (
                    <tr
                      key={row.id}
                      style={{ borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}
                      onClick={() => {
                        nav(`/analysis/${row.id}`);
                      }}
                    >
                      <td style={{ padding: '10px 12px 10px 0', color: T.t3 }}>
                        {new Date(row.created_at).toLocaleDateString('en-GB', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: T.t1 }}>
                        {(row as { persona_name?: string }).persona_name ?? 'Hendrik'}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0', color: T.t2 }}>
                        {row.mode ?? 'Cold Call'}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <span
                          style={{
                            color: scoreColor(row.score ?? 0),
                            fontFamily: T.numeric,
                            fontWeight: 600,
                          }}
                        >
                          {row.score}
                        </span>
                      </td>
                      <td style={{ padding: '10px 0' }}>
                        {delta != null && (
                          <span style={{ color: delta >= 0 ? T.green : T.red, fontSize: 12 }}>
                            {delta >= 0 ? `↑ +${String(delta)}` : `↓ ${String(delta)}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
