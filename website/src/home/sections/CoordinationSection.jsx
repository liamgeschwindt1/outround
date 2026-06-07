import { motion } from 'framer-motion';

export default function CoordinationSection() {
  return (
    <section
      id="coordination"
      style={{
        background: '#111114',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', maxWidth: 860, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 32,
          }}
        >
          {'/* coordination */'}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3.6vw, 40px)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            letterSpacing: '-0.02em',
            margin: 0,
            maxWidth: 760,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          After every call, tasks are created, owners assigned, and next steps triggered.{' '}
          <span style={{ color: 'var(--text-sub)' }}>
            The rep doesn&rsquo;t decide what happens next. It already happened.
          </span>
        </motion.p>
      </div>
    </section>
  );
}
