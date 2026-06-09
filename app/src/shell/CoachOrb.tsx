import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';
import type { SessionStats, MeetingsResponse } from '../api/types';

const pulse = `
@keyframes orb-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240,90,50,0.4), 0 0 12px rgba(240,90,50,0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(240,90,50,0), 0 0 20px rgba(240,90,50,0.5); }
}
`;

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
      {label && (
        <div
          style={{
            fontSize: 10,
            fontFamily: T.mono,
            letterSpacing: 0.6,
            color: T.t3,
            marginBottom: 8,
          }}
        >
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

function GradientCTA({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: 1,
        background: `linear-gradient(135deg, ${T.coral}, ${T.sky})`,
        border: 'none',
        borderRadius: R.md,
        cursor: 'pointer',
        marginTop: 10,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          background: '#18181b',
          borderRadius: R.md - 1,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {label} →
      </span>
    </button>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
      }}
    >
      <span style={{ fontSize: 12, color: T.t3 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: T.t1, fontFamily: T.numeric }}>
        {value}
        {sub && (
          <span style={{ fontSize: 11, color: T.t2, fontWeight: 400, marginLeft: 4 }}>{sub}</span>
        )}
      </span>
    </div>
  );
}

function nextMeetingLabel(meetings: MeetingsResponse['meetings']): string | null {
  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.starts_at).getTime() > now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  if (!upcoming.length) return null;
  const m = upcoming[0];
  const diffMs = new Date(m.starts_at).getTime() - now;
  const diffMin = Math.round(diffMs / 60000);
  const name =
    m.prospect.name && m.prospect.name !== 'Unknown' ? m.prospect.name.split(' ')[0] : m.title;
  if (diffMin < 60) return `${name} · in ${String(diffMin)} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${name} · in ${String(diffH)}h`;
  const day = new Date(m.starts_at).toLocaleDateString([], { weekday: 'short' });
  return `${name} · ${day}`;
}

function weakSpot(stats: SessionStats | null): string {
  if (!stats || stats.total_sessions === 0) return 'Run a round to surface your weak spots.';
  const score = stats.avg_score ?? 0;
  if (score < 50) return 'Opening hook — gets you off the back foot fast.';
  if (score < 65) return 'Objection handling — flatlined across recent rounds.';
  if (score < 75) return 'Pace under objection — flagged in most recent rounds.';
  return 'Closing confidence — your biggest remaining lever.';
}

export function CoachOrb() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { data: stats } = useApi<SessionStats>('/api/session/stats');
  const { data: meetings } = useApi<MeetingsResponse>('/api/meetings/upcoming');

  const avgScore = stats?.avg_score ? Math.round(stats.avg_score) : null;
  const streak = stats?.current_streak ?? 0;
  const rounds = stats?.total_sessions ?? 0;
  const nextUp = meetings?.meetings ? nextMeetingLabel(meetings.meetings) : null;
  const weakspot = weakSpot(stats);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = pulse;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* Orb button */}
      <button
        onClick={() => {
          setOpen((o) => !o);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px 6px 8px',
          background: open ? T.bgElevate : 'rgba(240,90,50,0.08)',
          border: `1px solid ${open ? T.borderMd : 'rgba(240,90,50,0.3)'}`,
          borderRadius: R.pill,
          cursor: 'pointer',
          color: T.t1,
          transition: 'all 150ms',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: T.coral,
            animation: open ? 'none' : 'orb-pulse 2.4s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Coach</span>
        {open && <span style={{ fontSize: 12, color: T.t3, marginLeft: 2 }}>✕</span>}
      </button>

      {/* Slide-in panel */}
      {open && (
        <>
          <div
            onClick={() => {
              setOpen(false);
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 299 }}
          />
          <div
            style={{
              position: 'fixed',
              top: 52,
              right: 0,
              width: 300,
              bottom: 0,
              background: T.bgCard,
              borderLeft: `1px solid ${T.border}`,
              zIndex: 300,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: T.coral,
                    animation: 'orb-pulse 2.4s ease-in-out infinite',
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Coach</span>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: T.t3,
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Insight */}
            <Section label="">
              <p
                style={{
                  fontSize: 13,
                  color: T.t2,
                  lineHeight: 1.65,
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                {rounds === 0
                  ? '"Run your first round. I\'ll meet you on the other side with something useful."'
                  : avgScore && avgScore >= 75
                    ? `&quot;You&apos;re performing at ${String(avgScore)}. Stay sharp — every round without a challenge is a round going soft.&quot;`
                    : `"${weakspot.split('—')[0].trim()} is where you leave points. That's what we fix next."`}
              </p>
            </Section>

            {/* Your week */}
            <Section label="YOUR WEEK">
              <StatRow label="Rounds" value={rounds} />
              {streak > 0 && <StatRow label="Streak" value={`🔥 ${String(streak)}`} />}
              {avgScore !== null && <StatRow label="Avg score" value={avgScore} sub="/ 100" />}
              {stats?.best_score && <StatRow label="Best" value={stats.best_score} sub="/ 100" />}
              {rounds === 0 && (
                <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
                  One round and the numbers start.
                </div>
              )}
            </Section>

            {/* Weak spot */}
            <Section label="WEAK SPOT">
              <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.5 }}>{weakspot}</div>
              <GradientCTA
                label="Run a focused round"
                onClick={() => {
                  nav('/round');
                  setOpen(false);
                }}
              />
            </Section>

            {/* Next up */}
            {nextUp && (
              <Section label="NEXT UP">
                <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.5 }}>Meeting {nextUp}</div>
                <GradientCTA
                  label="Get ready"
                  onClick={() => {
                    nav('/');
                    setOpen(false);
                  }}
                />
              </Section>
            )}
          </div>
        </>
      )}
    </>
  );
}
