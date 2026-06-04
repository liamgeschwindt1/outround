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
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          For sales leaders
        </motion.div>

        {/* Tagline */}
        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...EASE_OUT, delay: 0.8 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5.5vw, 52px)',
            fontWeight: 700,
            lineHeight: 1.12,
            color: 'var(--text-primary)',
            marginBottom: 40,
            letterSpacing: '-0.02em',
            maxWidth: 720,
            margin: '0 auto 40px',
          }}
        >
          Your reps spend 31% of their week on admin and prep.
          <br />
          <span style={{ color: 'var(--text-sub)' }}>Your CRM is a mess. Your coaching is guesswork.</span>
          <br />
          <span style={{ color: 'var(--text-sub)' }}>And when a rep leaves, everything they knew walks out with them.</span>
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
            number="6.8h"
            line1="wasted per rep per week"
            line2="on CRM admin"
            delay={1.2}
          />
          <StatCard
            number="5.6h"
            line1="wasted per rep per week"
            line2="on call prep"
            delay={1.32}
          />
          <StatCard
            number="0"
            line1="competitors who can tell you"
            line2='why you keep losing to Salesforce'
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
          Outround captures every sales conversation, eliminates the admin, and turns what your team learns into intelligence that stays.
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
