import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const EASE = { duration: 0.5, ease: [0.0, 0.0, 0.2, 1] };

const TIERS = [
  {
    name: 'Founder',
    price: '\u20ac49',
    unit: '/month',
    blurb: 'Solo founders doing their own sales.',
    features: [
      '1 seat \u00b7 unlimited meetings',
      'Pre-meeting brief in Slack',
      'Automatic CRM completion',
      'Follow-up drafting',
      'Basic memory timeline',
    ],
    highlighted: false,
  },
  {
    name: 'Team',
    price: '\u20ac89',
    unit: '/seat/month',
    blurb: '2 to 50 person sales teams. The coordination layer.',
    features: [
      'Everything in Founder, plus:',
      'Manager weekly digest',
      'Cross-call intelligence',
      'Deal risk detection',
      'Coordination workflows',
      'Team memory + search',
    ],
    highlighted: true,
  },
];

function Check() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 3 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TierCard({ tier, isInView, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...EASE, delay }}
      style={{
        background: tier.highlighted
          ? 'linear-gradient(135deg, rgba(242,107,69,0.06), rgba(75,163,227,0.03))'
          : 'rgba(255,255,255,0.02)',
        border: tier.highlighted ? '0.5px solid rgba(242,107,69,0.4)' : '0.5px solid var(--border)',
        borderRadius: 16,
        padding: 'clamp(28px, 3.5vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: tier.highlighted ? 'var(--coral)' : 'var(--text-muted)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          {tier.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 48px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {tier.price}
          </span>
          <span
            style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}
          >
            {tier.unit}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--text-sub)',
            lineHeight: 1.5,
          }}
        >
          {tier.blurb}
        </div>
      </div>

      <div style={{ height: '0.5px', background: 'var(--border)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {tier.features.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: tier.highlighted ? 'var(--coral)' : 'var(--text-muted)' }}>
              <Check />
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: i === 0 && tier.highlighted ? 'var(--text-muted)' : 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              {f}
            </span>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
        style={
          tier.highlighted
            ? {
                background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
                color: '#0a0a0b',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 700,
                padding: '14px 24px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                minHeight: 48,
                boxShadow: '0 0 28px rgba(242,107,69,0.22)',
              }
            : {
                background: 'transparent',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 600,
                padding: '13px 24px',
                borderRadius: 999,
                border: '0.5px solid var(--border-md)',
                cursor: 'pointer',
                minHeight: 48,
              }
        }
      >
        Start 14-day trial
      </motion.button>
    </motion.div>
  );
}

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="pricing"
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
          maxWidth: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(40px, 6vw, 56px)',
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
          07 / PRICING
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
          {'/* self-serve \u00b7 no sales call */'}
        </div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={EASE}
        style={{
          width: '100%',
          maxWidth: 1000,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          margin: '0 0 clamp(40px, 5vw, 56px)',
        }}
      >
        Priced for adoption. No AI billing anxiety.
      </motion.h2>

      <div
        className="pricing-grid"
        style={{
          width: '100%',
          maxWidth: 1000,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'clamp(20px, 3vw, 32px)',
          marginBottom: 'clamp(32px, 4vw, 44px)',
        }}
      >
        {TIERS.map((tier, i) => (
          <TierCard key={tier.name} tier={tier} isInView={isInView} delay={0.1 + i * 0.12} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ ...EASE, delay: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 1000,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
          lineHeight: 1.7,
          textAlign: 'center',
        }}
      >
        First 100 customers: &euro;49 flat rate, no tier restrictions, 12-month lock.
        <br />
        Annual billing saves 15% &middot; No credit card required for the trial.
      </motion.div>

      <style>{`
        @media (max-width: 720px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
