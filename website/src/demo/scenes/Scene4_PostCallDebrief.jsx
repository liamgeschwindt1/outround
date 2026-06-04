import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlackCard from '../components/SlackCard';

const ITEMS = [
  'Budget freeze mentioned — Q3. Added to CRM.',
  'Salesforce came up twice. She\'s evaluating.',
  'Decision timeline moved to September.',
];

export default function Scene4_PostCallDebrief({ isActive, sound, dotGridRef }) {
  const [visibleItems, setVisibleItems] = useState(0);
  const [showCoaching, setShowCoaching] = useState(false);

  useEffect(() => {
    if (!isActive) { setVisibleItems(0); setShowCoaching(false); return; }

    let i = 0;
    function showNext() {
      if (i >= ITEMS.length) {
        setTimeout(() => {
          setShowCoaching(true);
          sound.play('success');
        }, 400);
        return;
      }
      setVisibleItems(i + 1);
      sound.play('click');
      i++;
      setTimeout(showNext, 800);
    }
    const t = setTimeout(showNext, 400);
    return () => clearTimeout(t);
  }, [isActive]);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 24 }}
      onClick={e => e.stopPropagation()}
    >
      <SlackCard timestamp="Just now" style={{ maxWidth: 440 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 14,
          }}
        >
          Call with Jana Novak — logged.
        </div>

        {ITEMS.map((item, i) => (
          <AnimatePresence key={i}>
            {i < visibleItems && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 8,
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: 'var(--coral)', flexShrink: 0 }}>→</span>
                <span>{item}</span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        <AnimatePresence>
          {showCoaching && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(242,107,69,0.08)',
                border: '0.5px solid rgba(242,107,69,0.4)',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--coral)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 6,
                }}
              >
                One thing differently next time
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                You lost frame at min 14 on pricing.
                <br />
                Acknowledge → redirect to ROI before price.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SlackCard>
    </div>
  );
}
