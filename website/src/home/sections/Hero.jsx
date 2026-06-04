import { motion } from 'framer-motion';
import StatCard from '../components/StatCard';

const EASE_OUT = { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] };

export default function Hero({ demoRef }) {
  function scrollToDemo() {
    demoRef?.current?.scrollIntoView({ behavior: 'smooth' });
  }

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
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 800, textAlign: 'center' }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Every conversation your company has.
        </motion.div>

        {/* Tagline */}
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...EASE_OUT, delay: 0.8 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 7vw, 64px)',
            fontWeight: 700,
            lineHeight: 1.05,
            color: 'var(--text-primary)',
            marginBottom: 40,
            letterSpacing: '-0.02em',
          }}
        >
          Stop forgetting
          <br />
          what your customers tell you.
        </motion.h1>

        {/* Stat row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 40,
            flexWrap: 'wrap',
          }}
        >
          <StatCard
            number="47%"
            line1="of sales knowledge"
            line2="leaves with the rep"
            delay={1.2}
          />
          <StatCard
            number="23h"
            line1="wasted per rep per month"
            line2="on manual CRM updates"
            delay={1.32}
          />
          <StatCard
            number="0"
            line1="competitors can answer:"
            line2='"Why do we keep losing to Salesforce?"'
            delay={1.44}
          />
        </motion.div>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.6 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-sub)',
            maxWidth: 560,
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}
        >
          Outround captures every conversation, structures it into intelligence,
          and puts it where your team needs it — automatically.
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 1.9 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={scrollToDemo}
          style={{
            background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
            color: '#0a0a0b',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 700,
            padding: '14px 32px',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 28px rgba(242,107,69,0.25)',
            minHeight: 44,
          }}
        >
          See it in action →
        </motion.button>
      </div>
    </section>
  );
}
