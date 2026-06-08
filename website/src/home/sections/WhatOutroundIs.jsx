import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const EASE = { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] };

const ROWS = [
  ['Before the meeting', 'Intelligence arrives automatically.'],
  ['After the meeting',  'CRM completed. Follow-up drafted.'],
  ['Over time',          'Sharper with every call.'],
];

const NOT = ['Not a meeting recorder.', 'Not a CRM integration.', 'Not a pipeline assistant.'];

export default function WhatOutroundIs() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="what"
      ref={ref}
      style={{
        background: '#0a0a0b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      {/* Corner metadata */}
      <div style={{
        width: '100%', maxWidth: 1200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'clamp(40px, 6vw, 72px)', gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
          01 / WHAT IT IS
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65, whiteSpace: 'nowrap',
        }}>
          {'/* memory + coordination */'}
        </div>
      </div>

      <div
        className="what-grid"
        style={{
          width: '100%', maxWidth: 1200,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 'clamp(40px, 6vw, 88px)',
          alignItems: 'center',
        }}
      >
        {/* LEFT — the concept */}
        <div>
          <div style={{ marginBottom: 'clamp(28px, 4vw, 40px)' }}>
            {NOT.map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, x: -8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ ...EASE, delay: 0.1 + i * 0.08 }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(24px, 3.6vw, 40px)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                }}
              >
                {line}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ ...EASE, delay: 0.4 }}
            style={{ height: '0.5px', background: 'var(--border)', marginBottom: 'clamp(24px, 3vw, 32px)', maxWidth: 120 }}
          />

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...EASE, delay: 0.45 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 3.6vw, 40px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              margin: 0,
              maxWidth: 560,
            }}
          >
            The memory and coordination layer beneath every conversation your team has.
          </motion.h2>
        </div>

        {/* RIGHT — before / after / over time */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...EASE, delay: 0.3 }}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '0.5px solid var(--border)',
            borderRadius: 14,
            padding: 'clamp(24px, 3vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {ROWS.map(([label, value], i) => (
            <div
              key={label}
              style={{
                padding: '20px 0',
                borderBottom: i < ROWS.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--coral)', letterSpacing: '0.12em',
                textTransform: 'uppercase', marginBottom: 8, opacity: 0.85,
              }}>
                {label}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(17px, 2vw, 21px)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                letterSpacing: '-0.015em',
              }}>
                {value}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .what-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
