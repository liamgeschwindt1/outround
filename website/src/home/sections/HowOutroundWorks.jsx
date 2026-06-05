import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Inline SVG icons (Tabler-style) ─────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="4" y1="11" x2="20" y2="11" />
      <line x1="11" y1="15" x2="12" y2="15" />
      <line x1="12" y1="15" x2="12" y2="18" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6a8 3 0 0 0 16 0v-6" />
      <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M8 9h8" />
      <path d="M8 13h6" />
      <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
    </svg>
  );
}

const NODES = [
  { label: 'Calendar',  Icon: IconCalendar },
  { label: 'CRM',       Icon: IconDatabase },
  { label: 'Messaging', Icon: IconMessage },
];

function WorkflowNode({ label, Icon, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.38, ease: [0.0, 0.0, 0.2, 1], delay }}
      style={{
        background: 'linear-gradient(135deg, rgba(242,107,69,0.4), rgba(75,163,227,0.4))',
        padding: '0.5px',
        borderRadius: 12,
        flexShrink: 0,
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 11.5,
        padding: '22px 24px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        minWidth: 104,
      }}>
        <span style={{ color: 'rgba(242,241,239,0.65)', display: 'flex' }}>
          <Icon />
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          color: 'rgba(242,241,239,0.65)',
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
    </motion.div>
  );
}

function Connector({ isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3, delay: 0.5 }}
      style={{
        position: 'relative',
        flex: 1,
        height: 1,
        background: 'rgba(255,255,255,0.08)',
        alignSelf: 'center',
        overflow: 'hidden',
        borderRadius: 1,
        minWidth: 20,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '40%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(242,107,69,0.9), transparent)',
        animation: 'how-pulse 2.4s ease-in-out infinite',
        borderRadius: 1,
      }} />
    </motion.div>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────

const HOW_STEPS = [
  'Every prospect researched before your rep picks up the phone.',
  'Every call captured, structured, and filed the moment it ends.',
  'Every CRM field updated automatically, linked to the exact second it was said.',
  'Every pattern across your pipeline surfaced before you think to ask.',
  'Every conversation adding to an intelligence layer that gets sharper with every call.',
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
    try {
      const v = localStorage.getItem('outround_pipeline');
      if (v) setPipeline(parseFloat(v));
      const r = localStorage.getItem('outround_reps');
      if (r) setNumReps(parseInt(r, 10));
      const m = localStorage.getItem('outround_missed_cycle');
      if (m) setMissedCallsCycle(parseFloat(m));
    } catch (_) {}
  }, []);

  const EASE       = { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] };
  const monthlyCost = (numReps || 10) * 149;

  return (
    <section
      id="how"
      ref={ref}
      style={{
        background: 'var(--bg)',
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
          {'/* connect \u00b7 capture \u00b7 query */'}
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

          {/* Workflow nodes block */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...EASE, delay: 0.25 }}
            style={{
              background: 'var(--bg-sub)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              padding: 'clamp(28px, 4vw, 48px) clamp(24px, 3vw, 40px)',
              display: 'flex',
              alignItems: 'center',
              minHeight: 200,
            }}
          >
            {NODES.map((node, i) => (
              <div key={node.label} style={{
                display: 'flex',
                alignItems: 'center',
                flex: i < NODES.length - 1 ? '1 1 0' : '0 0 auto',
              }}>
                <WorkflowNode label={node.label} Icon={node.Icon} delay={0.4 + i * 0.12} isInView={isInView} />
                {i < NODES.length - 1 && <Connector isInView={isInView} />}
              </div>
            ))}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {HOW_STEPS.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...EASE, delay: 0.3 + i * 0.08 }}
                style={{
                  display: 'flex',
                  gap: 16,
                  paddingBottom: 14,
                  borderBottom: i < HOW_STEPS.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--coral)',
                  letterSpacing: '0.08em',
                  flexShrink: 0,
                  paddingTop: 4,
                  minWidth: 22,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(15px, 1.6vw, 17px)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {line}
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
              margin: '0 0 48px',
              maxWidth: 640,
            }}
          >
            The same team, with 93% more selling time.
          </motion.h2>

          <div
            className="impact-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
              gap: 'clamp(16px, 2.5vw, 32px)',
              alignItems: 'stretch',
              marginBottom: 48,
            }}
          >
            {/* BEFORE */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.3 }}
              style={{
                background: 'var(--bg-card)',
                border: '0.5px solid var(--border)',
                borderRadius: 14,
                padding: 'clamp(24px, 3vw, 36px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-muted)', letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>
                Without Outround
              </div>
              <ImpactStat
                value="12.8h"
                label="lost per rep, per week to admin and research"
                tone="muted"
              />
              <ImpactStat
                value={missedCallsCycle ? fmtNum(missedCallsCycle) : '\u2014'}
                label="conversations missed every sales cycle"
                tone="muted"
              />
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '4px 0' }} />
              <ImpactStat
                value={pipeline ? fmtEur(pipeline) : '\u2014'}
                label="annual pipeline at risk"
                tone="muted"
                big
              />
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...EASE, delay: 0.5 }}
              className="impact-arrow"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 32,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" stroke="var(--coral)"
                strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </motion.div>

            {/* AFTER */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.4 }}
              style={{
                background: 'linear-gradient(135deg, rgba(242,107,69,0.09), rgba(75,163,227,0.04))',
                border: '0.5px solid rgba(242,107,69,0.4)',
                borderRadius: 14,
                padding: 'clamp(24px, 3vw, 36px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                position: 'relative',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--coral)', letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>
                With Outround
              </div>
              <ImpactStat
                value="2 min"
                label="per rep, per week to confirm what was captured"
                tone="primary"
              />
              <ImpactStat
                value="100%"
                label="of conversations captured, structured, and filed"
                tone="primary"
              />
              <div style={{ height: '0.5px', background: 'rgba(242,107,69,0.2)', margin: '4px 0' }} />
              <ImpactStat
                value={pipeline ? fmtEur(pipeline) : '\u2014'}
                label="annual pipeline recovered for your team"
                tone="coral"
                big
              />
            </motion.div>
          </div>

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
              {pipeline ? (
                <>
                  Outround returns{' '}
                  <span style={{ color: 'var(--coral)', fontWeight: 700 }}>{fmtEur(pipeline)}</span>
                  {' '}of pipeline to your team every year &mdash; for{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {'\u20ac' + fmtNum(monthlyCost) + '/month'}
                  </span>
                  .
                </>
              ) : (
                <>The pipeline you are losing is the pipeline Outround returns. Run the calculator above to see your figure.</>
              )}
            </p>
            {pipeline && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-muted)', letterSpacing: '0.06em',
                marginTop: 14,
              }}>
                {(numReps || 10) + ' seats \u00b7 \u20ac149/seat/month \u00b7 pays back in week one'}
              </div>
            )}
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
