import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Tabler-style inline SVG icons ────────────────────────────────────────────

function IconCalendar() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M4 11h16" />
      <path d="M11 15h1" />
      <path d="M12 15v3" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6a8 3 0 0 0 16 0v-6" />
      <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8 9h8" />
      <path d="M8 13h6" />
      <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
    </svg>
  );
}

// ─── Workflow node card with gradient border ──────────────────────────────────

const NODES = [
  { label: 'Calendar', Icon: IconCalendar },
  { label: 'CRM', Icon: IconDatabase },
  { label: 'Messaging', Icon: IconMessage },
];

function WorkflowNode({ label, Icon, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1], delay }}
      style={{
        /* gradient border via wrapper + inset */
        background: 'linear-gradient(135deg, rgba(242,107,69,0.35), rgba(75,163,227,0.35))',
        padding: '0.5px',
        borderRadius: 10,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 9.5,
          padding: '18px 22px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          minWidth: 92,
        }}
      >
        <span style={{ color: 'rgba(242,241,239,0.55)', display: 'flex' }}>
          <Icon />
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'rgba(242,241,239,0.55)',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Connector with travelling coral pulse ────────────────────────────────────

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
        minWidth: 24,
        maxWidth: 72,
      }}
    >
      {/* Travelling pulse */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '40%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(242,107,69,0.9), transparent)',
          animation: 'orw-pulse 2.4s ease-in-out infinite',
          borderRadius: 1,
        }}
      />
    </motion.div>
  );
}

// ─── Step list ────────────────────────────────────────────────────────────────

const STEPS = [
  'Every prospect researched before your rep picks up the phone.',
  'Every call captured, structured, and filed the moment it ends.',
  'Every CRM field updated automatically, linked to the exact second it was said.',
  'Every pattern across your pipeline surfaced before you think to ask.',
  'Every conversation adding to an intelligence layer that gets sharper with every call.',
];

// ─── Section ──────────────────────────────────────────────────────────────────

export default function IntegrationWorkflow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="integration"
      ref={ref}
      style={{
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(64px, 10vw, 96px) 24px',
      }}
    >
      {/* keyframe injected once */}
      <style>{`
        @keyframes orw-pulse {
          0%   { transform: translateX(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(280%); opacity: 0; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Lead-in line */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 1.9vw, 18px)',
            color: 'var(--text-primary)',
            lineHeight: 1.75,
            margin: '0 0 36px',
          }}
        >
          Everything happens inside your existing workflow.
        </motion.p>

        {/* Workflow nodes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.15 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginBottom: 20,
          }}
        >
          {NODES.map((node, i) => (
            <>
              <WorkflowNode
                key={node.label}
                label={node.label}
                Icon={node.Icon}
                delay={0.2 + i * 0.12}
                isInView={isInView}
              />
              {i < NODES.length - 1 && <Connector key={`c-${i}`} isInView={isInView} />}
            </>
          ))}
        </motion.div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.55 }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
            margin: '0 0 44px',
          }}
        >
          Connects in 15 minutes. Nothing else changes.
        </motion.p>

        {/* Step-by-step lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {STEPS.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1], delay: 0.65 + i * 0.1 }}
              style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
            >
              <span
                style={{
                  color: 'var(--coral)',
                  fontSize: 13,
                  marginTop: 3,
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                —
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(14px, 1.8vw, 16px)',
                  color: 'var(--text-sub)',
                  lineHeight: 1.65,
                }}
              >
                {line}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
