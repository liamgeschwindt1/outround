import { motion, AnimatePresence } from 'framer-motion';
import SlackCard from '../components/SlackCard';
import CRMPanel from '../components/CRMPanel';

export default function Scene5_CRMUpdate({ isActive, sound }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 24 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Shrunken slack card in corner */}
      <motion.div
        initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
        animate={{ scale: 0.3, x: -120, y: -140, opacity: 0.6 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.1 }}
        style={{ position: 'absolute', pointerEvents: 'none', zIndex: 5 }}
      >
        <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border-md)', borderRadius: 12, borderLeft: '3px solid var(--coral)', padding: '16px 20px', width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Call with Jana Novak — logged.
          </div>
        </div>
      </motion.div>

      {/* CRM panel */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 28, delay: 0.3 }}
        style={{ width: '100%', maxWidth: 560, display: 'flex', justifyContent: 'center' }}
      >
        <CRMPanel isActive={isActive} sound={sound} />
      </motion.div>
    </div>
  );
}
