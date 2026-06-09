import { motion } from 'framer-motion';

export default function EUBadge() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)',
        textAlign: 'center',
        cursor: 'default',
        transition: 'color 0.2s',
        padding: '8px 0',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-sub)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
    >
      🇪🇺&nbsp;&nbsp;EU hosted · Your data · Never shared&nbsp;&nbsp;🔒
    </motion.div>
  );
}
