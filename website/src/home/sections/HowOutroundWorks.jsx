import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Integration network ──────────────────────────────────────────────────────

const NET_W = 520;
const NET_H = 290;

const NET_NODES = [
  { id: 'meets',   src: '/icons/meets.png',   label: 'Meet',    cx: 85,  cy: 46  },
  { id: 'teams',   src: '/icons/teams.png',   label: 'Teams',   cx: 435, cy: 46  },
  { id: 'slack',   src: '/icons/slack.png',   label: 'Slack',   cx: 30,  cy: 150 },
  { id: 'zoom',    src: '/icons/zoom.png',    label: 'Zoom',    cx: 490, cy: 150 },
  { id: 'hubspot', src: '/icons/hubspot.png', label: 'HubSpot', cx: 85,  cy: 254 },
  { id: 'apollo',  src: '/icons/apollo.png',  label: 'Apollo',  cx: 435, cy: 254 },
  { id: 'chat',    src: '/icons/chat.png',    label: 'Chat',    cx: 260, cy: 272 },
];

const HUB = { cx: 260, cy: 138 };

const EDGES = [
  { a: 'meets',   b: 'hub',     dur: 2.2, delay: 0.0 },
  { a: 'teams',   b: 'hub',     dur: 2.8, delay: 0.5 },
  { a: 'slack',   b: 'hub',     dur: 2.5, delay: 0.9 },
  { a: 'zoom',    b: 'hub',     dur: 2.1, delay: 0.3 },
  { a: 'hubspot', b: 'hub',     dur: 2.9, delay: 0.7 },
  { a: 'apollo',  b: 'hub',     dur: 2.3, delay: 1.1 },
  { a: 'chat',    b: 'hub',     dur: 2.6, delay: 0.4 },
  { a: 'meets',   b: 'teams',   dur: 3.6, delay: 1.3 },
  { a: 'slack',   b: 'hubspot', dur: 3.3, delay: 1.7 },
  { a: 'zoom',    b: 'apollo',  dur: 3.5, delay: 2.0 },
  { a: 'hubspot', b: 'chat',    dur: 3.1, delay: 2.3 },
  { a: 'chat',    b: 'apollo',  dur: 3.0, delay: 2.6 },
];

function getNetNode(id) {
  if (id === 'hub') return HUB;
  return NET_NODES.find(n => n.id === id);
}

function IntegrationNetwork({ isInView }) {
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: `${NET_W} / ${NET_H}` }}>
      {/* SVG lines layer */}
      <svg
        viewBox={`0 0 ${NET_W} ${NET_H}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="netHubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(242,107,69,0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Soft glow around hub */}
        <circle cx={HUB.cx} cy={HUB.cy} r={60} fill="url(#netHubGlow)" />

        {/* Edges */}
        {EDGES.map((edge, i) => {
          const a = getNetNode(edge.a);
          const b = getNetNode(edge.b);
          const pathD = `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}`;
          const pathDRev = `M ${b.cx} ${b.cy} L ${a.cx} ${a.cy}`;
          return (
            <g key={i}>
              <path d={pathD} stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" />
              {isInView && (
                <circle r="2.8" fill="rgba(242,107,69,0.9)">
                  <animateMotion dur={`${edge.dur}s`} repeatCount="indefinite" begin={`${edge.delay}s`} path={pathD} />
                </circle>
              )}
              {isInView && (
                <circle r="1.6" fill="rgba(75,163,227,0.65)">
                  <animateMotion dur={`${edge.dur * 1.4}s`} repeatCount="indefinite" begin={`${edge.delay + edge.dur * 0.6}s`} path={pathDRev} />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Integration icon nodes */}
      {NET_NODES.map((node, i) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.07, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            position: 'absolute',
            left: `${(node.cx / NET_W) * 100}%`,
            top: `${(node.cy / NET_H) * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <div style={{
            background: 'var(--bg-card)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '9px 9px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}>
            <img src={node.src} alt={node.label} width={26} height={26} style={{ objectFit: 'contain', display: 'block' }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.08em',
              color: 'rgba(242,241,239,0.45)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {node.label}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Hub node — Outround */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          position: 'absolute',
          left: `${(HUB.cx / NET_W) * 100}%`,
          top: `${(HUB.cy / NET_H) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, rgba(242,107,69,0.15), rgba(75,163,227,0.15))',
          border: '0.5px solid rgba(242,107,69,0.45)',
          borderRadius: 12,
          padding: '11px 18px 9px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--coral)',
            letterSpacing: '-0.01em',
          }}>Outround</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            letterSpacing: '0.1em',
            color: 'rgba(242,241,239,0.35)',
            textTransform: 'uppercase',
          }}>intelligence layer</span>
        </div>
      </motion.div>
    </div>
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
  const monthlyCost     = dispReps * 149;

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

          {/* Integration network */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...EASE, delay: 0.25 }}
            style={{
              background: 'var(--bg-sub)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              padding: 'clamp(20px, 3vw, 36px)',
            }}
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

          <div
            className="impact-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
              gap: 'clamp(16px, 2.5vw, 32px)',
              alignItems: 'stretch',
              marginBottom: 48,
              position: 'relative',
              filter: hasUserData ? 'none' : 'blur(3px) saturate(0.7)',
              opacity: hasUserData ? 1 : 0.55,
              pointerEvents: hasUserData ? 'auto' : 'none',
              transition: 'filter 0.4s ease, opacity 0.4s ease',
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
                value={fmtNum(dispMissedCycle)}
                label="conversations missed every sales cycle"
                tone="muted"
              />
              <div style={{ height: '0.5px', background: 'var(--border)', margin: '4px 0' }} />
              <ImpactStat
                value={fmtEur(dispPipeline)}
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
                label="per call to confirm what was captured"
                tone="primary"
              />
              <ImpactStat
                value="100%"
                label="of conversations captured, structured, and filed"
                tone="primary"
              />
              <div style={{ height: '0.5px', background: 'rgba(242,107,69,0.2)', margin: '4px 0' }} />
              <ImpactStat
                value={fmtEur(dispPipeline)}
                label="your team now has time to create"
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
                ? (dispReps + ' seats \u00b7 \u20ac149/seat/month')
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
