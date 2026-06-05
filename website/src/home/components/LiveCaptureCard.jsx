import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LiveCaptureCard — ambient "this thing is doing something" hero anchor.
 * Cycles through demo conversations. Shows: live transcript line being parsed,
 * then a CRM field being written. Loops.
 */

const SCRIPT = [
  {
    persona: 'Hendrik van der Berg',
    title:   'CFO · Vandermeer Logistics',
    elapsed: '00:08:42',
    transcript: 'Look, the budget for this kind of platform is around forty thousand euros per year, and the decision sits with me, not Daan.',
    highlights: [
      { text: 'forty thousand euros',  field: 'Budget',         value: '\u20ac40,000/yr' },
      { text: 'sits with me',          field: 'Decision-maker', value: 'CFO confirmed'  },
    ],
  },
  {
    persona: 'Sophie Laurent',
    title:   'VP Sales · Atlas Robotics',
    elapsed: '00:14:21',
    transcript: 'We piloted Salesforce last year and ripped it out after six months. Onboarding was the blocker.',
    highlights: [
      { text: 'Salesforce', field: 'Competitor (past)', value: 'Salesforce \u00b7 churned' },
      { text: 'Onboarding', field: 'Lost-deal reason',  value: 'Onboarding friction'      },
    ],
  },
  {
    persona: 'Marcus Becker',
    title:   'Head of RevOps · Nordlys',
    elapsed: '00:03:18',
    transcript: 'Send me a technical review for week 24 and loop in our security lead before any contract.',
    highlights: [
      { text: 'week 24',       field: 'Next step',     value: 'Technical review \u00b7 W24' },
      { text: 'security lead', field: 'Stakeholder',   value: 'Security \u00b7 required'   },
    ],
  },
];

const CYCLE_MS = 6800;

export default function LiveCaptureCard() {
  const [idx, setIdx]     = useState(0);
  const [phase, setPhase] = useState(0); // 0: typing transcript, 1: field 1, 2: field 2
  const timersRef         = useRef([]);

  useEffect(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    setPhase(0);

    timersRef.current.push(setTimeout(() => setPhase(1), 2400));
    timersRef.current.push(setTimeout(() => setPhase(2), 3600));
    timersRef.current.push(setTimeout(() => setIdx(i => (i + 1) % SCRIPT.length), CYCLE_MS));

    return () => timersRef.current.forEach(t => clearTimeout(t));
  }, [idx]);

  const scene = SCRIPT[idx];

  // Render transcript with highlighted spans by phase
  function renderTranscript() {
    const parts = [];
    let cursor  = scene.transcript;
    const ranges = scene.highlights
      .map((h, i) => ({ ...h, i, start: scene.transcript.indexOf(h.text) }))
      .sort((a, b) => a.start - b.start);

    let pos = 0;
    ranges.forEach((r, k) => {
      if (r.start > pos) parts.push({ text: scene.transcript.slice(pos, r.start), highlight: false, key: `t${k}` });
      parts.push({ text: r.text, highlight: true, active: phase > r.i, key: `h${k}` });
      pos = r.start + r.text.length;
    });
    if (pos < scene.transcript.length) parts.push({ text: scene.transcript.slice(pos), highlight: false, key: `e` });
    return parts;
  }

  const parts = renderTranscript();

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(242,107,69,0.18), rgba(75,163,227,0.18))',
      padding: '0.5px',
      borderRadius: 16,
    }}>
      <div style={{
        background: 'var(--bg-sub)',
        borderRadius: 15.5,
        padding: '22px 24px 24px',
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Header: live indicator + persona */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'var(--coral)', animation: 'lcc-ping 1.6s ease-out infinite',
                opacity: 0.6,
              }} />
              <span style={{
                position: 'relative', width: 8, height: 8, borderRadius: '50%',
                background: 'var(--coral)',
              }} />
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--coral)', letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              Capturing
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', letterSpacing: '0.1em',
          }}>
            {scene.elapsed}
          </span>
        </div>

        {/* Persona */}
        <AnimatePresence mode="wait">
          <motion.div
            key={'p' + idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 15,
              color: 'var(--text-primary)', fontWeight: 600,
              letterSpacing: '-0.005em',
            }}>
              {scene.persona}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: 4,
            }}>
              {scene.title}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Transcript */}
        <AnimatePresence mode="wait">
          <motion.div
            key={'t' + idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.025)',
              border: '0.5px solid var(--border)',
              borderRadius: 10,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-sub)',
              lineHeight: 1.6,
              minHeight: 78,
            }}
          >
            <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>&ldquo;</span>
            {parts.map(p => p.highlight ? (
              <span
                key={p.key}
                style={{
                  background: p.active ? 'rgba(242,107,69,0.18)' : 'transparent',
                  color: p.active ? 'var(--text-primary)' : 'var(--text-sub)',
                  borderBottom: p.active ? '1px solid rgba(242,107,69,0.6)' : '1px solid transparent',
                  padding: '0 2px',
                  transition: 'background 0.4s ease, color 0.4s ease, border-color 0.4s ease',
                }}
              >{p.text}</span>
            ) : (
              <span key={p.key}>{p.text}</span>
            ))}
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>&rdquo;</span>
          </motion.div>
        </AnimatePresence>

        {/* CRM update panel */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          marginTop: 'auto',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 4,
          }}>
            CRM update \u2014 live
          </div>

          {scene.highlights.map((h, i) => (
            <AnimatePresence key={`crm-${idx}-${i}`} mode="wait">
              {phase > i && (
                <motion.div
                  initial={{ opacity: 0, y: 4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.0, 0.0, 0.2, 1] }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
                    gap: 12,
                    alignItems: 'baseline',
                    padding: '8px 12px',
                    background: 'rgba(242,107,69,0.06)',
                    border: '0.5px solid rgba(242,107,69,0.25)',
                    borderRadius: 8,
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-muted)', letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {h.field}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'var(--text-primary)', fontWeight: 600,
                    textAlign: 'right',
                  }}>
                    {h.value}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <style>{`
          @keyframes lcc-ping {
            0%   { transform: scale(1);   opacity: 0.6; }
            80%  { transform: scale(2.6); opacity: 0;   }
            100% { transform: scale(2.6); opacity: 0;   }
          }
        `}</style>
      </div>
    </div>
  );
}
