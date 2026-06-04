import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { orbAnswers, QUESTIONS } from '../data/orbQuestions';
import EUBadge from '../components/EUBadge';
import AnswerCard from '../components/AnswerCard';

// ─── Orb Canvas — dot sphere ─────────────────────────────────────────────────
// The orb is made entirely of small dots arranged on a sphere surface.
// They drift, breathe, and shift colour — no solid fill.

function OrbCanvas({ size, flash }) {
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
    const sphereR = size / 2 - 8;

    // Build dots on a sphere using Fibonacci lattice for even distribution
    const DOT_COUNT = 320;
    const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / (DOT_COUNT - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = golden * i;
      return {
        // 3D coords on unit sphere
        nx: Math.cos(theta) * radius,
        ny: y,
        nz: Math.sin(theta) * radius,
        // drift phase offset per dot
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.0003 + Math.random() * 0.0004,
        driftAmp: 0.008 + Math.random() * 0.012,
      };
    });

    // Slow rotation axes
    let rotY = 0;
    let rotX = 0;
    let startTime = null;

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      ctx.clearRect(0, 0, size, size);

      // Colour cycle coral→sky
      const gradT = (Math.sin((elapsed / 8000) * Math.PI * 2) + 1) / 2;
      const cr = Math.round(242 - (242 - 75) * gradT);
      const cg = Math.round(107 - (107 - 163) * gradT);
      const cb = Math.round(69  - (69  - 227) * gradT);

      // Slow rotation
      rotY = elapsed * 0.00022;
      rotX = elapsed * 0.00009;

      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      // Outer pulse ring
      const pulseT = (Math.sin((elapsed / 3000) * Math.PI * 2) + 1) / 2;
      const pScale = 1 + 0.06 * pulseT;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pScale, pScale);
      ctx.beginPath();
      ctx.arc(0, 0, sphereR + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.15)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Project and draw each dot
      const projected = dots.map((d, i) => {
        // Apply drift — tiny wobble on unit sphere surface
        const drift = Math.sin(elapsed * d.driftSpeed + d.phase) * d.driftAmp;
        let nx = d.nx + drift;
        let ny = d.ny + Math.cos(elapsed * d.driftSpeed + d.phase) * d.driftAmp * 0.5;
        let nz = d.nz;
        // Normalise back onto sphere
        const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
        nx /= len; ny /= len; nz /= len;

        // Rotate Y
        const x1 = nx * cosY + nz * sinY;
        const z1 = -nx * sinY + nz * cosY;
        // Rotate X
        const y2 = ny * cosX - z1 * sinX;
        const z2 = ny * sinX + z1 * cosX;

        const sx = cx + x1 * sphereR;
        const sy = cy + y2 * sphereR;
        const depth = (z2 + 1) / 2; // 0=back, 1=front
        return { sx, sy, depth };
      });

      // Sort by depth so front dots draw on top
      projected.sort((a, b) => a.depth - b.depth);

      projected.forEach(({ sx, sy, depth }) => {
        const opacity = 0.08 + depth * 0.65;
        const dotSize = 0.6 + depth * 1.0;
        // Back dots: coral tint, front dots: sky tint
        const mixT = depth;
        const dr = Math.round(242 * (1 - mixT * 0.3));
        const dg = Math.round(cg);
        const db = Math.round(cb + (227 - cb) * mixT * 0.4);
        ctx.beginPath();
        ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dr},${dg},${db},${opacity})`;
        ctx.fill();
      });

      // Flash overlay
      if (flash > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, sphereR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.25})`;
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
        filter: 'drop-shadow(0 0 20px rgba(242,107,69,0.25))',
      }}
    />
  );
}

// ─── Fixed Question Card ──────────────────────────────────────────────────────
// Cards are placed in a fixed 2-column grid around the orb, no CSS animation.
// The orb itself provides all the motion.

// 6 fixed positions relative to the orb centre (percentage of container)
// Left column: 3 cards. Right column: 3 cards.
const CARD_POSITIONS = [
  { side: 'left',  top: '18%' },
  { side: 'left',  top: '44%' },
  { side: 'left',  top: '70%' },
  { side: 'right', top: '18%' },
  { side: 'right', top: '44%' },
  { side: 'right', top: '70%' },
];

function QuestionCard({ question, onSelect, answered, idx }) {
  const pos = CARD_POSITIONS[idx] || { side: 'left', top: '50%' };
  const isLeft = pos.side === 'left';

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -12 : 12 }}
      animate={{ opacity: answered ? 0.35 : 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.08 }}
      onClick={e => { e.stopPropagation(); if (!answered) onSelect(question); }}
      whileHover={!answered ? { scale: 1.03, borderColor: 'rgba(242,107,69,0.9)' } : {}}
      style={{
        position: 'absolute',
        top: pos.top,
        ...(isLeft ? { left: 16 } : { right: 16 }),
        width: 172,
        background: 'var(--bg-card)',
        border: '0.5px solid rgba(242,107,69,0.35)',
        borderRadius: 8,
        padding: '11px 14px',
        cursor: answered ? 'default' : 'pointer',
        fontSize: 12,
        fontFamily: 'var(--font-body)',
        color: 'var(--text-sub)',
        lineHeight: 1.45,
        textAlign: isLeft ? 'right' : 'left',
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isLeft ? 'flex-end' : 'flex-start',
        transition: 'opacity 0.3s',
        userSelect: 'none',
      }}
    >
      {answered && (
        <span style={{ color: 'var(--coral)', marginRight: isLeft ? 0 : 6, marginLeft: isLeft ? 6 : 0, order: isLeft ? 1 : -1, fontSize: 11 }}>✓</span>
      )}
      {question}
    </motion.div>
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

      {/* Fixed question cards */}
      <AnimatePresence>
        {phase === 'active' && (
          <div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {QUESTIONS.map((q, i) => (
              <div key={q} style={{ pointerEvents: 'auto' }}>
                <QuestionCard
                  question={q}
                  onSelect={handleSelectQ}
                  answered={answeredQ.has(q)}
                  idx={i}
                />
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
