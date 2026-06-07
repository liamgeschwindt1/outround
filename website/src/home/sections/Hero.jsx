import { motion } from 'framer-motion';
import LiveCaptureCard from '../components/LiveCaptureCard';

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
        padding: 'clamp(96px, 12vw, 140px) clamp(20px, 4vw, 56px) clamp(64px, 8vw, 96px)',
        overflow: 'hidden',
      }}
    >
      {/* Top corner metadata */}
      <div style={{
        position: 'absolute',
        top: 'clamp(20px, 3vw, 32px)',
        left: 'clamp(20px, 4vw, 56px)',
        right: 'clamp(20px, 4vw, 56px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--text-muted)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)' }} />
          Outround &middot; v1.0
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ opacity: 0.7 }}
        >
          {'/* '}EU hosted &middot; GDPR native{' */'}
        </motion.div>
      </div>

      <div
        className="hero-grid"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1200,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 'clamp(40px, 6vw, 88px)',
          alignItems: 'center',
        }}
      >
        {/* LEFT — copy block */}
        <div style={{ textAlign: 'left' }}>
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
              marginBottom: 28,
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--coral)', display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--coral)', letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              Founding cohort &middot; 25 seats
            </span>
          </motion.div>

          <motion.h1
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...EASE, delay: 0.6 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5.6vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.05,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              margin: '0 0 24px',
            }}
          >
            Your sales engine is leaking revenue.
            <br />
            <span style={{ color: 'var(--text-sub)' }}>Find out where.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(15px, 1.4vw, 18px)',
              color: 'var(--text-sub)',
              maxWidth: 540,
              margin: '0 0 36px',
              lineHeight: 1.7,
            }}
          >
            Outround captures every sales conversation, updates your CRM automatically, and turns your pipeline into a queryable intelligence layer.
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 1.1 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
          >
            <motion.button
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
              See what it&rsquo;s costing you
            </motion.button>
            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'transparent',
                color: 'var(--text-sub)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 500,
                padding: '14px 22px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              How it works &rarr;
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(20px, 3vw, 40px)',
              marginTop: 44,
              paddingTop: 28,
              borderTop: '0.5px solid var(--border)',
            }}
          >
            {[
              ['Brief',      'Pre-call intel'],
              ['Capture',    '100% of calls'],
              ['Update',     'Live to CRM'],
              ['Coordinate', 'Next steps set'],
              ['Query',      'Plain language'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)', letterSpacing: '0.12em',
                  textTransform: 'uppercase', marginBottom: 4,
                }}>
                  {k}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 14,
                  color: 'var(--text-primary)', fontWeight: 600,
                }}>
                  {v}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — live capture card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...EASE, delay: 0.8 }}
          className="hero-right"
        >
          <LiveCaptureCard />
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-right { max-width: 520px; margin: 0 auto; width: 100%; }
        }
      `}</style>
    </section>
  );
}
