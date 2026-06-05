import { motion } from 'framer-motion';

const EASE = { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] };

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 740, textAlign: 'center' }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(242,107,69,0.08)',
            border: '0.5px solid rgba(242,107,69,0.4)',
            borderRadius: 999,
            padding: '5px 14px',
            marginBottom: 32,
          }}
        >
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--coral)',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--coral)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Automated Customer Intelligence
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...EASE, delay: 0.6 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(30px, 5.5vw, 54px)',
            fontWeight: 700,
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            margin: '0 auto 28px',
            maxWidth: 680,
          }}
        >
          Your sales engine is leaking revenue.
          <br />
          <span style={{ color: 'var(--text-sub)' }}>Find out where.</span>
        </motion.h1>

        {/* Sub-copy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 1.9vw, 18px)',
            color: 'var(--text-sub)',
            maxWidth: 560,
            margin: '0 auto 44px',
            lineHeight: 1.75,
          }}
        >
          Outround captures every sales conversation, updates your CRM automatically, and turns your pipeline into a queryable intelligence layer.
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 1.1 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
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
          See what it's costing you
        </motion.button>
      </div>
    </section>
  );
}
