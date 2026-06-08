import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const EASE = { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] };

const TILES = [
  {
    label: 'Relationship graph',
    text: 'After six months, a new tool sees nothing. Outround sees everything that happened, deepening with every conversation.',
  },
  {
    label: 'Behavioural intelligence',
    text: 'Which messaging converts for your team. Which objections kill your deals. Specific to how you sell, not a generic model.',
  },
  {
    label: 'Coordination workflows',
    text: 'When tasks and reminders route through Outround, switching means rebuilding your operations. Not just losing data.',
  },
  {
    label: 'Trust history',
    text: 'Every accepted CRM field. Every brief that changed a call. Trust is a track record, and it takes months to build.',
  },
];

export default function MoatSection() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="moat"
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
        marginBottom: 'clamp(40px, 5vw, 56px)', gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
          04 / WHY IT COMPOUNDS
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65, whiteSpace: 'nowrap',
        }}>
          {'/* the moat deepens with use */'}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 1200 }}>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={EASE}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            margin: '0 0 clamp(40px, 5vw, 60px)',
            maxWidth: 720,
          }}
        >
          The system gets sharper with every conversation.
        </motion.h2>

        <div
          className="moat-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 'clamp(20px, 2.5vw, 32px)',
          }}
        >
          {TILES.map((tile, i) => (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.1 + i * 0.1 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid var(--border)',
                borderRadius: 14,
                padding: 'clamp(24px, 3vw, 36px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--coral)', letterSpacing: '0.12em',
                textTransform: 'uppercase', opacity: 0.9,
              }}>
                {tile.label}
              </div>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(17px, 2vw, 21px)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                letterSpacing: '-0.015em',
                margin: 0,
              }}>
                {tile.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .moat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
