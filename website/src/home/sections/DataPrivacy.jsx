import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// ─── Orbit visual ─────────────────────────────────────────────────────────────

const ORBIT_ITEMS = [
  {
    label: 'Audio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f26b45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 18.5a6.5 6.5 0 0 0 6.5-6.5V8a6.5 6.5 0 0 0-13 0v4A6.5 6.5 0 0 0 12 18.5z"/>
        <line x1="12" y1="18.5" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
    ),
  },
  {
    label: 'Transcripts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f26b45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 3 14 8 19 8"/>
        <line x1="8" y1="13" x2="16" y2="13"/>
        <line x1="8" y1="17" x2="13" y2="17"/>
      </svg>
    ),
  },
  {
    label: 'CRM fields',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f26b45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v4c0 1.656 4.03 3 9 3s9-1.344 9-3V5"/>
        <path d="M3 9v4c0 1.656 4.03 3 9 3s9-1.344 9-3V9"/>
        <path d="M3 13v4c0 1.656 4.03 3 9 3s9-1.344 9-3v-4"/>
      </svg>
    ),
  },
  {
    label: 'Rep profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f26b45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

const ORBIT_RADIUS = 100;
const ORBIT_DURATION = 20;

function DataOrbit({ isInView }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Orbit ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={ORBIT_RADIUS}
          fill="none"
          stroke="rgba(242,107,69,0.3)"
          strokeWidth="1"
        />
      </svg>

      {/* Central EU flag */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        overflow: 'hidden',
        width: 72,
        height: 72,
        boxShadow: '0 0 0 1px rgba(242,107,69,0.3), 0 0 24px rgba(0,51,153,0.4)',
      }}>
        <img src="/icons/eu.webp" alt="EU" style={{ width: 72, height: 72, objectFit: 'cover', display: 'block' }} />
      </div>

      {/* Orbiting icon group */}
      <motion.div
        animate={isInView ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        {ORBIT_ITEMS.map((item, i) => {
          const angle = (i / ORBIT_ITEMS.length) * 2 * Math.PI - Math.PI / 2;
          const x = cx + ORBIT_RADIUS * Math.cos(angle);
          const y = cy + ORBIT_RADIUS * Math.sin(angle);

          // label offset — push label outward from center
          const labelDist = 36;
          const lx = cx + (ORBIT_RADIUS + labelDist) * Math.cos(angle);
          const ly = cy + (ORBIT_RADIUS + labelDist) * Math.sin(angle);

          return (
            <div key={item.label}>
              {/* Icon circle */}
              <motion.div
                animate={isInView ? { rotate: -360 } : { rotate: 0 }}
                transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#1a1a1f',
                  border: '0.5px solid rgba(242,107,69,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </motion.div>

              {/* Label — counter-rotates to stay readable */}
              <motion.div
                animate={isInView ? { rotate: -360 } : { rotate: 0 }}
                transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  left: lx,
                  top: ly,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'rgba(242,241,239,0.35)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {item.label}
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── Statements ───────────────────────────────────────────────────────────────

const STATEMENTS = [
  'Raw audio deleted within 24 hours of every call.',
  'Transcripts retained and owned by you — export or delete any time.',
  'Every CRM field cites the exact transcript line that generated it. No black-box outputs.',
  'Your data is never used to train models. The intelligence compounds for you, not for us.',
  'Verbal consent logged automatically on every call.',
  'EU AI Act Article 5(1)(f) compliant — no emotion inference, no biometric data processed.',
];

// ─── Section ──────────────────────────────────────────────────────────────────

export default function DataPrivacy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const EASE = { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] };

  return (
    <section
      id="data-privacy"
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

        {/* Corner metadata */}
        <div style={{
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
            06 / Data &amp; Privacy
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65,
            whiteSpace: 'nowrap',
          }}>
            {'/* EU hosted \u00b7 GDPR native \u00b7 EU AI Act compliant */'}
          </div>
        </div>

        {/* Two-column layout */}
        <div
          className="data-privacy-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
            gap: 'clamp(48px, 7vw, 100px)',
            alignItems: 'center',
          }}
        >
          {/* LEFT — orbit visual */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...EASE, delay: 0.15 }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <DataOrbit isInView={isInView} />
          </motion.div>

          {/* RIGHT — copy */}
          <div>
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
              Ownership
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.1 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 2.8vw, 28px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                margin: '0 0 32px',
              }}
            >
              Your data never leaves the EU.
            </motion.h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {STATEMENTS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ ...EASE, delay: 0.2 + i * 0.07 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
                >
                  <span style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: 'var(--coral)',
                    flexShrink: 0,
                    marginTop: 8,
                  }} />
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'clamp(13px, 1.4vw, 15px)',
                    color: 'var(--text-sub)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}>
                    {s}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ ...EASE, delay: 0.75 }}
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTop: '0.5px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(13px, 1.4vw, 15px)',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Outround is the infrastructure. You are the landlord.
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 780px) {
          .data-privacy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
