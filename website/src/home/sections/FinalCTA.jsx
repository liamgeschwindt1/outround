import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BTN = {
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
};

function RailStat({ label, value }) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--text-primary)',
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function FinalCTA() {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  return (
    <section
      id="cta"
      style={{
        background: '#111114',
        backgroundImage: 'radial-gradient(circle, rgba(242,241,239,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      {/* Corner metadata */}
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(40px, 5vw, 56px)',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--coral)',
              opacity: 0.8,
            }}
          />
          05 / GET STARTED
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            opacity: 0.65,
            whiteSpace: 'nowrap',
          }}
        >
          {'/* founding cohort */'}
        </div>
      </div>

      <div
        className="cta-grid"
        style={{
          width: '100%',
          maxWidth: 1100,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
          gap: 'clamp(40px, 6vw, 88px)',
          alignItems: 'center',
        }}
      >
        {/* LEFT — copy + buttons */}
        <div style={{ textAlign: 'left' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              marginBottom: 24,
            }}
          >
            Be fully present. Outround remembers the rest.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(14px, 1.6vw, 16px)',
              color: 'var(--text-sub)',
              lineHeight: 1.7,
              maxWidth: 540,
              margin: '0 0 36px',
            }}
          >
            Outround prepares every conversation and remembers everything after it. Your team owns
            the relationship. Outround owns the continuity and the coordination.
            <span
              style={{
                display: 'block',
                marginTop: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              EU hosted &middot; GDPR native &middot; Your data stays yours
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.35 }}
            style={{ marginBottom: 28 }}
          >
            {!emailOpen && !emailSubmitted && (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setEmailOpen(true)}
                style={{ ...BTN }}
              >
                Sign up here. Launching soon.
              </motion.button>
            )}
            <AnimatePresence>
              {emailOpen && !emailSubmitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      paddingTop: 4,
                    }}
                  >
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && emailValue) setEmailSubmitted(true);
                      }}
                      placeholder="your@email.com"
                      style={{
                        flex: '1 1 220px',
                        background: 'var(--bg-card)',
                        border: '0.5px solid rgba(242,107,69,0.45)',
                        borderRadius: 10,
                        padding: '13px 18px',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 15,
                        outline: 'none',
                        minHeight: 48,
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.015, boxShadow: '0 0 36px rgba(242,107,69,0.35)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (emailValue) setEmailSubmitted(true);
                      }}
                      style={{
                        ...BTN,
                        opacity: emailValue ? 1 : 0.55,
                        cursor: emailValue ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Join the founding cohort →
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {emailSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    color: 'var(--text-primary)',
                    padding: '14px 0',
                  }}
                >
                  {"You're in. We will be in touch before launch."}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.55 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
            }}
          >
            EU hosted &middot; GDPR native &middot; No visible bot &middot; Your data stays yours
            {' \u00b7 '}
            <button
              onClick={() => setDataModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--coral)',
                letterSpacing: '0.08em',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              How we handle your data →
            </button>
          </motion.div>
        </div>

        {/* RIGHT — founding cohort rail */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            background: 'linear-gradient(135deg, rgba(242,107,69,0.06), rgba(75,163,227,0.03))',
            border: '0.5px solid rgba(242,107,69,0.25)',
            borderRadius: 14,
            padding: 'clamp(24px, 3vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--coral)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Founding cohort
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(20px, 2.8vw, 28px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: 10,
              }}
            >
              Join the founding cohort.
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}
            >
              First access. Shape the product. Direct line to the founders.
            </div>
          </div>
          <div style={{ height: '0.5px', background: 'var(--border)' }} />
          <div
            style={{
              background: 'rgba(242,107,69,0.08)',
              border: '0.5px solid rgba(242,107,69,0.3)',
              borderRadius: 10,
              padding: '14px 16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 3vw, 28px)',
                fontWeight: 700,
                color: 'var(--coral)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              50% off
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--text-sub)',
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              for founding cohort members &middot; first 6 months
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <RailStat label="Onboarding window" value="48 hours" />
            <RailStat label="Direct line to founders" value="Always" />
          </div>
        </motion.div>
      </div>

      {/* Data ownership modal */}
      <AnimatePresence>
        {dataModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDataModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10,10,11,0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px 16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#111114',
                border: '0.5px solid rgba(242,107,69,0.25)',
                borderRadius: 16,
                padding: 'clamp(24px, 3vw, 40px)',
                maxWidth: 560,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--coral)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  How we handle your data
                </div>
                <button
                  onClick={() => setDataModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 20,
                    lineHeight: 1,
                    padding: 4,
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  'Your call recordings are stored in EU-based infrastructure, never on US servers.',
                  'Your data is never used to train our models or shared with third parties.',
                  'Every conversation is end-to-end encrypted in transit and at rest.',
                  'You can export or delete your data at any time, immediately and completely.',
                  'No data is retained after account deletion. 30 days maximum.',
                  'GDPR-compliant by architecture, not by policy addendum.',
                ].map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        color: 'var(--coral)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      ✓
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                        color: 'var(--text-sub)',
                        lineHeight: 1.65,
                      }}
                    >
                      {point}
                    </span>
                  </div>
                ))}
                <div
                  style={{ borderTop: '0.5px solid var(--border)', paddingTop: 18, marginTop: 4 }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Outround is the infrastructure. You are the landlord.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
