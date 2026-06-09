import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const TOTAL_BLOCKS = 3;
const EASE = { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] };

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
            if (count < TOTAL_BLOCKS) setTimeout(show, 700);
          }
          setTimeout(show, 300);
        }
      },
      { threshold: 0.15 }
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
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 52,
          }}
        >
          Why Outround?
        </div>

        {visible >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={EASE}
            style={{ marginBottom: 52 }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(15px, 1.9vw, 18px)',
                color: 'var(--text-primary)',
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              Your best rep closes differently to everyone else on your team. You have never been
              able to explain exactly why. The answer is in the calls. Every objection handled,
              every prospect signal, every moment a deal turned.{' '}
              <span style={{ color: 'var(--text-sub)' }}>
                Unstructured. Unsearchable. Gone by Monday.
              </span>
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(16px, 2vw, 19px)',
                fontWeight: 700,
                color: 'var(--coral)',
                margin: '20px 0 0',
              }}
            >
              Outround changes that.
            </p>
          </motion.div>
        )}

        {visible >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={EASE}
            style={{ marginBottom: 52 }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              For your team
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[
                'No more logging calls after every meeting.',
                'No more guessing what a prospect actually cared about.',
                'No more starting from scratch before the next conversation.',
              ].map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{ color: 'var(--coral)', fontSize: 13, marginTop: 3, flexShrink: 0 }}
                  >
                    —
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'clamp(14px, 1.8vw, 16px)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(13px, 1.6vw, 15px)',
                color: 'var(--text-sub)',
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              Outround updates the CRM automatically, builds a profile of every prospect from every
              interaction, and gives each rep a clear picture of where they win and where they lose
              deals. Less admin. Better preparation. A personal record that improves with every
              call.
            </p>
          </motion.div>
        )}

        {visible >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={EASE}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              For you
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {[
                'See the objections killing your pipeline this quarter.',
                'Identify who handles pricing better than anyone and understand exactly how.',
                'Spot the pattern between your fastest-closing deals before your next forecast.',
              ].map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--sky)', fontSize: 13, marginTop: 3, flexShrink: 0 }}>
                    —
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'clamp(14px, 1.8vw, 16px)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                    }}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(13px, 1.6vw, 15px)',
                color: 'var(--text-sub)',
                lineHeight: 1.75,
                margin: '0 0 8px',
              }}
            >
              Not a dashboard of vanity metrics. A queryable intelligence layer built from every
              conversation your team has ever had.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(14px, 1.8vw, 17px)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '18px 0 0',
                lineHeight: 1.5,
              }}
            >
              The insight was always there.
              <br />
              <span style={{ color: 'var(--text-sub)' }}>Now it is findable.</span>
            </p>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.3 }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                marginTop: 40,
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
          </motion.div>
        )}
      </div>
    </section>
  );
}
