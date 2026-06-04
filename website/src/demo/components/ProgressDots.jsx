import { motion, AnimatePresence } from 'framer-motion';

const SCENES = [
  'Incoming brief',
  'Pre-meeting brief',
  'The meeting',
  'Post-call debrief',
  'CRM updating',
  'Rep profile',
  'Manager brief',
  'Intelligence orb',
];

export default function ProgressDots({ current }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        zIndex: 20,
      }}
      role="tablist"
      aria-label="Demo progress"
    >
      {SCENES.map((label, i) => (
        <div
          key={i}
          role="tab"
          aria-selected={i === current}
          aria-label={label}
          style={{ position: 'relative', width: 6, height: 6 }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#f2f1ef',
              opacity: i === current ? 1 : 0.25,
            }}
          />
          <AnimatePresence>
            {i === current && (
              <motion.div
                key="active"
                initial={{ scale: 0 }}
                animate={{ scale: 1.4 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: '#f26b45',
                }}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
