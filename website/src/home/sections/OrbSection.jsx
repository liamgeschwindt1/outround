import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnswerCard from '../../demo/components/AnswerCard';
import EUBadge from '../../demo/components/EUBadge';

// ─── Radar canvas (inline for rep modal) ──────────────────────────────────────

const RADAR_AXES = ['Discovery', 'Objection\nHandling', 'Pricing', 'Closing', 'Talk\nRatio', 'Follow-up'];
const RADAR_N = RADAR_AXES.length;
const RADAR_MAX = 10;

function toXY(angle, r, cx, cy) {
  return { x: cx + r * Math.cos(angle - Math.PI / 2), y: cy + r * Math.sin(angle - Math.PI / 2) };
}

function RepRadarCanvas({ scores, strokeColor, size = 180 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, maxR = size * 0.35, labelR = size * 0.46;
    const startTime = performance.now(); const duration = 900;
    function draw(p) {
      ctx.clearRect(0, 0, size, size);
      for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * maxR;
        ctx.beginPath();
        for (let i = 0; i < RADAR_N; i++) { const a = (i / RADAR_N) * Math.PI * 2; const pt = toXY(a, r, cx, cy); i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y); }
        ctx.closePath(); ctx.strokeStyle = 'rgba(242,241,239,0.07)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      for (let i = 0; i < RADAR_N; i++) { const a = (i / RADAR_N) * Math.PI * 2; const pt = toXY(a, maxR, cx, cy); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pt.x, pt.y); ctx.strokeStyle = 'rgba(242,241,239,0.09)'; ctx.lineWidth = 0.5; ctx.stroke(); }
      const pts = scores.map((s, i) => { const a = (i / RADAR_N) * Math.PI * 2; return toXY(a, (s / RADAR_MAX) * maxR * p, cx, cy); });
      ctx.beginPath(); pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)); ctx.closePath(); ctx.fillStyle = 'rgba(242,107,69,0.14)'; ctx.fill();
      ctx.beginPath(); pts.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)); ctx.closePath(); ctx.strokeStyle = strokeColor; ctx.lineWidth = 1.5; ctx.stroke();
      pts.forEach(pt => { ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = strokeColor; ctx.fill(); });
      ctx.save();
      for (let i = 0; i < RADAR_N; i++) { const a = (i / RADAR_N) * Math.PI * 2; const pt = toXY(a, labelR, cx, cy); const lines = RADAR_AXES[i].split('\n'); ctx.font = `500 8px "JetBrains Mono", monospace`; ctx.fillStyle = 'rgba(242,241,239,0.35)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; lines.forEach((line, li) => ctx.fillText(line.toUpperCase(), pt.x, pt.y + (li - (lines.length - 1) / 2) * 11)); }
      ctx.restore();
    }
    function frame(ts) { const p = Math.min(1 - Math.pow(1 - Math.min((ts - startTime) / duration, 1), 3), 1); draw(p); if (p < 1) animRef.current = requestAnimationFrame(frame); }
    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [size, scores, strokeColor]);
  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

const REPS = [
  { name: 'Daan',  role: 'Account Executive', calls: 47, scores: [7.2, 6.1, 3.8, 7.5, 5.9, 8.1], strokeColor: '#4ba3e3', insight: 'Loses frame on pricing in 68% of deals',        insightColor: '#f59e0b' },
  { name: 'Jana',  role: 'Account Executive', calls: 39, scores: [8.4, 7.2, 7.8, 6.9, 8.1, 6.3], strokeColor: '#f26b45', insight: 'Strong opener: discovery score 8.4/10',         insightColor: '#22c55e' },
  { name: 'Lotte', role: 'SDR',               calls: 61, scores: [6.5, 5.8, 6.2, 5.1, 8.7, 6.8], strokeColor: '#a78bfa', insight: 'Talk ratio above team average on 80% of calls', insightColor: '#f26b45' },
];

function RepCard({ rep }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-md)', borderRadius: 12, padding: '20px 20px 18px', flex: '1 1 220px', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: 12 }}><RepRadarCanvas scores={rep.scores} strokeColor={rep.strokeColor} size={180} /></div>
      <div style={{ textAlign: 'center', marginBottom: 8, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{rep.name}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{rep.role}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{rep.calls} calls captured</div>
      <div style={{ width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontFamily: 'var(--font-body)', fontSize: 12, color: rep.insightColor, lineHeight: 1.5, textAlign: 'center', marginBottom: 6 }}>{rep.insight}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em', textAlign: 'center', opacity: 0.7 }}>sample · connect Outround for real data</div>
    </div>
  );
}



function OrbCanvas({ size }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

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

    let startTime = null;

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, size, size);

      const gradT = (Math.sin((elapsed / 8000) * Math.PI * 2) + 1) / 2;
      const cr = Math.round(242 - (242 - 75) * gradT);
      const cg = Math.round(107 - (107 - 163) * gradT);
      const cb = Math.round(69 - (69 - 227) * gradT);

      const rotY = elapsed * 0.00022;
      const rotX = elapsed * 0.00009;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      // Inner radial glow (depth + presence)
      const glow = ctx.createRadialGradient(cx, cy, sphereR * 0.15, cx, cy, sphereR * 1.05);
      glow.addColorStop(0,   `rgba(${cr},${cg},${cb},0.22)`);
      glow.addColorStop(0.55,`rgba(${cr},${cg},${cb},0.06)`);
      glow.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Outer pulse rings (layered for depth)
      const pulseT = (Math.sin((elapsed / 3000) * Math.PI * 2) + 1) / 2;
      const pulseT2 = (Math.sin((elapsed / 3000) * Math.PI * 2 + Math.PI) + 1) / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1 + 0.05 * pulseT, 1 + 0.05 * pulseT);
      ctx.beginPath();
      ctx.arc(0, 0, sphereR + 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.18 - 0.10 * pulseT})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1 + 0.10 * pulseT2, 1 + 0.10 * pulseT2);
      ctx.beginPath();
      ctx.arc(0, 0, sphereR + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.10 - 0.07 * pulseT2})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Project and sort dots by depth
      const projected = dots.map(d => {
        const drift = Math.sin(elapsed * d.driftSpeed + d.phase) * d.driftAmp;
        let nx = d.nx + drift;
        let ny = d.ny + Math.cos(elapsed * d.driftSpeed + d.phase) * d.driftAmp * 0.5;
        let nz = d.nz;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;

        const x1 = nx * cosY + nz * sinY;
        const z1 = -nx * sinY + nz * cosY;
        const y2 = ny * cosX - z1 * sinX;
        const z2 = ny * sinX + z1 * cosX;

        return {
          sx: cx + x1 * sphereR,
          sy: cy + y2 * sphereR,
          depth: (z2 + 1) / 2,
        };
      });

      projected.sort((a, b) => a.depth - b.depth);
      projected.forEach(({ sx, sy, depth }) => {
        // Stronger depth: tiny + faint at back, big + bright at front
        const r = 0.5 + Math.pow(depth, 1.6) * 2.2;
        const alpha = 0.05 + Math.pow(depth, 1.4) * 0.85;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
        ctx.fill();
        // Specular highlight on closest dots
        if (depth > 0.82) {
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,238,228,${(depth - 0.82) * 2.2})`;
          ctx.fill();
        }
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        filter: 'drop-shadow(0 0 48px rgba(242,107,69,0.32)) drop-shadow(0 0 120px rgba(75,163,227,0.18))',
      }}
    />
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  'Why are we losing deals to Salesforce in Q4?',
  'Which rep struggles most on pricing?',
  'What do our best clients have in common?',
  'What did prospects say about onboarding last quarter?',
  'Where does the team stall most often?',
  "What changed in Jana's last three calls?",
];

const ANSWERS = {
  'Why are we losing deals to Salesforce in Q4?': {
    answer: '4 deals lost to Salesforce in the last 60 days. In 3 of those, implementation timeline came up before value was established. Your top performers address timeline at minute 8. Your team average is minute 23.',
    source: 'Based on 847 conversations · Updated 2 hours ago',
  },
  'Which rep struggles most on pricing?': {
    answer: 'Daan loses frame on pricing in 68% of his deals - the highest on the team. The pattern: he drops price before the prospect asks. Top performers wait for explicit pushback.',
    source: 'Based on 312 rep interactions · Updated 4 hours ago',
  },
  'What do our best clients have in common?': {
    answer: 'Your top 20% of clients by ACV share 3 signals: CTO involved in first 2 calls, implementation timeline discussed in meeting 1, and a prior failed vendor mentioned in discovery.',
    source: 'Based on 1,204 client interactions · Updated 1 day ago',
  },
  'What did prospects say about onboarding last quarter?': {
    answer: '"Implementation feels risky" appeared in 34 conversations last quarter. 8 of those became lost deals. It comes up when deployment timeline isn\'t addressed in the first meeting. Your top performers raise it proactively at minute 12.',
    source: 'Based on 312 conversations · Updated 5 hours ago',
  },
  'Where does the team stall most often?': {
    answer: '67% of stalled deals share one signal: no follow-up email within 24 hours of the call. Your top performers send a recap within 2 hours. Team average: 31 hours.',
    source: 'Based on 203 stalled deals · Updated 3 days ago',
  },
  "What changed in Jana's last three calls?": {
    answer: 'Tone shifted from evaluative to cautious. Budget mentioned 4 times across the last 3 calls vs 0 in her first 2. Salesforce came up in call 3 for the first time. Risk: deal may be stalling at procurement.',
    source: 'Based on 5 interactions with Jana Novak · Updated today',
  },
};

// Fixed positions: 3 left, 3 right
const CARD_POSITIONS = [
  { side: 'left',  top: '12%' },
  { side: 'left',  top: '42%' },
  { side: 'left',  top: '72%' },
  { side: 'right', top: '12%' },
  { side: 'right', top: '42%' },
  { side: 'right', top: '72%' },
];

function QuestionCard({ question, onSelect, answered, idx, isSelected }) {
  const pos = CARD_POSITIONS[idx];
  const isLeft = pos.side === 'left';
  const [hover, setHover] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, x: isLeft ? -12 : 12 }}
      animate={{ opacity: isSelected ? 0 : answered ? 0.35 : 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.07 }}
      onClick={e => { e.stopPropagation(); if (!answered && !isSelected) onSelect(question); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        top: pos.top,
        ...(isLeft ? { left: 0 } : { right: 0 }),
        width: 176,
        background: hover && !answered ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `0.5px solid ${hover && !answered ? 'rgba(242,107,69,0.7)' : 'rgba(242,107,69,0.3)'}`,
        borderRadius: 8,
        padding: '11px 14px',
        cursor: answered ? 'default' : 'pointer',
        fontSize: 12,
        fontFamily: 'var(--font-body)',
        color: hover && !answered ? 'var(--text-primary)' : 'var(--text-sub)',
        lineHeight: 1.45,
        textAlign: isLeft ? 'right' : 'left',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isLeft ? 'flex-end' : 'flex-start',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        userSelect: 'none',
      }}
    >
      {answered && (
        <span style={{
          color: 'var(--coral)',
          fontSize: 11,
          marginRight: isLeft ? 0 : 6,
          marginLeft: isLeft ? 6 : 0,
          order: isLeft ? 1 : -1,
          flexShrink: 0,
        }}>✓</span>
      )}
      {question}
    </motion.button>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function OrbSection() {
  const [selectedQ, setSelectedQ] = useState(null);
  const [answeredQ, setAnsweredQ] = useState(new Set());
  const [orbVisible, setOrbVisible] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [repModalOpen, setRepModalOpen] = useState(false);
  const ref = useRef(null);
  const orbSize = isNarrow ? 260 : 420;

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 720);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setOrbVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSelect = useCallback((q) => {
    setSelectedQ(q);
    setAnsweredQ(prev => new Set([...prev, q]));
  }, []);

  return (
    <section
      id="orb"
      ref={ref}
      style={{
        background: '#111114',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      {/* Corner metadata */}
      <div style={{
        width: '100%',
        maxWidth: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'clamp(40px, 5vw, 56px)',
        gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
          03 / THE INTELLIGENCE LAYER
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65,
          whiteSpace: 'nowrap',
        }}>
          {'/* powered by your own calls */'}
        </div>
      </div>

      {/* Eyebrow */}
      <div style={{ textAlign: 'center', marginBottom: 52, maxWidth: 720 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(13px, 1.4vw, 15px)',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          marginBottom: 18,
          letterSpacing: '0.01em',
        }}>
          This is what builds over time. Every call adds to it. It compounds. It&rsquo;s yours.
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4.4vw, 44px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          marginBottom: 14,
        }}>
          Ask your pipeline anything.
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Not a dashboard. A plain-language interface to everything your team has ever said. Click any question.
        </div>
      </div>

      {/* 3-col layout: left cards | orb | right cards */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 980,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 32,
      }}>
        {/* Left column */}
        <div style={{ position: 'relative', width: 176, flexShrink: 0, height: 460, display: isNarrow ? 'none' : 'block' }}>
          {orbVisible && QUESTIONS.slice(0, 3).map((q, i) => (
            <QuestionCard
              key={q}
              question={q}
              onSelect={handleSelect}
              answered={answeredQ.has(q)}
              idx={i}
              isSelected={selectedQ === q}
            />
          ))}
        </div>

        {/* Centre: orb + badge + answer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          flex: '0 0 auto',
        }}>
          <AnimatePresence>
            {orbVisible && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                <OrbCanvas size={orbSize} />
              </motion.div>
            )}
          </AnimatePresence>

          {orbVisible && <EUBadge />}

          <AnimatePresence mode="wait">
            {selectedQ && (
              <AnswerCard
                key={selectedQ}
                question={selectedQ}
                answer={ANSWERS[selectedQ].answer}
                source={ANSWERS[selectedQ].source}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Right column */}
        <div style={{ position: 'relative', width: 176, flexShrink: 0, height: 460, display: isNarrow ? 'none' : 'block' }}>
          {orbVisible && QUESTIONS.slice(3).map((q, i) => (
            <QuestionCard
              key={q}
              question={q}
              onSelect={handleSelect}
              answered={answeredQ.has(q)}
              idx={i + 3}
              isSelected={selectedQ === q}
            />
          ))}
        </div>
      </div>

      {/* Question grid (mobile fallback) */}
      <div style={{ width: '100%', maxWidth: 560, marginTop: 32, display: isNarrow ? 'block' : 'none' }}>
        {orbVisible && QUESTIONS.map((q, i) => (
          <motion.button
            key={q}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: answeredQ.has(q) ? 0.4 : 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => handleSelect(q)}
            style={{
              display: 'block',
              width: '100%',
              background: 'var(--bg-card)',
              border: '0.5px solid rgba(242,107,69,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 8,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-sub)',
              lineHeight: 1.4,
              minHeight: 44,
            }}
          >
            {answeredQ.has(q) && <span style={{ color: 'var(--coral)', marginRight: 8, fontSize: 11 }}>✓</span>}
            {q}
          </motion.button>
        ))}
      </div>

      {/* CTA + team metric */}
      {orbVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.6 }}
          style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRepModalOpen(true)}
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
            See rep profiles →
          </motion.button>

          {/* Sample data caption */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textAlign: 'center', opacity: 0.7 }}>
            Sample data. Connect Outround to see your real team.
          </div>

          {/* Team close rate metric */}
          <div style={{
            marginTop: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid var(--border)',
            borderRadius: 12,
            padding: '16px 24px',
            textAlign: 'center',
            minWidth: 220,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Team close rate this week
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--coral)', lineHeight: 1 }}>
              +12%
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              vs last week
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 8, opacity: 0.6, fontStyle: 'italic' }}>
              Illustrative. Based on sample data.
            </div>
          </div>
        </motion.div>
      )}

      {/* Rep profiles modal */}
      <AnimatePresence>
        {repModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setRepModalOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(10,10,11,0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000,
              padding: '24px 16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111114',
                border: '0.5px solid rgba(242,107,69,0.25)',
                borderRadius: 16,
                padding: 'clamp(20px, 3vw, 36px)',
                maxWidth: 860,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--coral)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Rep profiles
                </div>
                <button
                  onClick={() => setRepModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {REPS.map(rep => <RepCard key={rep.name} rep={rep} />)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
