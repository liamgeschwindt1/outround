import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import RepRadar from '../components/RepRadar';

const PATTERNS = [
  { icon: '⚠', color: 'var(--amber)', text: 'Loses frame on pricing — 68% of deals' },
  { icon: '✓', color: 'var(--green)', text: 'Strong opener — discovery score 8.4/10' },
  { icon: '→', color: 'var(--coral)', text: 'Talks 67% of call — above team average' },
];

function Scene6_RepProfile({ isActive, sound }) {
  const [showPatterns, setShowPatterns] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let cancelled = false;
    let i = 0;
    function next() {
      if (cancelled) return;
      if (i >= PATTERNS.length) return;
      setShowPatterns(i + 1);
      sound.play('click');
      i++;
      setTimeout(next, 150);
    }
    const t = setTimeout(next, 900);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setShowPatterns(0);
    };
  }, [isActive, sound]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 24,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border-md)',
          borderRadius: 12,
          padding: '24px',
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(75,163,227,0.3), rgba(34,197,94,0.3))',
                padding: 1.5,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4ba3e3, #22c55e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                D
              </div>
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Daan
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-sub)' }}>
              Account Executive · 47 calls captured
            </div>
          </div>
        </div>

        {/* Radar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <RepRadar size={200} animated={isActive} />
        </div>

        {/* Patterns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PATTERNS.map((p, i) =>
            i < showPatterns ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                }}
              >
                <span style={{ color: p.color, fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
                <span
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-sub)' }}
                >
                  {p.text}
                </span>
              </motion.div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

Scene6_RepProfile.propTypes = {
  isActive: PropTypes.bool.isRequired,
  sound: PropTypes.object.isRequired,
};

export default Scene6_RepProfile;
