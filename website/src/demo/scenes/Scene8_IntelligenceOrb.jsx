import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { orbAnswers, QUESTIONS, ORBIT_CONFIG } from '../data/orbQuestions';
import EUBadge from '../components/EUBadge';
import AnswerCard from '../components/AnswerCard';

// ─── Orb Canvas ───────────────────────────────────────────────────────────────

function OrbCanvas({ size, flash, pulse }) {
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
    const r = size / 2 - 4;

    // Particles
    const particles = Array.from({ length: 40 }, (_, i) => ({
      angle: (i / 40) * Math.PI * 2,
      radius: 110 + Math.random() * 30,
      speed: (0.0002 + Math.random() * 0.0003) * (Math.random() > 0.5 ? 1 : -1),
      size: 1 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.4,
    }));

    let startTime = null;
    let glowPhase = 0; // 0=coral, 1=sky

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      ctx.clearRect(0, 0, size, size);

      // Gradient cycle: coral→sky over 8s
      const gradT = (Math.sin((elapsed / 8000) * Math.PI * 2) + 1) / 2;
      const r1 = Math.round(242 - (242 - 75) * gradT);
      const g1 = Math.round(107 - (107 - 163) * gradT);
      const b1 = Math.round(69  - (69  - 227) * gradT);

      // Core radial gradient
      const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(${r1},${g1},${b1},0.35)`);
      grad.addColorStop(0.5, `rgba(${r1},${g1},${b1},0.15)`);
      grad.addColorStop(1, `rgba(10,10,11,0.6)`);

      // Pulse ring scale
      const pulseT = (Math.sin((elapsed / 3000) * Math.PI * 2) + 1) / 2;
      const pScale = 1 + 0.08 * pulseT;

      // Draw outer pulse ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pScale, pScale);
      ctx.translate(-cx, -cy);
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r1},${g1},${b1},0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Gradient border ring
      const borderGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      borderGrad.addColorStop(0, 'rgba(242,107,69,0.8)');
      borderGrad.addColorStop(1, 'rgba(75,163,227,0.8)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Core fill
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Depth: centre lighter
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.6);
      centerGrad.addColorStop(0, `rgba(${r1},${g1},${b1},0.12)`);
      centerGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // Particles
      particles.forEach(p => {
        p.angle += p.speed * (ts - startTime > 0 ? 1 : 0);
        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r1},${g1},${b1},${p.opacity})`;
        ctx.fill();
      });

      // Flash overlay
      if (flash > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.3})`;
        ctx.fill();
      }

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
        borderRadius: '50%',
        filter: 'drop-shadow(0 0 24px rgba(242,107,69,0.3))',
      }}
    />
  );
}

// ─── Orbit Satellite ─────────────────────────────────────────────────────────

function OrbitCard({ question, config, onSelect, answered, idx }) {
  const { radius, duration, startDeg } = config;
  const [paused, setPaused] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 180,
        height: 0,
        // Use CSS custom properties for orbit keyframe
        '--orbit-radius': `${radius}px`,
        '--orbit-start': `${startDeg}deg`,
        animation: paused ? 'none' : `orbit ${duration}s linear infinite`,
        pointerEvents: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, delay: idx * 0.1 }}
        onClick={e => { e.stopPropagation(); onSelect(question); }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        whileHover={{ scale: 1.05 }}
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          width: 180,
          background: 'var(--bg-card)',
          border: `0.5px solid rgba(242,107,69,${paused ? 0.8 : 0.4})`,
          borderRadius: 8,
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: 'var(--font-body)',
          color: 'var(--text-sub)',
          lineHeight: 1.4,
          textAlign: 'center',
          boxShadow: paused ? '0 4px 20px rgba(242,107,69,0.15)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: answered ? 0.5 : 1,
        }}
      >
        {question}
      </motion.div>
    </div>
  );
}

// ─── Final Frame ─────────────────────────────────────────────────────────────

const LINES = [
  'Zero CRM admin.',
  'Know your clients.',
  'Improve your reps.',
  'Always prepared.',
  'Close more deals.',
];

function FinalFrame() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 20,
        }}
      >
        Outround
      </motion.div>

      {/* Orb placeholder (keeps breathing) */}
      <div style={{ height: 216, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <OrbCanvas size={200} flash={0} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        {LINES.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.3 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: 'var(--text-sub)',
            }}
          >
            {line}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + LINES.length * 0.3 + 0.4 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--coral)',
            marginTop: 6,
          }}
        >
          What goes out comes back round.
        </motion.div>
        <motion.a
          href="mailto:liam@outround.io"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.4 + LINES.length * 0.3 + 1 }}
          onClick={e => e.stopPropagation()}
          whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(242,107,69,0.4)' }}
          style={{
            display: 'inline-block',
            marginTop: 16,
            background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
            color: '#0a0a0b',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 700,
            padding: '14px 32px',
            borderRadius: 999,
            textDecoration: 'none',
            boxShadow: '0 0 24px rgba(242,107,69,0.3)',
            minHeight: 44,
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
          Get early access →
        </motion.a>
      </div>
    </motion.div>
  );
}

// ─── Scene 8 ─────────────────────────────────────────────────────────────────

export default function Scene8_IntelligenceOrb({ isActive, sound, dotGridRef }) {
  const [phase, setPhase] = useState('forming'); // forming | active | final
  const [orbFormed, setOrbFormed] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [selectedQ, setSelectedQ] = useState(null);
  const [answeredQ, setAnsweredQ] = useState(new Set());
  const [flashVal, setFlashVal] = useState(0);
  const [orbPulse, setOrbPulse] = useState(false);
  const orbSize = window.innerWidth < 640 ? 140 : 200;

  useEffect(() => {
    if (!isActive) {
      setPhase('forming');
      setOrbFormed(false);
      setShowBadge(false);
      setSelectedQ(null);
      setAnsweredQ(new Set());
      return;
    }

    // Trigger dot grid orb pull
    setTimeout(() => dotGridRef?.current?.triggerOrbPull(), 200);

    // Form orb after 800ms
    const t1 = setTimeout(() => {
      setOrbFormed(true);
      sound.play('orb');
    }, 800);

    // Show badge after orb + 800ms
    const t2 = setTimeout(() => setShowBadge(true), 1600);

    // Show satellites after badge
    const t3 = setTimeout(() => setPhase('active'), 2000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isActive]);

  const handleSelectQ = useCallback((q) => {
    setSelectedQ(q);
    setAnsweredQ(prev => new Set([...prev, q]));
    sound.play('notification');

    // Flash
    setFlashVal(1);
    setTimeout(() => setFlashVal(0), 100);

    // Pulse ring
    setOrbPulse(true);
    setTimeout(() => setOrbPulse(false), 400);
  }, [sound]);

  const handleBlankClick = useCallback((e) => {
    e.stopPropagation();
    if (phase === 'active' && answeredQ.size > 0) {
      setPhase('final');
    }
  }, [phase, answeredQ]);

  if (phase === 'final') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={e => e.stopPropagation()}>
        <FinalFrame />
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      onClick={handleBlankClick}
    >
      {/* Central orb area */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          zIndex: 5,
        }}
      >
        <AnimatePresence>
          {orbFormed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: orbPulse ? 1.08 : 1, opacity: 1 }}
              transition={orbPulse
                ? { type: 'spring', stiffness: 400, damping: 20 }
                : { type: 'spring', stiffness: 200, damping: 22 }
              }
            >
              <OrbCanvas size={orbSize} flash={flashVal} />
            </motion.div>
          )}
        </AnimatePresence>

        {showBadge && <EUBadge />}

        {/* Answer card */}
        <AnimatePresence mode="wait">
          {selectedQ && (
            <AnswerCard
              key={selectedQ}
              question={selectedQ}
              answer={orbAnswers[selectedQ].answer}
              source={orbAnswers[selectedQ].source}
            />
          )}
        </AnimatePresence>

        {/* Hint */}
        {phase === 'active' && answeredQ.size > 0 && !selectedQ && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              marginTop: 8,
            }}
          >
            Click anywhere to continue →
          </motion.div>
        )}
      </div>

      {/* Orbit satellites */}
      <AnimatePresence>
        {phase === 'active' && (
          <div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {QUESTIONS.map((q, i) => {
              const answered = answeredQ.has(q);
              const isSelected = selectedQ === q;
              return !isSelected ? (
                <OrbitCard
                  key={q}
                  question={q}
                  config={ORBIT_CONFIG[i]}
                  onSelect={handleSelectQ}
                  answered={answered}
                  idx={i}
                />
              ) : null;
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
