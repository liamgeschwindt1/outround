import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Inline SVG icons (Tabler-style) ─────────────────────────────────────────

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6a8 3 0 0 0 16 0v-6" />
      <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M8 9h8" />
      <path d="M8 13h6" />
      <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
    </svg>
  );
}

// ─── Workflow nodes ───────────────────────────────────────────────────────────

const NODES = [
  { label: 'Calendar', Icon: IconCalendar },
  { label: 'CRM',      Icon: IconDatabase },
  { label: 'Messaging', Icon: IconMessage },
];

function WorkflowNode({ label, Icon, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.38, ease: [0.0, 0.0, 0.2, 1], delay }}
      style={{
        background: 'linear-gradient(135deg, rgba(242,107,69,0.35), rgba(75,163,227,0.35))',
        padding: '0.5px',
        borderRadius: 10,
        flexShrink: 0,
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 9.5,
        padding: '18px 22px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        minWidth: 88,
      }}>
        <span style={{ color: 'rgba(242,241,239,0.55)', display: 'flex' }}>
          <Icon />
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: 'rgba(242,241,239,0.55)',
          whiteSpace: 'nowrap',
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
        maxWidth: 60,
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

// ─── Impact metric card ───────────────────────────────────────────────────────

function MetricCard({ label, value, accent, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1], delay }}
      style={{
        flex: '1 1 0',
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-md)',
        borderRadius: 12,
        padding: '24px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(26px, 4vw, 36px)',
        fontWeight: 700,
        color: accent,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'clamp(13px, 1.6vw, 14px)',
        color: 'var(--text-sub)',
        lineHeight: 1.55,
      }}>
        {label}
      </div>
    </motion.div>
  );
}

// ─── How steps ────────────────────────────────────────────────────────────────

const HOW_STEPS = [
  'Every prospect researched before your rep picks up the phone.',
  'Every call captured, structured, and filed the moment it ends.',
  'Every CRM field updated automatically, linked to the exact second it was said.',
  'Every pattern across your pipeline surfaced before you think to ask.',
  'Every conversation adding to an intelligence layer that gets sharper with every call.',
];

function fmtEur(n) {
  if (n >= 1000000) return '\u20ac' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '\u20ac' + Math.round(n / 1000) + 'k';
  return '\u20ac' + Math.round(n);
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function HowOutroundWorks() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [pipeline, setPipeline] = useState(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem('outround_pipeline');
      if (v) setPipeline(parseFloat(v));
    } catch (_) {}
  }, []);

  const EASE = { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] };

  return (
    <section
      id="how"
      ref={ref}
      style={{
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(80px, 12vw, 120px) 24px',
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

      <div style={{ width: '100%', maxWidth: 600 }}>

        {/* ── WHAT ──────────────────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...EASE, delay: 0 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 1.9vw, 18px)',
            color: 'var(--text-primary)',
            lineHeight: 1.75,
            margin: '0 0 32px',
          }}
        >
          Outround connects to your calendar, CRM, and messaging platform. 15 minutes to set up. Nothing changes in your workflow.
        </motion.p>

        {/* Workflow nodes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.25, delay: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}
        >
          {NODES.map((node, i) => (
            <div key={node.label} style={{ display: 'flex', alignItems: 'center', flex: i < NODES.length - 1 ? '1 1 0' : '0 0 auto' }}>
              <WorkflowNode label={node.label} Icon={node.Icon} delay={0.25 + i * 0.12} isInView={isInView} />
              {i < NODES.length - 1 && <Connector isInView={isInView} />}
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.35, delay: 0.65 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.07em',
            margin: '0 0 64px',
          }}
        >
          Connects in 15 minutes. Nothing else changes.
        </motion.p>

        {/* ── HOW ───────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 72 }}>
          {HOW_STEPS.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.8 + i * 0.1 }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(15px, 1.9vw, 18px)',
                color: i === 0 ? 'var(--text-primary)' : 'var(--text-sub)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* ── IMPACT ────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <MetricCard
            value="12.8h"
            label="lost per rep per week on admin and research"
            accent="var(--text-sub)"
            delay={1.4}
            isInView={isInView}
          />
          <MetricCard
            value="2 min"
            label="per rep per week with Outround"
            accent="var(--coral)"
            delay={1.55}
            isInView={isInView}
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 1.7 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(14px, 1.7vw, 16px)',
            color: 'var(--text-sub)',
            lineHeight: 1.7,
            margin: '0 0 12px',
          }}
        >
          That is 93% of your team&rsquo;s admin time recovered and redirected into conversations that close deals.
        </motion.p>

        {pipeline && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 1.85 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(14px, 1.7vw, 16px)',
              color: 'var(--text-primary)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Applied to your pipeline, that is{' '}
            <span style={{ color: 'var(--coral)', fontWeight: 700 }}>{fmtEur(pipeline)}</span>
            {' '}returned to your team every year.
          </motion.p>
        )}
        {!pipeline && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 1.85 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            Run the calculator above to see the exact figure for your team.
          </motion.p>
        )}

      </div>
    </section>
  );
}
