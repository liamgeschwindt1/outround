import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

function WaveformBar({ delay }) {
  return (
    <motion.div
      animate={{ scaleY: [0.3, 1, 0.3] }}
      transition={{ duration: 0.8, delay, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: 3,
        height: 24,
        borderRadius: 2,
        background: 'linear-gradient(180deg, var(--coral), var(--sky))',
        transformOrigin: 'center',
      }}
    />
  );
}

function Avatar({ initial, gradient, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {initial}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          color: 'var(--text-sub)',
          textAlign: 'center',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function Scene3_TheMeeting({ isActive }) {
  const [seconds, setSeconds] = useState(0);
  const [jumped, setJumped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    const jumpTimer = setTimeout(() => {
      clearInterval(timerRef.current);
      setJumped(true);
      setSeconds(24 * 60 + 17);
    }, 3000);

    const hintTimer = setTimeout(() => setShowHint(true), 2000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(jumpTimer);
      clearTimeout(hintTimer);
      setSeconds(0);
      setJumped(false);
      setShowHint(false);
    };
  }, [isActive]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        gap: 32,
        padding: 24,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Avatars + waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Avatar
          initial="J"
          gradient="linear-gradient(135deg, #f26b45, #f59e0b)"
          label="Jana Novak"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40 }}>
          {[0, 0.15, 0.3, 0.15, 0].map((delay, i) => (
            <WaveformBar key={i} delay={delay} />
          ))}
        </div>
        <Avatar
          initial="D"
          gradient="linear-gradient(135deg, #4ba3e3, #22c55e)"
          label="Daan · AE"
        />
      </div>

      {/* Timer */}
      <motion.div
        key={seconds}
        initial={{ opacity: jumped ? 0 : 1, y: jumped ? -4 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 32,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '0.05em',
        }}
      >
        {formatTime(seconds)}
      </motion.div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: 56,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            Click to end meeting
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

WaveformBar.propTypes = {
  delay: PropTypes.number.isRequired,
};

Avatar.propTypes = {
  initial: PropTypes.string.isRequired,
  gradient: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

Scene3_TheMeeting.propTypes = {
  isActive: PropTypes.bool.isRequired,
};

export default Scene3_TheMeeting;
