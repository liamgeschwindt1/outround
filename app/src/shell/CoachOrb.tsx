import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';
import type { SessionStats, MeetingsResponse } from '../api/types';

// ─── Canvas orb (matches website OrbCanvas exactly) ──────────────────────────

function OrbCanvas({ size }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${String(size)}px`;
    canvas.style.height = `${String(size)}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const sphereR = size / 2 - 14;
    const DOT_COUNT = 560;

    const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / (DOT_COUNT - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = golden * i;
      return {
        nx: Math.cos(theta) * radius,
        ny: y,
        nz: Math.sin(theta) * radius,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.0003 + Math.random() * 0.0004,
        driftAmp: 0.008 + Math.random() * 0.012,
      };
    });

    let startTime: number | null = null;

    function draw(ts: number) {
      startTime ??= ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, size, size);

      const gradT = (Math.sin((elapsed / 8000) * Math.PI * 2) + 1) / 2;
      const cr = String(Math.round(242 - (242 - 75) * gradT));
      const cg = String(Math.round(107 - (107 - 163) * gradT));
      const cb = String(Math.round(69 - (69 - 227) * gradT));

      const rotY = elapsed * 0.00022;
      const rotX = elapsed * 0.00009;
      const cosY = Math.cos(rotY),
        sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX),
        sinX = Math.sin(rotX);

      // Inner radial glow
      const glow = ctx.createRadialGradient(cx, cy, sphereR * 0.15, cx, cy, sphereR * 1.05);
      glow.addColorStop(0, `rgba(${cr},${cg},${cb},0.22)`);
      glow.addColorStop(0.55, `rgba(${cr},${cg},${cb},0.06)`);
      glow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Outer pulse rings
      const pulseT = (Math.sin((elapsed / 3000) * Math.PI * 2) + 1) / 2;
      const pulseT2 = (Math.sin((elapsed / 3000) * Math.PI * 2 + Math.PI) + 1) / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1 + 0.05 * pulseT, 1 + 0.05 * pulseT);
      ctx.beginPath();
      ctx.arc(0, 0, sphereR + 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${String(0.18 - 0.1 * pulseT)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1 + 0.1 * pulseT2, 1 + 0.1 * pulseT2);
      ctx.beginPath();
      ctx.arc(0, 0, sphereR + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${String(0.1 - 0.07 * pulseT2)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Project and sort dots by depth
      const projected = dots.map((d) => {
        const drift = Math.sin(elapsed * d.driftSpeed + d.phase) * d.driftAmp;
        let nx = d.nx + drift;
        let ny = d.ny + Math.cos(elapsed * d.driftSpeed + d.phase) * d.driftAmp * 0.5;
        let nz = d.nz;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len;
        ny /= len;
        nz /= len;

        const x1 = nx * cosY + nz * sinY;
        const z1 = -nx * sinY + nz * cosY;
        const y2 = ny * cosX - z1 * sinX;
        const z2 = ny * sinX + z1 * cosX;

        return { sx: cx + x1 * sphereR, sy: cy + y2 * sphereR, depth: (z2 + 1) / 2 };
      });

      projected.sort((a, b) => a.depth - b.depth);
      projected.forEach(({ sx, sy, depth }) => {
        const r = 0.5 + Math.pow(depth, 1.6) * 2.2;
        const alpha = 0.05 + Math.pow(depth, 1.4) * 0.85;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${String(alpha)})`;
        ctx.fill();
        if (depth > 0.82) {
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,238,228,${String((depth - 0.82) * 2.2)})`;
          ctx.fill();
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        filter:
          'drop-shadow(0 0 28px rgba(242,107,69,0.35)) drop-shadow(0 0 60px rgba(75,163,227,0.18))',
      }}
    />
  );
}

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

  return (
    <>
      {/* Orb button */}
      <button
        onClick={() => {
          setOpen((o) => !o);
        }}
        title="Intelligence"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          padding: 0,
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <OrbCanvas size={40} />
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
                padding: '16px 16px 14px',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <OrbCanvas size={48} />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>Intelligence</span>
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
