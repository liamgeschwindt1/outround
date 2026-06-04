import { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

function WaveformIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M2 16 Q4 8 6 16 Q8 24 10 16 Q12 8 14 16 Q16 24 18 16 Q20 8 22 16 Q24 24 26 16 Q28 8 30 16"
        stroke="#f26b45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NodeGraphIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="3" stroke="#4ba3e3" strokeWidth="2" />
      <circle cx="6" cy="8" r="2.5" stroke="#4ba3e3" strokeWidth="2" />
      <circle cx="26" cy="8" r="2.5" stroke="#4ba3e3" strokeWidth="2" />
      <circle cx="6" cy="24" r="2.5" stroke="#4ba3e3" strokeWidth="2" />
      <circle cx="26" cy="24" r="2.5" stroke="#4ba3e3" strokeWidth="2" />
      <line x1="13.3" y1="14.3" x2="8" y2="10" stroke="#4ba3e3" strokeWidth="1.5" />
      <line x1="18.7" y1="14.3" x2="24" y2="10" stroke="#4ba3e3" strokeWidth="1.5" />
      <line x1="13.3" y1="17.7" x2="8" y2="22" stroke="#4ba3e3" strokeWidth="1.5" />
      <line x1="18.7" y1="17.7" x2="24" y2="22" stroke="#4ba3e3" strokeWidth="1.5" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f26b45" />
          <stop offset="100%" stopColor="#4ba3e3" />
        </linearGradient>
      </defs>
      <path d="M18 3L8 18h8l-2 11 14-16h-9l3-10z"
        stroke="url(#bolt-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepCard({ icon, title, body, delay, isInView }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1], delay }}
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-md)',
        borderRadius: 16,
        padding: 32,
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: 20 }}>{icon}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--text-sub)',
          lineHeight: 1.7,
          whiteSpace: 'pre-line',
        }}
      >
        {body}
      </div>
    </motion.div>
  );
}

const STEPS = [
  {
    icon: <WaveformIcon />,
    title: 'Before the call',
    body: 'A brief lands in your rep\'s Slack 15 minutes before every meeting. Built from everything known about this person — their company, previous conversations, what matters to them. No research required.',
  },
  {
    icon: <NodeGraphIcon />,
    title: 'During the call',
    body: 'Outround joins automatically and captures everything. Your rep stays focused on the conversation. Nothing changes on their end.',
  },
  {
    icon: <LightningIcon />,
    title: 'After the call',
    body: 'The CRM updates itself. The rep gets a debrief. The manager gets a brief before their next 1:1. The intelligence compounds with every call.',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      style={{
        background: 'var(--bg-sub)',
        padding: 'clamp(80px, 10vw, 120px) 24px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Section label */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          How it works
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            marginBottom: 48,
          }}
        >
          Three moments. Fully automatic. Nothing to configure.
        </div>

        {/* Steps */}
        <div
          ref={ref}
          style={{
            display: 'flex',
            gap: 0,
            alignItems: 'stretch',
            flexWrap: 'wrap',
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flex: '1 1 260px',
                minWidth: 0,
                alignItems: 'stretch',
              }}
            >
              <StepCard {...step} delay={i * 0.15} isInView={isInView} />
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    width: 1,
                    alignSelf: 'stretch',
                    background: 'var(--coral)',
                    opacity: 0.3,
                    margin: '32px 0',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Bridge sentence */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{
            marginTop: 40,
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          Works with HubSpot, Pipedrive, and Slack. Set up in under 10 minutes.
        </motion.div>

        {/* Demo bridge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.75 }}
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--coral)',
          }}
        >
          See the full loop in action. ↓
        </motion.div>
      </div>
    </section>
  );
}
