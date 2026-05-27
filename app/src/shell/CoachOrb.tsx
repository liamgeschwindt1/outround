import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';
import type { SessionStats } from '../api/types';

// ─── Styles ───────────────────────────────────────────────────────────────────

const pulse = `
@keyframes orb-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240,90,50,0.4), 0 0 12px rgba(240,90,50,0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(240,90,50,0), 0 0 20px rgba(240,90,50,0.5); }
}
`;

// ─── Section helper ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', letterSpacing: 0.6, color: T.t3, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function CTA({ label, onClick, style }: { label: string; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '9px 12px',
        background: T.grad,
        border: 'none',
        borderRadius: R.md,
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'center',
        marginTop: 10,
        ...style,
      }}
    >
      {label} →
    </button>
  );
}

// ─── CoachOrb ─────────────────────────────────────────────────────────────────

export function CoachOrb() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { data: stats } = useApi<SessionStats>('/api/session/stats');

  const lastScore = stats?.avg_score ? Math.round(stats.avg_score) : 67;
  const streak = stats?.current_streak ?? 4;

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = pulse;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <>
      {/* Orb button */}
      <button
        onClick={() => setOpen(o => !o)}
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
        <span style={{ fontSize: 12, color: T.t3, marginLeft: 2 }}>{open ? '✕' : ''}</span>
      </button>

      {/* Slide-in panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 299 }}
          />
          {/* Panel */}
          <div
            style={{
              position: 'fixed',
              top: 52,
              right: 0,
              width: 320,
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
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.coral, animation: 'orb-pulse 2.4s ease-in-out infinite' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Coach</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: T.t3, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Insight */}
            <Section label="">
              <p style={{ fontSize: 13, color: T.t2, lineHeight: 1.6, margin: 0 }}>
                "Over your last 8 rounds, your opening hook went{' '}
                <span style={{ color: T.t1 }}>61 → 74</span>. Objection handling is flat.{' '}
                <span style={{ color: T.coral }}>That's what we work on next.</span>"
              </p>
            </Section>

            {/* Before your next call */}
            <Section label="BEFORE YOUR NEXT CALL">
              <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.5 }}>
                Hendrik is waiting.
              </div>
              <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
                Your last score: <span style={{ color: T.t1, fontWeight: 600 }}>{lastScore}</span>
              </div>
              <CTA label="Get ready" onClick={() => { nav('/round'); setOpen(false); }} />
            </Section>

            {/* Weak spot */}
            <Section label="YOUR WEAK SPOT THIS WEEK">
              <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.5 }}>
                Pace under objection
              </div>
              <div style={{ fontSize: 12, color: T.t3, marginTop: 4 }}>
                Flagged 6 of last 8 rounds
              </div>
              <CTA
                label="Run a focused round"
                onClick={() => { nav('/round?focus=pace'); setOpen(false); }}
                style={{ background: T.bgElevate, color: T.t1, border: `1px solid ${T.borderMd}` }}
              />
            </Section>

            {/* Streak */}
            <Section label="STREAK">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.t1 }}>{streak} days prepared</div>
                  <div style={{ fontSize: 12, color: T.t3 }}>Personal best: 12 days</div>
                </div>
              </div>
            </Section>
          </div>
        </>
      )}
    </>
  );
}
