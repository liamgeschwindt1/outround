import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const REPS = [
  {
    initial: 'D',
    gradient: 'linear-gradient(135deg, #4ba3e3, #22c55e)',
    name: 'Daan',
    role: 'Account Executive',
    calls: 47,
    pattern: 'Loses frame on pricing in 68% of deals',
    patternColor: 'var(--amber)',
    patternIcon: '⚠',
    offset: 0,
  },
  {
    initial: 'J',
    gradient: 'linear-gradient(135deg, #f26b45, #f59e0b)',
    name: 'Jana',
    role: 'Account Executive',
    calls: 39,
    pattern: 'Strong opener — discovery score 8.4/10',
    patternColor: 'var(--green)',
    patternIcon: '✓',
    offset: -24,
  },
  {
    initial: 'L',
    gradient: 'linear-gradient(135deg, #4ba3e3, #f26b45)',
    name: 'Lotte',
    role: 'SDR',
    calls: 61,
    pattern: 'Talk ratio above team average on 80% of calls',
    patternColor: 'var(--coral)',
    patternIcon: '→',
    offset: 0,
  },
];

// Flat-top hexagon via clip-path
function HexAvatar({ initial, gradient }) {
  return (
    <div style={{ position: 'relative', width: 46, height: 40, flexShrink: 0 }}>
      {/* Outer hex (border) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: gradient,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      }} />
      {/* Inner hex (bg fill) */}
      <div style={{
        position: 'absolute',
        inset: 2,
        background: 'var(--bg-card)',
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 700,
          background: gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}>
          {initial}
        </span>
      </div>
    </div>
  );
}

function RepCard({ rep, delay, isInView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1], delay }}
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-md)',
        borderRadius: 12,
        padding: '20px 22px',
        flex: '1 1 220px',
        marginTop: rep.offset,
        minWidth: 0,
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <HexAvatar initial={rep.initial} gradient={rep.gradient} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {rep.name}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>
            {rep.role}
          </div>
        </div>
      </div>

      {/* Calls stat */}
      <div style={{ marginBottom: 12 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {rep.calls} calls captured
        </span>
      </div>

      {/* Pattern */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        background: 'var(--bg)',
        border: '0.5px solid var(--border)',
        borderRadius: 6,
        padding: '8px 10px',
      }}>
        <span style={{ color: rep.patternColor, fontSize: 13, flexShrink: 0 }}>{rep.patternIcon}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.5 }}>
          {rep.pattern}
        </span>
      </div>
    </motion.div>
  );
}

export default function ManagerDashboard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="team"
      ref={ref}
      style={{
        background: 'var(--bg-sub)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(64px, 10vw, 100px) 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 820 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Your team, visible for the first time
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          marginBottom: 48,
        }}>
          Every rep. Every pattern. Every call.
        </div>

        {/* Rep cards */}
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          marginBottom: 48,
        }}>
          {REPS.map((rep, i) => (
            <RepCard key={rep.name} rep={rep} delay={i * 0.12} isInView={isInView} />
          ))}
        </div>

        {/* Callout stat */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.45 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 3vw, 26px)',
            fontWeight: 700,
            color: 'var(--coral)',
            marginBottom: 40,
          }}
        >
          Team close rate this week: +12% vs last week
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.6 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
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
          Get early access
        </motion.button>
      </div>
    </section>
  );
}
