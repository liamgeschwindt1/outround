import { motion } from 'framer-motion';

export default function StatCard({ number, line1, line2, delay = 0 }) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28, delay }}
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-md)',
        borderRadius: 12,
        padding: '24px 28px',
        minWidth: 0,
        flex: '1 1 0',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 48px)',
          fontWeight: 700,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #f26b45 0%, #4ba3e3 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 10,
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--text-sub)',
          lineHeight: 1.5,
        }}
      >
        {line1}
        <br />
        {line2}
      </div>
    </motion.div>
  );
}
