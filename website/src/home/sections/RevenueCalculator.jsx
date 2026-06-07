import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEAL_OPTIONS  = ['Under \u20ac5k', '\u20ac5k to \u20ac25k', '\u20ac25k to \u20ac100k', 'Over \u20ac100k'];
const CYCLE_OPTIONS = ['Under 30 days', '30 to 90 days', '90 to 180 days', 'Over 180 days'];

const DEAL_MIDPOINTS = {
  'Under \u20ac5k':      3000,
  '\u20ac5k to \u20ac25k':   15000,
  '\u20ac25k to \u20ac100k': 60000,
  'Over \u20ac100k':    150000,
};

const CYCLE_CONFIG = {
  'Under 30 days':  { weeks: 4,  cyclesPerYear: 12 },
  '30 to 90 days':  { weeks: 8,  cyclesPerYear: 6  },
  '90 to 180 days': { weeks: 16, cyclesPerYear: 3  },
  'Over 180 days':  { weeks: 26, cyclesPerYear: 2  },
};

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

// Derived per-rep figures (per the readiness model)
const DISPLACED_CALLS_PER_REP_WEEK = (MIN_LOST_PER_CALL * CALLS_PER_REP_DAY) / 60 / CALL_DURATION_MIN * 60;
// = (65 × 8) ÷ 30 = 17.33 displaced calls per rep per week
const RECOVERED_CALLS_PER_REP      = (MIN_RECOVERED_PER_CALL * CALLS_PER_REP_DAY) / CALL_DURATION_MIN;
// = (54 × 8) ÷ 30 = 14.4 calls recovered per rep

function fmtEur(n) {
  if (n >= 1000000) return '\u20ac' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '\u20ac' + Math.round(n / 1000) + 'k';
  return '\u20ac' + Math.round(n);
}

function fmtNum(n) {
  return Math.round(n).toLocaleString('en');
}

function calc(dealLabel, cycleLabel, numReps, closeRate) {
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
    dealLabel, cycleLabel, numReps, dealMidpoint, closeRate,
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

function CountingNumber({ target, duration }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    startRef.current = null;
    function frame(ts) {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return <>{fmtEur(display)}</>;
}

const STEP_SPRING = { type: 'spring', stiffness: 260, damping: 28 };

// ─── Main component ───────────────────────────────────────────────────────────

export default function RevenueCalculator() {
  const [step, setStep]             = useState('deal');
  const [dealLabel, setDealLabel]   = useState(null);
  const [cycleLabel, setCycleLabel] = useState(null);
  const [closeRateInput, setCloseRateInput] = useState('');
  const [closeRateError, setCloseRateError] = useState('');
  const [closeRate, setCloseRate]   = useState(null); // stored as decimal (e.g. 0.05)
  const [teamInput, setTeamInput]   = useState('');
  const [teamError, setTeamError]   = useState('');
  const [numReps, setNumReps]       = useState(null);
  const [showBigNum, setShowBigNum] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const teamInputRef = useRef(null);
  const closeRateInputRef = useRef(null);

  function selectDeal(label)  { setDealLabel(label);  setTimeout(() => setStep('cycle'), 280); }
  function selectCycle(label) { setCycleLabel(label); setTimeout(() => setStep('close'),  280); }

  function submitCloseRate(e) {
    e && e.preventDefault();
    const raw = parseFloat(closeRateInput);
    if (isNaN(raw) || raw <= 0 || raw > 100) {
      setCloseRateError('Enter a close rate between 0.1 and 100.');
      return;
    }
    setCloseRateError('');
    setCloseRate(raw / 100);
    setTimeout(() => setStep('team'), 280);
  }

  function submitTeam(e) {
    e && e.preventDefault();
    const n = parseInt(teamInput, 10);
    if (!n || n < 1 || n > 9999) { setTeamError('Please enter a number between 1 and 9999.'); return; }
    setTeamError('');
    setNumReps(n);
    setTimeout(() => setStep('results'), 280);
  }

  useEffect(() => {
    if (step === 'team')  setTimeout(() => teamInputRef.current  && teamInputRef.current.focus(),  350);
    if (step === 'close') setTimeout(() => closeRateInputRef.current && closeRateInputRef.current.focus(), 350);
  }, [step]);

  useEffect(() => {
    if (step !== 'results') return;
    setShowBigNum(false);
    const t0 = setTimeout(() => setShowBigNum(true), 400);
    return () => clearTimeout(t0);
  }, [step]);

  const c = dealLabel && cycleLabel && numReps && closeRate ? calc(dealLabel, cycleLabel, numReps, closeRate) : null;

  useEffect(() => {
    if (c) {
      try {
        // Keep `outround_pipeline` mapped to currently-lost annual pipeline so
        // downstream sections (HowOutroundWorks) continue to read a meaningful value.
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

  const closeRatePct = c ? (c.closeRate * 100) : 0;
  const closeRatePctLabel = c
    ? (closeRatePct >= 10 ? closeRatePct.toFixed(0) : closeRatePct.toFixed(1)) + '%'
    : '';

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

  function reset() {
    setStep('deal'); setDealLabel(null); setCycleLabel(null);
    setCloseRateInput(''); setCloseRate(null);
    setTeamInput(''); setNumReps(null);
  }
  // reset retained for potential future use
  void reset;

  return (
    <section
      id="calculator"
      style={{
        background: 'var(--bg-sub)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
        position: 'relative',
      }}
    >
      {/* Corner metadata */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'clamp(32px, 5vw, 56px)',
        gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
          02 / The leak
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.55,
          whiteSpace: 'nowrap',
        }}>
          {'/* sources cited in methodology */'}
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 760,
        transition: 'max-width 0.4s ease',
      }}>
        <AnimatePresence mode="wait">

          {step === 'deal' && (
            <motion.div key="deal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator \u00b7 1 of 4
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
                The revenue leak calculator \u00b7 2 of 4
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                How long is your average sales cycle?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CYCLE_OPTIONS.map(opt => <ChoiceButton key={opt} label={opt} onClick={() => selectCycle(opt)} />)}
              </div>
            </motion.div>
          )}

          {step === 'close' && (
            <motion.div key="close" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator · 3 of 4
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.15 }}>
                What is your close rate from connected calls?
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-sub)', marginTop: 0, marginBottom: 24, lineHeight: 1.55 }}>
                The percentage of connected calls that become closed deals. A VP Sales knows this number instantly.
              </p>
              <form onSubmit={submitCloseRate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={closeRateInputRef}
                    type="number" min="0.1" max="100" step="0.1"
                    value={closeRateInput}
                    onChange={e => { setCloseRateInput(e.target.value); setCloseRateError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') submitCloseRate(); }}
                    placeholder="e.g. 3"
                    style={{
                      width: '100%', background: 'var(--bg-card)',
                      border: `0.5px solid ${closeRateError ? '#ef4444' : 'rgba(242,107,69,0.45)'}`,
                      borderRadius: 10, padding: '16px 56px 16px 20px',
                      color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700,
                      outline: 'none', boxSizing: 'border-box',
                      MozAppearance: 'textfield', WebkitAppearance: 'none',
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 30px)',
                    fontWeight: 700, color: 'var(--text-muted)', pointerEvents: 'none',
                  }}>%</span>
                </div>
                {closeRateError && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444' }}>{closeRateError}</div>}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.015, boxShadow: '0 0 36px rgba(242,107,69,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: closeRateInput ? 'linear-gradient(135deg, #f26b45, #4ba3e3)' : 'var(--bg-hover)',
                    color: closeRateInput ? '#0a0a0b' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                    padding: '14px 32px', borderRadius: 999, border: 'none',
                    cursor: closeRateInput ? 'pointer' : 'default', minHeight: 44,
                    transition: 'background 0.2s, color 0.2s', alignSelf: 'flex-start',
                  }}
                >
                  Next →
                </motion.button>
              </form>
            </motion.div>
          )}

          {step === 'team' && (            <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator \u00b7 4 of 4
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                How many salespeople on your team?
              </h2>
              <form onSubmit={submitTeam} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  ref={teamInputRef}
                  type="number" min="1" max="9999"
                  value={teamInput}
                  onChange={e => { setTeamInput(e.target.value); setTeamError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') submitTeam(); }}
                  placeholder="e.g. 12"
                  style={{
                    width: '100%', background: 'var(--bg-card)',
                    border: `0.5px solid ${teamError ? '#ef4444' : 'rgba(242,107,69,0.45)'}`,
                    borderRadius: 10, padding: '16px 20px',
                    color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700,
                    outline: 'none', boxSizing: 'border-box',
                    MozAppearance: 'textfield', WebkitAppearance: 'none',
                  }}
                />
                {teamError && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444' }}>{teamError}</div>}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.015, boxShadow: '0 0 36px rgba(242,107,69,0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: teamInput ? 'linear-gradient(135deg, #f26b45, #4ba3e3)' : 'var(--bg-hover)',
                    color: teamInput ? '#0a0a0b' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                    padding: '14px 32px', borderRadius: 999, border: 'none',
                    cursor: teamInput ? 'pointer' : 'default', minHeight: 44,
                    transition: 'background 0.2s, color 0.2s', alignSelf: 'flex-start',
                  }}
                >
                  Calculate the leak &rarr;
                </motion.button>
              </form>
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
                      {/* Tiny label above */}
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: 'var(--text-muted)', letterSpacing: '0.14em',
                        textTransform: 'uppercase', marginBottom: 20,
                      }}>
                        What your team is losing
                      </div>

                      {/* Dominant coral number \u2014 monthly */}
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(72px, 12vw, 168px)',
                        fontWeight: 700,
                        color: 'var(--coral)',
                        lineHeight: 0.9,
                        letterSpacing: '-0.045em',
                        marginBottom: 18,
                      }}>
                        <CountingNumber target={c.annualLost / 12} duration={1500} />
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: 'var(--text-muted)', letterSpacing: '0.12em',
                        textTransform: 'uppercase', marginBottom: 36,
                      }}>
                        Every month, in pipeline that is never built
                      </div>

                      {/* One line of plain English */}
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(18px, 2vw, 24px)',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                        letterSpacing: '-0.012em',
                        margin: '0 0 48px',
                        maxWidth: 600,
                      }}>
                        Admin and research are eating the calls your reps should be making.
                      </p>

                      {/* Editable input chips */}
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 8,
                        marginBottom: 36,
                      }}>
                        {[
                          { label: c.dealLabel,                       step: 'deal'  },
                          { label: c.cycleLabel.toLowerCase() + ' cycle', step: 'cycle' },
                          { label: closeRatePctLabel + ' close rate', step: 'close' },
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

                      {/* Methodology footnote \u2014 collapsed by default */}
                      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
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
                                  fontStyle: 'italic', opacity: 0.7,
                                  paddingTop: 12,
                                }}>
                                  Figures shown are pipeline value (deals \u00d7 ACV), not closed revenue. Assumes 8 connected calls per rep per day at the SDR benchmark and a 5-day working week.
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
