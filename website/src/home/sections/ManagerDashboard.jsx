import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Radar canvas ─────────────────────────────────────────────────────────────

const AXES = ['Discovery', 'Objection\nHandling', 'Pricing', 'Closing', 'Talk\nRatio', 'Follow-up'];
const N = AXES.length;
const MAX = 10;

function toXY(angle, r, cx, cy) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  };
}

function RepRadarCanvas({ scores, strokeColor, size = 200, animated = true }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.35;
    const labelR = size * 0.46;

    let progress = animated ? 0 : 1;
    const startTime = performance.now();
    const duration = 900;

    function draw(p) {
      ctx.clearRect(0, 0, size, size);

      // Background rings
      for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * maxR;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const angle = (i / N) * Math.PI * 2;
          const pt = toXY(angle, r, cx, cy);
          i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(242,241,239,0.07)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Axis lines
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const pt = toXY(angle, maxR, cx, cy);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = 'rgba(242,241,239,0.09)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Score polygon
      const pts = scores.map((s, i) => {
        const angle = (i / N) * Math.PI * 2;
        const r = (s / MAX) * maxR * p;
        return toXY(angle, r, cx, cy);
      });

      // Fill (semi-transparent)
      ctx.beginPath();
      pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
      ctx.closePath();
      ctx.fillStyle = strokeColor.replace(')', ', 0.15)').replace('rgb(', 'rgba(') || 'rgba(242,107,69,0.15)';
      // Simpler: use a fixed alpha overlay based on the first stop colour
      ctx.fillStyle = 'rgba(242,107,69,0.14)';
      ctx.fill();

      // Stroke
      ctx.beginPath();
      pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dots
      pts.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
      });

      // Labels
      ctx.save();
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const pt = toXY(angle, labelR, cx, cy);
        const lines = AXES[i].split('\n');
        ctx.font = `500 8px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(242,241,239,0.35)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, li) => {
          ctx.fillText(line.toUpperCase(), pt.x, pt.y + (li - (lines.length - 1) / 2) * 11);
        });
      }
      ctx.restore();
    }

    if (!animated) {
      draw(1);
      return;
    }

    function frame(ts) {
      const p = Math.min(1 - Math.pow(1 - Math.min((ts - startTime) / duration, 1), 3), 1);
      draw(p);
      if (p < 1) animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [size, animated, scores, strokeColor]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Axes order: Discovery, Objection Handling, Pricing, Closing, Talk Ratio, Follow-up

const REPS = [
  {
    name: 'Daan',
    role: 'Account Executive',
    calls: 47,
    scores: [7.2, 6.1, 3.8, 7.5, 5.9, 8.1],
    strokeColor: '#4ba3e3',
    insight: 'Loses frame on pricing in 68% of deals',
    insightColor: 'var(--amber)',
  },
  {
    name: 'Jana',
    role: 'Account Executive',
    calls: 39,
    scores: [8.4, 7.2, 7.8, 6.9, 8.1, 6.3],
    strokeColor: '#f26b45',
    insight: 'Strong opener — discovery score 8.4/10',
    insightColor: 'var(--green)',
  },
  {
    name: 'Lotte',
    role: 'SDR',
    calls: 61,
    scores: [6.5, 5.8, 6.2, 5.1, 8.7, 6.8],
    strokeColor: '#a78bfa',
    insight: 'Talk ratio above team average on 80% of calls',
    insightColor: 'var(--coral)',
  },
];

// ─── Card ──────────────────────────────────────────────────────────────────────

function RepCard({ rep, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1], delay }}
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-md)',
        borderRadius: 12,
        padding: '20px 20px 18px',
        flex: '1 1 240px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Radar */}
      <div style={{ marginBottom: 12 }}>
        {isInView && (
          <RepRadarCanvas
            scores={rep.scores}
            strokeColor={rep.strokeColor}
            size={200}
            animated
          />
        )}
      </div>

      {/* Name + role */}
      <div style={{ textAlign: 'center', marginBottom: 8, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          {rep.name}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {rep.role}
        </div>
      </div>

      {/* Calls */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        {rep.calls} calls captured
      </div>

      {/* Insight */}
      <div style={{
        width: '100%',
        background: 'var(--bg)',
        border: '0.5px solid var(--border)',
        borderRadius: 6,
        padding: '8px 10px',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        color: rep.insightColor,
        lineHeight: 1.5,
        textAlign: 'center',
        marginBottom: 6,
      }}>
        {rep.insight}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', textAlign: 'center', opacity: 0.7 }}>
        sample · connect Outround for real data
      </div>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="team"
      ref={ref}
      style={{
        background: 'var(--bg-sub)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(64px, 10vw, 100px) 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 860 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
          Your team, visible for the first time
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 48 }}>
          Every rep. Every pattern. Every call.
        </div>

        {/* Demo disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(242,107,69,0.06)',
            border: '0.5px solid rgba(242,107,69,0.25)',
            borderRadius: 6,
            padding: '6px 12px',
            marginBottom: 28,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--coral)', opacity: 0.7, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            Sample data — integrate Outround to see your real team
          </span>
        </motion.div>

        {/* Rep cards — same level */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 24 }}>
          {REPS.map((rep, i) => (
            <RepCard key={rep.name} rep={rep} delay={i * 0.14} isInView={isInView} />
          ))}
        </div>

        {/* Callout stat + disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.48 }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 500, color: 'var(--text-sub)', marginBottom: 6 }}>
            Team close rate this week
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(52px, 8vw, 80px)',
              fontWeight: 800,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}>
              +12%
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px, 1.8vw, 17px)', color: 'var(--text-sub)', fontWeight: 400 }}>
              vs last week
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', fontStyle: 'italic' }}>
            Illustrative. Your numbers update automatically once connected.
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.62 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
            color: '#0a0a0b',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 700,
            padding: '14px 36px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 28px rgba(242,107,69,0.25)',
            minHeight: 44,
          }}
        >
          Get early access
        </motion.button>
      </div>
    </section>
  );
}

