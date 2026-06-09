import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function OutroundLogo() {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(242,107,69,0.4), rgba(75,163,227,0.4))',
        padding: 1,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
          }}
        />
      </div>
    </div>
  );
}

function SlackCard({ timestamp, children, onMount, style = {} }) {
  const onMountRef = useRef(onMount);
  useEffect(() => {
    onMountRef.current = onMount;
  });

  useEffect(() => {
    onMountRef.current?.();
  }, []);

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-md)',
        borderRadius: 12,
        borderLeft: '3px solid var(--coral)',
        padding: '20px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        position: 'relative',
        ...style,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <OutroundLogo />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            flex: 1,
          }}
        >
          Outround
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {timestamp}
        </span>
      </div>

      {children}
    </motion.div>
  );
}

SlackCard.propTypes = {
  timestamp: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onMount: PropTypes.func,
  style: PropTypes.object,
};

export default SlackCard;
