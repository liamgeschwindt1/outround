import { motion } from 'framer-motion';

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

export default function FinalCTA() {
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
        padding: 'clamp(80px, 12vw, 120px) 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 660 }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 5vw, 44px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
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
            fontSize: 'clamp(14px, 1.8vw, 16px)',
            color: 'var(--text-sub)',
            lineHeight: 1.75,
            maxWidth: 520,
            margin: '0 auto 40px',
          }}
        >
          78% of sellers missed quota in 2025. That is not a talent problem. It is a visibility problem. The signal that could fix it already exists in your calls.
          <span style={{ display: 'block', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Ebsta × Pavilion GTM Benchmarks, 2025
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.35 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}
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
          EU hosted · GDPR native · No visible bot · Your data stays yours
        </motion.div>
      </div>
    </section>
  );
}
