import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

function fmtEur(n) {
  if (n >= 1000000) return '\u20ac' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '\u20ac' + Math.round(n / 1000) + 'k';
  return '\u20ac' + Math.round(n);
}

const STATEMENTS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    text: 'Brief delivered 15 minutes before every call.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    text: 'CRM updated automatically before you leave your desk.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    text: 'Follow-up drafted automatically the moment the call ends.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    text: 'Zero calls lost to admin.',
  },
];

export default function SolutionSection() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const [pipeline, setPipeline] = useState(null);
  const [numReps,  setNumReps]  = useState(null);

  useEffect(() => {
    const read = () => {
      try {
        const v = localStorage.getItem('outround_pipeline');
        if (v) setPipeline(parseFloat(v));
        const r = localStorage.getItem('outround_reps');
        if (r) setNumReps(parseInt(r, 10));
      } catch (_) {}
    };
    read();
    const onCalc = (e) => {
      if (!e.detail) return read();
      setPipeline(e.detail.pipeline);
      setNumReps(e.detail.reps);
    };
    window.addEventListener('outround:calc', onCalc);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('outround:calc', onCalc);
      window.removeEventListener('storage', read);
    };
  }, []);

  const EASE        = { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] };
  const hasUserData  = pipeline !== null;
  const dispReps     = numReps   || 10;
  const dispPipeline = pipeline  || 4600000;

  return (
    <section
      id="solution"
      ref={ref}
      style={{
        background: '#0a0a0b',
        backgroundImage: 'radial-gradient(circle, rgba(242,241,239,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1200 }}>

        {/* Section label */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(40px, 6vw, 72px)',
          gap: 24,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
            03 / THE FIX
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65,
            whiteSpace: 'nowrap',
          }}>
            {'/* from day one */'}
          </div>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={EASE}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--coral)', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 18,
          }}
        >
          Impact
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...EASE, delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            margin: '0 0 16px',
            maxWidth: 640,
          }}
        >
          30 minutes of admin per call. Down to 2.
        </motion.h2>

        {/* Calibration line — always visible */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--coral)', letterSpacing: '0.14em',
          textTransform: 'uppercase', marginBottom: 36, opacity: 0.85,
        }}>
          {'\u2713 Calibrated to your ' + dispReps + '-rep team'}
        </div>

        {/* Post-deployment statements */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 52,
          }}
        >
          {STATEMENTS.map(({ icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.25 + i * 0.07 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px solid var(--border)',
                borderRadius: 12,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              <span style={{
                color: 'var(--coral)',
                flexShrink: 0,
                lineHeight: 1.4,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
              }}>
                {icon}
              </span>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(14px, 1.5vw, 16px)',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* What this means */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...EASE, delay: 0.55 }}
          style={{
            borderTop: '0.5px solid var(--border)',
            paddingTop: 36,
          }}
        >
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 18,
          }}>
            What this means
          </div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 2.8vw, 34px)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            letterSpacing: '-0.02em',
            margin: 0,
            maxWidth: 880,
          }}>
            Outround gives your team{' '}
            <span style={{ color: 'var(--coral)', fontWeight: 700 }}>{fmtEur(dispPipeline)}</span>
            {' '}of selling time back every year.
          </p>

          {/* Quality bridge */}
          <div style={{
            marginTop: 40,
            paddingTop: 28,
            borderTop: '0.5px solid var(--border)',
            maxWidth: 760,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', letterSpacing: '0.12em',
              textTransform: 'uppercase', marginBottom: 14,
              opacity: 0.75,
            }}>
              {'/* what this number does not capture */'}
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: 'var(--text-sub)',
              lineHeight: 1.7,
              margin: 0,
              fontStyle: 'italic',
            }}>
              This calculation only accounts for time. It says nothing about what happens when your reps walk into every call better prepared, and your pipeline intelligence compounds with every conversation. We will let your numbers prove that part.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
