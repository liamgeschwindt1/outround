import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEAL_OPTIONS  = ['Under \u20ac5k', '\u20ac5k to \u20ac25k', '\u20ac25k to \u20ac100k', 'Over \u20ac100k'];
const CYCLE_OPTIONS = ['Under 30 days', '1 to 3 months', '3 to 6 months', 'Over 6 months'];

const DEAL_MIDPOINTS = {
  'Under \u20ac5k':      3000,
  '\u20ac5k to \u20ac25k':   15000,
  '\u20ac25k to \u20ac100k': 60000,
  'Over \u20ac100k':    150000,
};

const CYCLE_CONFIG = {
  'Under 30 days':  { weeks: 4,  cyclesPerYear: 12 },
  '1 to 3 months':  { weeks: 8,  cyclesPerYear: 6  },
  '3 to 6 months':  { weeks: 16, cyclesPerYear: 3  },
  'Over 6 months':  { weeks: 26, cyclesPerYear: 2  },
};

const TEAM_OPTIONS = [
  { label: '1 rep',    value: 3  },
  { label: '2 to 5',  value: 3  },
  { label: '6 to 15', value: 10 },
  { label: '16+',     value: 20 },
];

// Benchmark assumptions
const CALLS_PER_REP_DAY            = 8;     // standard SDR benchmark
const DAYS_PER_WEEK                = 5;
const CALL_DURATION_MIN            = 30;

// Time lost per call to admin and research
const POST_CALL_LOG_MIN            = 45;
const PRE_CALL_RESEARCH_MIN        = 20;
const MIN_LOST_PER_CALL            = POST_CALL_LOG_MIN + PRE_CALL_RESEARCH_MIN; // 65

// Outround recovery rates
const POST_CALL_RECOVERY           = 0.90;  // 90% of post-call logging
const PRE_CALL_RECOVERY            = 0.70;  // 70% of pre-call research
const MIN_RECOVERED_PER_CALL       = (POST_CALL_LOG_MIN * POST_CALL_RECOVERY)
                                   + (PRE_CALL_RESEARCH_MIN * PRE_CALL_RECOVERY); // 54

// Conservative discount on recovered time (not all saved time becomes selling time)
const EFFICIENCY_DISCOUNT          = 0.40;

// Close rate hardcoded at conservative European outbound benchmark
const CLOSE_RATE                   = 0.03;

// Derived per-rep figures (per the readiness model)
const DISPLACED_CALLS_PER_REP_WEEK = (MIN_LOST_PER_CALL * CALLS_PER_REP_DAY) / 60 / CALL_DURATION_MIN * 60;
// = (65 × 8) ÷ 30 = 17.33 displaced calls per rep per week
const RECOVERED_CALLS_PER_REP      = (MIN_RECOVERED_PER_CALL * CALLS_PER_REP_DAY) / CALL_DURATION_MIN;
// = (54 × 8) ÷ 30 = 14.4 calls recovered per rep

// ─── Day-bar data ─────────────────────────────────────────────────────────────

const BAR_SEGS = [
  { id: 'selling',   label: 'Selling',    hours: 2.3,  coral: false, rec: false, color: '#4ba3e3' },
  { id: 'crm',       label: 'CRM',        hours: 1.45, coral: true,  rec: false, color: '#f26b45' },
  { id: 'research',  label: 'Research',   hours: 1.3,  coral: true,  rec: false, color: '#e85c38' },
  { id: 'followup',  label: 'Follow-up',  hours: 0.8,  coral: true,  rec: false, color: '#d44c2e' },
  { id: 'meetings',  label: 'Meetings',   hours: 1.15, coral: false, rec: false, color: 'rgba(242,241,239,0.11)' },
  { id: 'other',     label: 'Other',      hours: 1.0,  coral: false, rec: false, color: 'rgba(242,241,239,0.05)' },
];
const BAR_CORAL_H        = BAR_SEGS.filter(s => s.coral).reduce((a, s) => a + s.hours, 0); // 3.55
const BAR_SHRINK         = 0.2;
const BAR_REC_H          = parseFloat((BAR_CORAL_H * (1 - BAR_SHRINK)).toFixed(2));         // 2.84
const BEFORE_SELL_PCT    = Math.round(2.3 / 8 * 100);                                       // 29
const AFTER_SELL_PCT     = Math.round((2.3 + BAR_REC_H) / 8 * 100);                         // 64

function BarSegGrow(seg, animated) {
  if (seg.id === 'selling') return animated ? seg.hours + BAR_REC_H : seg.hours;
  if (seg.coral)            return animated ? seg.hours * BAR_SHRINK : seg.hours;
  return seg.hours;
}

function fmtEur(n) {
  if (n >= 1000000) return '\u20ac' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '\u20ac' + Math.round(n / 1000) + 'k';
  return '\u20ac' + Math.round(n);
}

function fmtNum(n) {
  return Math.round(n).toLocaleString('en');
}

function calc(dealLabel, cycleLabel, numReps) {
  const closeRate                            = CLOSE_RATE;
  const dealMidpoint                         = DEAL_MIDPOINTS[dealLabel];
  const { weeks: cycleWeeks, cyclesPerYear } = CYCLE_CONFIG[cycleLabel];

  // Step 1 — Full pipeline potential (if every available calling hour was spent calling)
  const callsPerCycle      = numReps * CALLS_PER_REP_DAY * DAYS_PER_WEEK * cycleWeeks;
  const fullPotential      = callsPerCycle * closeRate * dealMidpoint;

  // Step 2 — Pipeline currently lost to admin and research
  const displacedCallsCycle = DISPLACED_CALLS_PER_REP_WEEK * cycleWeeks * numReps;
  const lostPipeline        = displacedCallsCycle * closeRate * dealMidpoint;

  // Step 3 — Conservatively recovered with Outround (after 40% efficiency discount)
  const recoveredCallsCycle = RECOVERED_CALLS_PER_REP * EFFICIENCY_DISCOUNT * numReps * cycleWeeks;
  const recoveredPipeline   = recoveredCallsCycle * closeRate * dealMidpoint;

  // Annualised versions for downstream sections that key off annual figures
  const annualLost          = lostPipeline      * cyclesPerYear;
  const annualRecovered     = recoveredPipeline * cyclesPerYear;
  const annualPotential     = fullPotential     * cyclesPerYear;

  return {
    dealLabel, cycleLabel, numReps, dealMidpoint, closeRate: CLOSE_RATE,
    cycleWeeks, cyclesPerYear,
    callsPerCycle,
    displacedCallsCycle, displacedCallsPerRepWeek: DISPLACED_CALLS_PER_REP_WEEK,
    recoveredCallsCycle, recoveredCallsPerRep: RECOVERED_CALLS_PER_REP,
    fullPotential, lostPipeline, recoveredPipeline,
    annualPotential, annualLost, annualRecovered,
  };
}

// ─── Choice button ────────────────────────────────────────────────────────────

function ChoiceButton({ label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `0.5px solid ${hover ? 'rgba(242,107,69,0.55)' : 'var(--border-md)'}`,
        borderRadius: 10,
        padding: '14px 20px',
        color: hover ? 'var(--text-primary)' : 'var(--text-sub)',
        fontFamily: 'var(--font-body)',
        fontSize: 15,
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        minHeight: 48,
        width: '100%',
      }}
    >
      {label}
    </motion.button>
  );
}

// ─── Chevron ──────────────────────────────────────────────────────────────────

function Chevron({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Collapsible proof row ────────────────────────────────────────────────────

function CollapsibleStep({ num, summary, working, source, delay }) {
  const [open, setOpen]   = useState(false);
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{ borderBottom: '0.5px solid var(--border)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          padding: '12px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: hover ? 'var(--text-primary)' : 'var(--text-sub)',
          transition: 'color 0.15s',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', flexShrink: 0, minWidth: 18 }}>
          {num}.
        </span>
        <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 'clamp(13px, 1.6vw, 14px)', lineHeight: 1.5 }}>
          {summary}
        </span>
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <Chevron open={open} />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.0, 0.0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: 14, paddingLeft: 28 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: source ? 6 : 0 }}>
                {working}
              </div>
              {source && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.55, fontStyle: 'italic', opacity: 0.8 }}>
                  {source}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Counting number animation ────────────────────────────────────────────────

function CountingNumber({ target, from = 0, duration }) {
  const [display, setDisplay] = useState(from);
  const startRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);
    function frame(ts) {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, from, duration]);

  return <>{fmtEur(display)}</>;
}

const STEP_SPRING = { type: 'spring', stiffness: 260, damping: 28 };

// ─── Main component ───────────────────────────────────────────────────────────

export default function RevenueCalculator() {
  const [open, setOpen]             = useState(false);
  const [step, setStep]             = useState('deal');
  const [dealLabel, setDealLabel]   = useState(null);
  const [cycleLabel, setCycleLabel] = useState(null);
  const [numReps, setNumReps]       = useState(null);
  const [showBigNum,    setShowBigNum]    = useState(false);
  const [showMethod,    setShowMethod]    = useState(false);
  const [showBarStats,  setShowBarStats]  = useState(false);
  const [barTriggered,  setBarTriggered]  = useState(false);
  const [showAfterStats,setShowAfterStats]= useState(false);

  const triggerBar = () => {
    setBarTriggered(true);
    setTimeout(() => setShowAfterStats(true), 1250);
  };
  const resetBar = () => {
    setBarTriggered(false);
    setShowAfterStats(false);
  };

  function openModal() {
    setStep('deal'); setDealLabel(null); setCycleLabel(null); setNumReps(null);
    setShowBigNum(false); setShowBarStats(false); setBarTriggered(false); setShowAfterStats(false);
    setOpen(true);
  }
  function closeModal() { setOpen(false); }

  function selectDeal(label)  { setDealLabel(label);  setTimeout(() => setStep('cycle'), 280); }
  function selectCycle(label) { setCycleLabel(label); setTimeout(() => setStep('team'),  280); }
  function selectTeam(value)  { setNumReps(value);    setTimeout(() => setStep('results'), 280); }

  useEffect(() => {
    if (step !== 'results') return;
    setShowBigNum(false);
    setShowBarStats(false);
    setBarTriggered(false);
    setShowAfterStats(false);
    const t0 = setTimeout(() => setShowBigNum(true),  400);
    const t1 = setTimeout(() => setShowBarStats(true), 1000);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [step]);

  // Open from external trigger (e.g. Hero CTA)
  useEffect(() => {
    const handler = () => openModal();
    window.addEventListener('outround:open-calculator', handler);
    return () => window.removeEventListener('outround:open-calculator', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const c = dealLabel && cycleLabel && numReps ? calc(dealLabel, cycleLabel, numReps) : null;

  useEffect(() => {
    if (c) {
      try {
        localStorage.setItem('outround_pipeline',     String(c.annualLost));
        localStorage.setItem('outround_reps',         String(c.numReps));
        localStorage.setItem('outround_missed_cycle', String(c.displacedCallsCycle));
        localStorage.setItem('outround_recovered',   String(c.annualRecovered));
        localStorage.setItem('outround_potential',   String(c.annualPotential));
        window.dispatchEvent(new CustomEvent('outround:calc', {
          detail: {
            pipeline: c.annualLost,
            potential: c.annualPotential,
            recovered: c.annualRecovered,
            reps: c.numReps,
            missedCycle: c.displacedCallsCycle,
          },
        }));
      } catch (_) {}
    }
  }, [c]);

  const closeRatePctLabel = `${CLOSE_RATE * 100}%`;

  const proofRows = c ? [
    {
      summary: `${POST_CALL_LOG_MIN} min post-call logging + ${PRE_CALL_RESEARCH_MIN} min pre-call research = ${MIN_LOST_PER_CALL} min of admin per call`,
      working: `At ${CALLS_PER_REP_DAY} calls/day, that displaces \u2248${DISPLACED_CALLS_PER_REP_WEEK.toFixed(1)} calls per rep per week`,
      source:  'Salesforce State of Sales 2025; Forrester Activity Study 2025',
    },
    {
      summary: `${fmtNum(c.displacedCallsCycle)} calls displaced across ${c.numReps} rep${c.numReps > 1 ? 's' : ''} over a ${c.cycleLabel.toLowerCase()} cycle`,
      working: `${DISPLACED_CALLS_PER_REP_WEEK.toFixed(1)} \u00d7 ${c.cycleWeeks} weeks \u00d7 ${c.numReps} rep${c.numReps > 1 ? 's' : ''} = ${fmtNum(c.displacedCallsCycle)} calls never made`,
      source:  null,
    },
    {
      summary: `${fmtEur(c.lostPipeline)} pipeline lost per cycle at ${closeRatePctLabel} close rate and ${fmtEur(c.dealMidpoint)} avg deal`,
      working: `${fmtNum(c.displacedCallsCycle)} \u00d7 ${closeRatePctLabel} \u00d7 ${fmtEur(c.dealMidpoint)} = ${fmtEur(c.lostPipeline)} per cycle`,
      source:  null,
    },
    {
      summary: `${fmtEur(c.annualLost)} annualised across ${c.cyclesPerYear} cycles per year`,
      working: `${fmtEur(c.lostPipeline)} \u00d7 ${c.cyclesPerYear} = ${fmtEur(c.annualLost)} per year \u00b7 ${fmtEur(c.annualLost / 12)} per month`,
      source:  'Bridge Group SDR Metrics Report \u2014 8 connected calls/rep/day benchmark; Belkins B2B Outbound Benchmarks 2024',
    },
  ] : [];

  return (
    <>
      {/* ── Modal overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeModal}
              style={{
                position: 'fixed', inset: 0, zIndex: 999,
                background: 'rgba(10,10,11,0.82)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            />

            {/* Centering wrapper — framer-motion overrides CSS transform so we use flex instead */}
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px',
                pointerEvents: 'none',
              }}
            >
            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'relative',
                pointerEvents: 'all',
                width: 'min(760px, 100%)',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                background: 'var(--bg-sub)',
                border: '0.5px solid var(--border-md)',
                borderRadius: 20,
                padding: 'clamp(28px, 4vw, 44px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                aria-label="Close calculator"
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 8, lineHeight: 1,
                  borderRadius: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* Header */}
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-muted)', letterSpacing: '0.14em',
                textTransform: 'uppercase', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', display: 'inline-block' }} />
                Revenue leak calculator
              </div>

        <AnimatePresence mode="wait">

          {step === 'deal' && (
            <motion.div key="deal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator \u00b7 1 of 3
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                What is your average deal size?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DEAL_OPTIONS.map(opt => <ChoiceButton key={opt} label={opt} onClick={() => selectDeal(opt)} />)}
              </div>
            </motion.div>
          )}

          {step === 'cycle' && (
            <motion.div key="cycle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator \u00b7 2 of 3
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                How long is your average sales cycle?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CYCLE_OPTIONS.map(opt => <ChoiceButton key={opt} label={opt} onClick={() => selectCycle(opt)} />)}
              </div>
            </motion.div>
          )}

          {step === 'team' && (
            <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator \u00b7 3 of 3
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                How many sales reps on your team?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TEAM_OPTIONS.map(opt => <ChoiceButton key={opt.label} label={opt.label} onClick={() => selectTeam(opt.value)} />)}
              </div>
            </motion.div>
          )}

          {step === 'results' && c && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <AnimatePresence>
                  {showBigNum && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.0, 0.0, 0.2, 1] }}
                    >
                      {/* ── Bar header ── */}
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: 'var(--text-muted)', letterSpacing: '0.14em',
                        textTransform: 'uppercase', marginBottom: 20,
                      }}>
                        Where a rep&rsquo;s day goes &middot; {c.numReps} rep{c.numReps !== 1 ? 's' : ''}
                      </div>

                      {/* ── Horizontal bar ── */}
                      <div style={{ display: 'flex', height: 56, borderRadius: 8, overflow: 'hidden', width: '100%' }}>
                        {BAR_SEGS.map((seg, i) => (
                          <div
                            key={seg.id}
                            style={{
                              position: 'relative',
                              flexGrow: BarSegGrow(seg, barTriggered),
                              flexShrink: 1, flexBasis: 0, minWidth: 0,
                              background: seg.color,
                              borderLeft: i > 0 ? '1.5px solid rgba(0,0,0,0.2)' : 'none',
                              transition: seg.coral
                                ? 'flex-grow 0.6s ease-out'
                                : seg.id === 'selling'
                                  ? 'flex-grow 0.5s ease-in-out 0.3s'
                                  : 'none',
                              overflow: 'hidden',
                            }}
                          >
                            {seg.coral && (
                              <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-mono)', fontSize: 8,
                                color: 'rgba(255,255,255,0.5)',
                                opacity: barTriggered ? 1 : 0,
                                transition: 'opacity 0.3s ease 0.7s',
                                letterSpacing: '0.04em',
                              }}>
                                {barTriggered ? '\u201380%' : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* ── Label row ── */}
                      <div style={{ display: 'flex', width: '100%', marginTop: 8, alignItems: 'flex-start' }}>
                        {BAR_SEGS.map(seg => (
                          <div
                            key={seg.id}
                            style={{
                              flexGrow: BarSegGrow(seg, barTriggered),
                              flexShrink: 1, flexBasis: 0, minWidth: 0,
                              paddingRight: 3, overflow: 'hidden',
                              opacity: seg.coral ? (barTriggered ? 0 : 1) : 1,
                              transition: seg.coral
                                ? 'flex-grow 0.6s ease-out, opacity 0.2s ease'
                                : 'flex-grow 0.5s ease-in-out 0.3s',
                            }}
                          >
                            <div style={{
                              fontFamily: 'var(--font-mono)', fontSize: 9,
                              color: seg.coral ? 'var(--coral)' : 'var(--text-muted)',
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              lineHeight: 1.3, whiteSpace: 'nowrap',
                            }}>
                              {seg.label}
                            </div>
                            <div style={{
                              fontFamily: 'var(--font-body)', fontSize: 11,
                              color: seg.id === 'selling' && barTriggered ? '#4ba3e3' : 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              transition: 'color 0.3s ease',
                            }}>
                              {seg.id === 'selling' && barTriggered
                                ? `2.3h \u2192 ${(2.3 + BAR_REC_H).toFixed(1)}h`
                                : `${seg.hours}h`}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ── Stats ── */}
                      <AnimatePresence>
                        {showBarStats && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
                            style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}
                          >
                            {/* Selling time */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 16px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '0.5px solid var(--border)',
                              borderRadius: 10,
                            }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                Selling time
                              </span>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{
                                  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
                                  color: barTriggered ? 'rgba(75,163,227,0.3)' : '#4ba3e3',
                                  transition: 'color 0.5s ease',
                                }}>
                                  {BEFORE_SELL_PCT}%
                                </span>
                                {barTriggered && (
                                  <motion.span
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}
                                  >
                                    →
                                  </motion.span>
                                )}
                                {barTriggered && (
                                  <motion.span
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: 0.05 }}
                                    style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#4ba3e3' }}
                                  >
                                    {AFTER_SELL_PCT}%
                                  </motion.span>
                                )}
                              </div>
                            </div>

                            {/* Pipeline never built */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 16px',
                              background: 'rgba(242,107,69,0.06)',
                              border: '0.5px solid rgba(242,107,69,0.18)',
                              borderRadius: 10,
                            }}>
                              <div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(242,107,69,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                                  Pipeline never built &middot; per month
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(242,107,69,0.4)' }}>
                                  {c.numReps} rep{c.numReps !== 1 ? 's' : ''} &middot; {c.cycleLabel.toLowerCase()} &middot; 3% close
                                </div>
                              </div>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--coral)', lineHeight: 1, textAlign: 'right' }}>
                                <CountingNumber
                                  key={barTriggered ? 'lost-after' : 'lost-before'}
                                  target={barTriggered ? (c.annualLost - c.annualRecovered) / 12 : c.annualLost / 12}
                                  from={barTriggered ? c.annualLost / 12 : 0}
                                  duration={barTriggered ? 900 : 1200}
                                />
                              </div>
                            </div>

                            {/* Recovered */}
                            <AnimatePresence>
                              {showAfterStats && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: 'rgba(34,197,94,0.06)',
                                    border: '0.5px solid rgba(34,197,94,0.22)',
                                    borderRadius: 10,
                                  }}
                                >
                                  <div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(34,197,94,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                                      Pipeline recovered &middot; per month
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(34,197,94,0.4)' }}>
                                      with Outround &middot; your numbers
                                    </div>
                                  </div>
                                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#22c55e', lineHeight: 1 }}>
                                    <CountingNumber key="recovered" target={c.annualRecovered / 12} from={0} duration={900} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Edit chips ── */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28, marginBottom: 20 }}>
                        {[
                          { label: c.dealLabel,                                    step: 'deal'  },
                          { label: c.cycleLabel.toLowerCase() + ' cycle',          step: 'cycle' },
                          { label: `${c.numReps} rep${c.numReps > 1 ? 's' : ''}`, step: 'team'  },
                        ].map(chip => (
                          <button
                            key={chip.step}
                            onClick={() => setStep(chip.step)}
                            style={{
                              background: 'transparent',
                              border: '0.5px solid var(--border)',
                              borderRadius: 999,
                              padding: '6px 12px',
                              color: 'var(--text-sub)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              letterSpacing: '0.04em',
                              cursor: 'pointer',
                              transition: 'border-color 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'rgba(242,107,69,0.55)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.color = 'var(--text-sub)';
                            }}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      {/* ── CTA button ── */}
                      {showBarStats && (
                        <div style={{ marginBottom: 20 }}>
                          {!barTriggered ? (
                            <motion.button
                              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
                              whileTap={{ scale: 0.98 }}
                              onClick={triggerBar}
                              style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
                                color: '#0a0a0b',
                                fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                                padding: '14px 24px', borderRadius: 999, border: 'none',
                                cursor: 'pointer', minHeight: 48,
                                letterSpacing: '-0.01em',
                                boxShadow: '0 0 28px rgba(242,107,69,0.25)',
                              }}
                            >
                              Upgrade your pipeline
                            </motion.button>
                          ) : null}
                        </div>
                      )}

                      {/* ── Methodology footnote ── */}
                      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16, marginBottom: 8 }}>
                        <button
                          onClick={() => setShowMethod(m => !m)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            fontFamily: 'var(--font-mono)', fontSize: 11,
                            color: 'var(--text-muted)', letterSpacing: '0.08em',
                          }}
                        >
                          <span>How we calculated this</span>
                          <Chevron open={showMethod} />
                        </button>
                        <AnimatePresence>
                          {showMethod && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: [0.0, 0.0, 0.2, 1] }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ paddingTop: 14 }}>
                                {proofRows.map((row, i) => (
                                  <CollapsibleStep key={i} num={i + 1} summary={row.summary} working={row.working} source={row.source} delay={0} />
                                ))}
                                <div style={{
                                  fontFamily: 'var(--font-mono)', fontSize: 10,
                                  color: 'var(--text-muted)', lineHeight: 1.6,
                                  fontStyle: 'italic', opacity: 0.7, paddingTop: 12,
                                }}>
                                  Figures shown are pipeline value (deals \u00d7 ACV), not closed revenue. Assumes 8 connected calls per rep per day at the SDR benchmark and a 5-day working week.
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Forward CTA — bridge to the product ── */}
                      {showBarStats && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.2, ease: [0.0, 0.0, 0.2, 1] }}
                          style={{ borderTop: '0.5px solid var(--border)', paddingTop: 24, marginTop: 20 }}
                        >
                          <div style={{
                            fontFamily: 'var(--font-body)', fontSize: 'clamp(14px, 1.6vw, 16px)',
                            color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: 18, maxWidth: 520,
                          }}>
                            Every call resets memory. Every rep rebuilds context. That is where the pipeline goes.
                          </div>
                          <button
                            onClick={() => {
                              closeModal();
                              setTimeout(() => document.getElementById('what')?.scrollIntoView({ behavior: 'smooth' }), 200);
                            }}
                            style={{
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                              padding: '12px 24px', borderRadius: 999,
                              border: '0.5px solid rgba(242,107,69,0.45)',
                              cursor: 'pointer', minHeight: 44,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,107,69,0.8)'; e.currentTarget.style.background = 'rgba(242,107,69,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(242,107,69,0.45)'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            Here&rsquo;s how Outround recovers it &rarr;
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
