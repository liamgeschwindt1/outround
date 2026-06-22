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
        padding: 'clamp(40px, 6vw, 72px) clamp(20px, 4vw, 56px) clamp(64px, 8vw, 96px)',
        overflow: 'hidden',
      }}
    >
      <div
        className="hero-grid"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1200,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
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
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--coral)',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--coral)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
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
            Your team&rsquo;s calls are full of signals nobody&rsquo;s tracking.
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
            Outround captures every conversation, finds the patterns that predict wins and losses,
            and puts the answer in front of you before your next pipeline review.
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
              onClick={() => window.dispatchEvent(new CustomEvent('outround:open-calculator'))}
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
              onClick={() =>
                document.getElementById('what')?.scrollIntoView({ behavior: 'smooth' })
              }
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
              See the product &rarr;
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
              ['Before', 'Brief delivered'],
              ['After', 'CRM completed'],
              ['Across', 'Every deal'],
              ['Over time', 'Never resets'],
            ].map(([k, v]) => (
              <div key={k}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                >
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
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-right { max-width: 520px; margin: 0 auto; width: 100%; }
        }
      `}</style>
    </section>
  );
}
