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

const BTN_OUTLINE = {
  background: 'transparent',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  padding: '13px 36px',
  borderRadius: 999,
  border: '0.5px solid var(--border-md)',
  cursor: 'pointer',
  minHeight: 44,
};

function RailStat({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--text-muted)', letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 13,
        color: 'var(--text-primary)', fontWeight: 600,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function FinalCTA() {
  const [whyOpen, setWhyOpen] = useState(false);
  return (
    <section
      id="cta"
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(80px, 12vw, 120px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      {/* Corner metadata */}
      <div style={{
        width: '100%',
        maxWidth: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'clamp(40px, 6vw, 64px)',
        gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
          05 / Get started
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65,
          whiteSpace: 'nowrap',
        }}>
          {'/* founding cohort \u00b7 25 seats */'}
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
            Stop losing what your conversations are telling you.
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
            78% of sellers missed quota in 2025. That is not a talent problem. It is a visibility problem. The signal that could fix it already exists in your calls.
            <span style={{
              display: 'block', marginTop: 12,
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Ebsta &times; Pavilion GTM Benchmarks, 2025
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.35 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}
          >
            <motion.a
              href="mailto:liam@outround.io"
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
              whileTap={{ scale: 0.98 }}
              style={{ ...BTN, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Join the waitlist
            </motion.a>
            <motion.a
              href="mailto:liam@outround.io?subject=Book%2020%20minutes"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ ...BTN_OUTLINE, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Book 20 minutes
            </motion.a>
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
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--coral)', letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            Founding cohort
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 6.5vw, 76px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
            }}>
              25<span style={{ color: 'var(--text-muted)', fontSize: '0.45em', fontWeight: 600, marginLeft: 6 }}>seats</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.08em',
              marginTop: 8,
            }}>
              first cohort, opens Q3 2026
            </div>
          </div>
          <div style={{ height: '0.5px', background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <RailStat label="First-year price"        value="\u20ac99/seat/mo" />
            <RailStat label="Onboarding window"       value="48 hours"          />
            <RailStat label="Direct line to founders" value="Always"            />
          </div>
        </motion.div>
      </div>

      {/* ── Not convinced ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.7 }}
        style={{
          textAlign: 'center',
          marginTop: 'clamp(56px, 8vw, 88px)',
          maxWidth: 600,
        }}
      >
        <button
          onClick={() => setWhyOpen(o => !o)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--text-sub)',
            lineHeight: 1.5,
            padding: 0,
            textDecoration: 'underline',
            textDecorationColor: 'rgba(242,107,69,0.45)',
            textUnderlineOffset: 4,
            fontWeight: 500,
          }}
        >
          {whyOpen ? 'Hide' : 'Why Outround?'}
        </button>

        <AnimatePresence>
          {whyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.0, 0.0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                maxWidth: 560,
                margin: '24px auto 0',
                padding: '24px 24px 20px',
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
                borderRadius: 10,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.75, margin: 0 }}>
                  Sales teams are losing a third of their selling time to work that could be automated. The calls happen. The insight exists. It is just never structured, stored, or made queryable.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.75, margin: 0 }}>
                  Outround does not change how your team works. It captures what is already happening and makes it permanent. Searchable, structured, and available to the next rep before their next call.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.75, margin: 0 }}>
                  The gap between your best rep and your average rep is not talent. It is information. One person remembers what works. Outround makes the whole team remember.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @media (max-width: 880px) {
          .cta-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
