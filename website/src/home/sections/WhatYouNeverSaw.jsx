import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const STATEMENTS = [
  {
    headline: 'What your best rep does differently on every call.',
    body: 'Nobody logged it. Nobody taught it. It lives in the calls.',
  },
  {
    headline: 'Which objections keep killing deals and how often.',
    body: 'Your team has faced the same five objections 200 times this quarter. Nobody knows that yet.',
  },
  {
    headline: 'What prospects actually said versus what made it into the CRM.',
    body: 'The signal that could have saved the deal was in the conversation. It never reached the record.',
  },
];

export default function WhatYouNeverSaw() {
  const [visible, setVisible] = useState(0);
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          let count = 0;
          function show() {
            count++;
            setVisible(count);
            if (count < STATEMENTS.length) setTimeout(show, 1000);
          }
          setTimeout(show, 400);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="invisible"
      ref={ref}
      style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(64px, 10vw, 100px) 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 620 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 56,
        }}>
          The invisible layer
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {STATEMENTS.map((s, i) =>
            i < visible ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
              >
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(20px, 3vw, 28px)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  marginBottom: 10,
                }}>
                  {s.headline}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(14px, 1.8vw, 16px)',
                  color: 'var(--text-sub)',
                  lineHeight: 1.7,
                }}>
                  {s.body}
                </div>
              </motion.div>
            ) : null
          )}
        </div>

        {visible >= STATEMENTS.length && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              marginTop: 52,
              background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
              color: '#0a0a0b',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 700,
              padding: '14px 36px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 28px rgba(242,107,69,0.25)',
              minHeight: 44,
            }}
          >
            See how it works
          </motion.button>
        )}
      </div>
    </section>
  );
}
