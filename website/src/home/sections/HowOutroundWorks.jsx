import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const EASE = { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] };

// ─── Integration icons (static strip) ─────────────────────────────────────────

const STACK_ICONS = [
  { id: 'meets', src: '/icons/meets.png', label: 'Meet' },
  { id: 'teams', src: '/icons/teams.png', label: 'Teams' },
  { id: 'zoom', src: '/icons/zoom.png', label: 'Zoom' },
  { id: 'apollo', src: '/icons/apollo.png', label: 'Apollo' },
  { id: 'chat', src: '/icons/chat.png', label: 'Chat' },
  { id: 'hubspot', src: '/icons/hubspot.png', label: 'HubSpot' },
  { id: 'slack', src: '/icons/slack.png', label: 'Slack' },
];

// ─── Three phases of a call ───────────────────────────────────────────────────

const PHASES = [
  {
    label: 'Before the call',
    title: 'The brief arrives.',
    body: '15 minutes before every meeting, Outround delivers a brief to your messaging platform. Account history, prior objections, deal risks, and the next-best questions. No dashboard. No searching. It arrives.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'During and after',
    title: 'The record writes itself.',
    body: 'Every call captured. Every CRM field updated automatically, linked to the exact line that generated it. Follow-up drafted. Next steps set. Before you leave your desk.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 18.5a6.5 6.5 0 0 0 6.5-6.5V8a6.5 6.5 0 0 0-13 0v4A6.5 6.5 0 0 0 12 18.5z" />
        <line x1="12" y1="18.5" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    label: 'Over time',
    title: 'The intelligence compounds.',
    body: 'Every conversation deepens the layer beneath your pipeline. Patterns surface. Deal risks get flagged. The system remembers everything your team has ever learned, and gets sharper with every call.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function HowOutroundWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="how"
      ref={ref}
      style={{
        background: '#111114',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      {/* Corner metadata */}
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(40px, 5vw, 56px)',
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--coral)',
              opacity: 0.8,
            }}
          />
          02 / HOW IT WORKS
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            opacity: 0.65,
            whiteSpace: 'nowrap',
          }}
        >
          {'/* before \u00b7 during \u00b7 after */'}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 1200 }}>
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={EASE}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            margin: '0 0 clamp(48px, 6vw, 72px)',
            maxWidth: 720,
          }}
        >
          One system, around every conversation your team has.
        </motion.h2>

        {/* Three phases */}
        <div
          className="how-phases-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 'clamp(24px, 3vw, 40px)',
            marginBottom: 'clamp(56px, 7vw, 88px)',
          }}
        >
          {PHASES.map((phase, i) => (
            <motion.div
              key={phase.label}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...EASE, delay: 0.15 + i * 0.12 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                paddingTop: 28,
                borderTop: '1px solid rgba(242,107,69,0.3)',
              }}
            >
              <span style={{ color: 'var(--coral)' }}>{phase.icon}</span>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {phase.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(19px, 2.2vw, 24px)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                {phase.title}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(14px, 1.5vw, 15px)',
                  color: 'var(--text-sub)',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {phase.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Integration strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ ...EASE, delay: 0.5 }}
          style={{
            borderTop: '0.5px solid var(--border)',
            paddingTop: 'clamp(32px, 4vw, 44px)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: 'var(--text-sub)',
              lineHeight: 1.5,
              maxWidth: 360,
            }}
          >
            Sits behind your calendar, CRM, and messaging.
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                marginTop: 6,
              }}
            >
              15 minutes to set up. Nothing else changes.
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            {STACK_ICONS.map((icon) => (
              <img
                key={icon.id}
                src={icon.src}
                alt={icon.label}
                style={{
                  width: 36,
                  height: 36,
                  objectFit: 'contain',
                  borderRadius: 9,
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .how-phases-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
