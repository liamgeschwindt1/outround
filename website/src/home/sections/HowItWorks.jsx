import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const LAYERS = [
  {
    num: '01',
    title: 'Capture',
    body: 'Every call automatically recorded, transcribed, and structured. Nothing manual. Nothing missed. No visible bot joining the call.',
  },
  {
    num: '02',
    title: 'Intelligence',
    body: 'Rep patterns. Client profiles. Deal signals. The CRM updates itself with structured fields. Every entry linked to the exact moment in the call it came from.',
  },
  {
    num: '03',
    title: 'Query',
    body: 'Ask your data anything. The answers come from your own conversations, not a generic model.',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="how"
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
      <div style={{ width: '100%', maxWidth: 600 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 52,
          }}
        >
          Three layers
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {LAYERS.map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1], delay: i * 0.15 }}
              style={{
                display: 'flex',
                gap: 28,
                paddingBottom: 40,
                borderLeft: '0.5px solid var(--border-md)',
                paddingLeft: 28,
                position: 'relative',
              }}
            >
              {/* Number dot on line */}
              <div
                style={{
                  position: 'absolute',
                  left: -5,
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--coral)',
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--coral)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {layer.num}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(18px, 2.5vw, 22px)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {layer.title}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'clamp(14px, 1.7vw, 16px)',
                    color: 'var(--text-sub)',
                    lineHeight: 1.7,
                  }}
                >
                  {layer.body}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.55 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => document.getElementById('orb')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            marginTop: 12,
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
          Ask it anything
        </motion.button>
      </div>
    </section>
  );
}
