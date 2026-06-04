import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlackCard from '../components/SlackCard';

const CALLS = [
  { text: 'Mollie deal: Lost frame on pricing min 14' },
  { text: 'Adyen call: Handled competitor well' },
  { text: 'ABN AMRO: Decision maker not on call' },
];

export default function Scene7_ManagerBrief({ isActive, sound }) {
  const [visibleCalls, setVisibleCalls] = useState(0);
  const [showSeparator, setShowSeparator] = useState(false);
  const [showFinale, setShowFinale] = useState(false);

  useEffect(() => {
    if (!isActive) { setVisibleCalls(0); setShowSeparator(false); setShowFinale(false); return; }

    let i = 0;
    function next() {
      if (i >= CALLS.length) {
        setTimeout(() => {
          setShowSeparator(true);
          setTimeout(() => {
            setShowFinale(true);
            sound.play('success');
          }, 300);
        }, 300);
        return;
      }
      setVisibleCalls(i + 1);
      i++;
      setTimeout(next, 150);
    }
    const t = setTimeout(next, 300);
    return () => clearTimeout(t);
  }, [isActive]);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 24 }}
      onClick={e => e.stopPropagation()}
    >
      <SlackCard timestamp="Before your 1:1" style={{ maxWidth: 460 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Before your 1:1 with Daan — 3 calls this week
        </div>

        {CALLS.map((call, i) => (
          i < visibleCalls ? (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span style={{ color: 'var(--coral)', flexShrink: 0 }}>→</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
                {call.text}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--coral)',
                  border: '0.5px solid rgba(242,107,69,0.5)',
                  borderRadius: 999,
                  padding: '2px 8px',
                  cursor: 'default',
                  transition: 'transform 0.15s',
                  flexShrink: 0,
                  minHeight: 22,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                clip
              </span>
            </motion.div>
          ) : null
        ))}

        <AnimatePresence>
          {showSeparator && (
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              style={{
                height: '0.5px',
                background: 'var(--border-md)',
                marginBottom: 14,
                transformOrigin: 'left',
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFinale && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--coral)',
              }}
            >
              Team close rate this week: +12% vs last week
            </motion.div>
          )}
        </AnimatePresence>
      </SlackCard>
    </div>
  );
}
