import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Integration network ──────────────────────────────────────────────────────

const ORBIT_ICONS = [
  { id: 'meets',   src: '/icons/meets.png',   label: 'Meet'    },
  { id: 'teams',   src: '/icons/teams.png',   label: 'Teams'   },
  { id: 'zoom',    src: '/icons/zoom.png',    label: 'Zoom'    },
  { id: 'apollo',  src: '/icons/apollo.png',  label: 'Apollo'  },
  { id: 'chat',    src: '/icons/chat.png',    label: 'Chat'    },
  { id: 'hubspot', src: '/icons/hubspot.png', label: 'HubSpot' },
  { id: 'slack',   src: '/icons/slack.png',   label: 'Slack'   },
];

const ORBIT_R = 110; // px, radius of the ring
const ORBIT_SIZE = (ORBIT_R + 40) * 2; // container fits ring + icon half-size
const ORBIT_DURATION = 28; // seconds for one full revolution

function IntegrationNetwork({ isInView }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '24px 0' }}>
      <div style={{ position: 'relative', width: ORBIT_SIZE, height: ORBIT_SIZE }}>

        {/* Rotating ring — each icon placed on the ring, counter-rotated to stay upright */}
        <motion.div
          animate={isInView ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
          }}
        >
          {ORBIT_ICONS.map((icon, i) => {
            const angle = (2 * Math.PI / ORBIT_ICONS.length) * i - Math.PI / 2;
            const x = ORBIT_SIZE / 2 + ORBIT_R * Math.cos(angle);
            const y = ORBIT_SIZE / 2 + ORBIT_R * Math.sin(angle);
            return (
              <motion.div
                key={icon.id}
                animate={isInView ? { rotate: -360 } : { rotate: 0 }}
                transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.img
                  src={icon.src}
                  alt={icon.label}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                  style={{ width: 40, height: 40, objectFit: 'contain', display: 'block', borderRadius: 10 }}
                />
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </div>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    text: 'Every prospect researched before your rep picks up the phone.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="12" y2="16"/>
      </svg>
    ),
  },
  {
    text: 'Every call captured, structured, and filed the moment it ends.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 18.5a6.5 6.5 0 0 0 6.5-6.5V8a6.5 6.5 0 0 0-13 0v4A6.5 6.5 0 0 0 12 18.5z"/>
        <line x1="12" y1="18.5" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
    ),
  },
  {
    text: 'Every CRM field updated automatically, linked to the exact second it was said.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 11A8 8 0 1 0 4.93 17"/>
        <polyline points="20 4 20 11 13 11"/>
      </svg>
    ),
  },
  {
    text: 'Every pattern across your pipeline surfaced before you think to ask.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    text: 'Every conversation adding to an intelligence layer that gets sharper with every call.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v4c0 1.656 4.03 3 9 3s9-1.344 9-3V5"/>
        <path d="M3 9v4c0 1.656 4.03 3 9 3s9-1.344 9-3V9"/>
        <path d="M3 13v4c0 1.656 4.03 3 9 3s9-1.344 9-3v-4"/>
      </svg>
    ),
  },
];

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtEur(n) {
  if (n >= 1000000) return '\u20ac' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '\u20ac' + Math.round(n / 1000) + 'k';
  return '\u20ac' + Math.round(n);
}

function fmtNum(n) {
  return Math.round(n).toLocaleString('en');
}

// ─── Impact stat ──────────────────────────────────────────────────────────────

function ImpactStat({ value, label, tone = 'muted', big = false }) {
  const color = tone === 'coral'
    ? 'var(--coral)'
    : tone === 'primary'
      ? 'var(--text-primary)'
      : 'var(--text-sub)';
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: big ? 'clamp(40px, 5.5vw, 58px)' : 'clamp(22px, 2.8vw, 28px)',
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.025em',
        color,
        marginBottom: 8,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function HowOutroundWorks() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [pipeline, setPipeline] = useState(null);
  const [numReps,  setNumReps]  = useState(null);
  const [missedCallsCycle, setMissedCallsCycle] = useState(null);

  useEffect(() => {
    const read = () => {
      try {
        const v = localStorage.getItem('outround_pipeline');
        if (v) setPipeline(parseFloat(v));
        const r = localStorage.getItem('outround_reps');
        if (r) setNumReps(parseInt(r, 10));
        const m = localStorage.getItem('outround_missed_cycle');
        if (m) setMissedCallsCycle(parseFloat(m));
      } catch (_) {}
    };
    read();
    const onCalc = (e) => {
      if (!e.detail) return read();
      setPipeline(e.detail.pipeline);
      setNumReps(e.detail.reps);
      setMissedCallsCycle(e.detail.missedCycle);
    };
    window.addEventListener('outround:calc', onCalc);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('outround:calc', onCalc);
      window.removeEventListener('storage', read);
    };
  }, []);

  const EASE        = { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] };
  const hasUserData = pipeline !== null;
  // Defaults model a 10-rep team if the calculator has not been run yet
  const dispReps        = numReps          || 10;
  const dispMissedCycle = missedCallsCycle || 480;  // 10 reps × ~48 missed/cycle
  const dispPipeline    = pipeline         || 4600000;
  const monthlyCost     = dispReps * 89;

  return (
    <section
      id="how"
      ref={ref}
      style={{
        background: '#0a0a0b',
        backgroundImage: 'radial-gradient(circle, rgba(242,241,239,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes how-pulse {
          0%   { transform: translateX(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(280%); opacity: 0; }
        }
      `}</style>

      {/* Corner metadata */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'clamp(40px, 6vw, 72px)',
        gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
          03 / How it works
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65,
          whiteSpace: 'nowrap',
        }}>
          {'/* brief \u00b7 capture \u00b7 update \u00b7 coordinate \u00b7 query */'}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 1200 }}>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* WHAT — 2-col: copy + workflow nodes */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div
          className="how-what-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            gap: 'clamp(40px, 6vw, 96px)',
            alignItems: 'center',
            marginBottom: 'clamp(80px, 10vw, 140px)',
          }}
        >
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={EASE}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--coral)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              What
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.1 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                margin: '0 0 20px',
              }}
            >
              Connects to the tools you already run on.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ ...EASE, delay: 0.2 }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(15px, 1.6vw, 17px)',
                color: 'var(--text-sub)',
                lineHeight: 1.7,
                margin: '0 0 20px',
                maxWidth: 440,
              }}
            >
              Outround sits behind your calendar, CRM, and messaging platform. 15 minutes to set up. Nothing changes in your workflow.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ ...EASE, delay: 0.3 }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.07em',
              }}
            >
              Connects in 15 minutes. Nothing else changes.
            </motion.div>
          </div>

          {/* Integration network */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...EASE, delay: 0.25 }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <IntegrationNetwork isInView={isInView} />
          </motion.div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* HOW — single-column list */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div
          className="how-steps-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            gap: 'clamp(40px, 6vw, 96px)',
            alignItems: 'start',
            marginBottom: 'clamp(80px, 10vw, 140px)',
          }}
        >
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={EASE}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--coral)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              How
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.1 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                margin: 0,
                maxWidth: 420,
              }}
            >
              Every conversation, captured and put to work.
            </motion.h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...EASE, delay: 0.3 + i * 0.08 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '18px 0',
                  borderBottom: i < HOW_STEPS.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                <span style={{
                  color: 'var(--coral)',
                  flexShrink: 0,
                  marginTop: 2,
                  opacity: 0.9,
                }}>
                  {step.icon}
                </span>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(16px, 1.8vw, 19px)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {step.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* IMPACT — before / after */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={EASE}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--coral)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 18,
              textAlign: 'left',
            }}
          >
            Impact
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...EASE, delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              margin: '0 0 16px',
              maxWidth: 640,
            }}
          >
            30 minutes of admin per call. Down to 2.
          </motion.h2>

          {/* Calculator gate */}
          {!hasUserData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ ...EASE, delay: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
                padding: '14px 18px',
                marginBottom: 36,
                background: 'rgba(242,107,69,0.06)',
                border: '0.5px solid rgba(242,107,69,0.35)',
                borderRadius: 10,
                maxWidth: 720,
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--coral)', letterSpacing: '0.14em',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>
                Your numbers first
              </span>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 14,
                color: 'var(--text-sub)', lineHeight: 1.5, flex: 1, minWidth: 220,
              }}>
                Run the calculator above to see this section calibrated to your team.
              </span>
              <button
                onClick={() => {
                  const el = document.getElementById('calculator');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  background: 'var(--coral)', color: '#0a0a0b',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                  padding: '8px 16px', borderRadius: 999, border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 36,
                }}
              >
                Run calculator ↑
              </button>
            </motion.div>
          )}
          {hasUserData && (
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--coral)', letterSpacing: '0.14em',
              textTransform: 'uppercase', marginBottom: 36, opacity: 0.85,
            }}>
              {'\u2713 Calibrated to your ' + dispReps + '-rep team'}
            </div>
          )}

          {/* Post-deployment statements */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...EASE, delay: 0.3 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 48,
            }}
          >
            {[
              { icon: '⏱', text: 'Brief delivered in Slack 15 minutes before every call.' },
              { icon: '⚡', text: 'CRM updated automatically before you leave your desk.' },
              { icon: '→',  text: 'Next steps assigned without you deciding them.' },
              { icon: '✓',  text: 'Zero calls lost to admin.' },
            ].map(({ icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...EASE, delay: 0.35 + i * 0.07 }}
                style={{
                  background: 'var(--bg-card)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  color: 'var(--coral)',
                  flexShrink: 0,
                  lineHeight: 1.4,
                  marginTop: 1,
                }}>
                  {icon}
                </span>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(14px, 1.5vw, 16px)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* The definitive sentence */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...EASE, delay: 0.7 }}
            style={{
              borderTop: '0.5px solid var(--border)',
              paddingTop: 36,
              marginTop: 24,
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.14em',
              textTransform: 'uppercase', marginBottom: 18,
            }}>
              What this means
            </div>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 2.8vw, 34px)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
              margin: 0,
              maxWidth: 880,
            }}>
              {hasUserData ? (
                <>
                  Outround gives your team{' '}
                  <span style={{ color: 'var(--coral)', fontWeight: 700 }}>{fmtEur(dispPipeline)}</span>
                  {' '}of selling time back every year. For{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {'\u20ac' + fmtNum(monthlyCost) + '/month'}
                  </span>
                  .
                </>
              ) : (
                <>The selling time you are losing is the selling time Outround gives back. Run the calculator above to see your figure.</>
              )}
            </p>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.06em',
              marginTop: 14,
            }}>
              {hasUserData
                ? (dispReps + ' seats \u00b7 \u20ac89/seat/month')
                : '/* numbers appear once you run the calculator above */'}
            </div>

            {/* Quality bridge */}
            <div style={{
              marginTop: 40,
              paddingTop: 28,
              borderTop: '0.5px solid var(--border)',
              maxWidth: 760,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-muted)', letterSpacing: '0.12em',
                textTransform: 'uppercase', marginBottom: 14,
                opacity: 0.75,
              }}>
                {'/* what this number does not capture */'}
              </div>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(14px, 1.5vw, 16px)',
                color: 'var(--text-sub)',
                lineHeight: 1.7,
                margin: 0,
                fontStyle: 'italic',
              }}>
                This calculation only accounts for time. It says nothing about what happens when your reps walk into every call better prepared, and your pipeline intelligence compounds with every conversation. We will let your numbers prove that part.
              </p>
            </div>
          </motion.div>
        </div>

      </div>

      <style>{`
        @media (max-width: 880px) {
          .how-what-grid, .how-steps-grid { grid-template-columns: 1fr !important; }
          .impact-grid { grid-template-columns: 1fr !important; }
          .impact-arrow { transform: rotate(90deg); margin: 4px auto; }
        }
      `}</style>
    </section>
  );
}
