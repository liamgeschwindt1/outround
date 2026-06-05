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

const HOURS_LOST_PER_REP_WEEK = 12.8;
const CALL_DURATION_HRS       = 0.5;
const CONVERSION_RATE         = 0.05;

function fmtEur(n) {
  if (n >= 1000000) return '\u20ac' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '\u20ac' + Math.round(n / 1000) + 'k';
  return '\u20ac' + Math.round(n);
}

function fmtNum(n) {
  return Math.round(n).toLocaleString('en');
}

function calc(dealLabel, cycleLabel, numReps) {
  const dealMidpoint                         = DEAL_MIDPOINTS[dealLabel];
  const { weeks: cycleWeeks, cyclesPerYear } = CYCLE_CONFIG[cycleLabel];
  const totalHoursLostWeek                   = HOURS_LOST_PER_REP_WEEK * numReps;
  const missedCallsWeek                      = totalHoursLostWeek / CALL_DURATION_HRS;
  const missedCallsCycle                     = missedCallsWeek * cycleWeeks;
  const pipelinePerCycle                     = missedCallsCycle * CONVERSION_RATE * dealMidpoint;
  const annualPipeline                       = pipelinePerCycle * cyclesPerYear;
  return {
    dealLabel, cycleLabel, numReps, dealMidpoint,
    cycleWeeks, cyclesPerYear,
    totalHoursLostWeek, missedCallsWeek,
    missedCallsCycle, pipelinePerCycle, annualPipeline,
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
  const [teamInput, setTeamInput]   = useState('');
  const [teamError, setTeamError]   = useState('');
  const [numReps, setNumReps]       = useState(null);
  const [showBigNum, setShowBigNum] = useState(false);
  const [revealedRows, setRevealedRows] = useState(0);
  const [showCTA, setShowCTA]       = useState(false);
  const intervalRef  = useRef(null);
  const teamInputRef = useRef(null);

  function selectDeal(label)  { setDealLabel(label);  setTimeout(() => setStep('cycle'), 280); }
  function selectCycle(label) { setCycleLabel(label); setTimeout(() => setStep('team'),  280); }

  function submitTeam(e) {
    e && e.preventDefault();
    const n = parseInt(teamInput, 10);
    if (!n || n < 1 || n > 9999) { setTeamError('Please enter a number between 1 and 9999.'); return; }
    setTeamError('');
    setNumReps(n);
    setTimeout(() => setStep('results'), 280);
  }

  useEffect(() => {
    if (step === 'team') setTimeout(() => teamInputRef.current && teamInputRef.current.focus(), 350);
  }, [step]);

  useEffect(() => {
    if (step !== 'results') return;
    setShowBigNum(false);
    setRevealedRows(0);
    setShowCTA(false);
    const t0 = setTimeout(() => {
      setShowBigNum(true);
      let row = 0;
      intervalRef.current = setInterval(() => {
        row++;
        setRevealedRows(row);
        if (row >= 5) { clearInterval(intervalRef.current); setTimeout(() => setShowCTA(true), 400); }
      }, 620);
    }, 500);
    return () => { clearTimeout(t0); clearInterval(intervalRef.current); };
  }, [step]);

  const c = dealLabel && cycleLabel && numReps ? calc(dealLabel, cycleLabel, numReps) : null;

  useEffect(() => {
    if (c) {
      try {
        localStorage.setItem('outround_pipeline',     String(c.annualPipeline));
        localStorage.setItem('outround_reps',         String(c.numReps));
        localStorage.setItem('outround_missed_cycle', String(c.missedCallsCycle));
      } catch (_) {}
    }
  }, [c]);

  const proofRows = c ? [
    {
      summary: `${HOURS_LOST_PER_REP_WEEK} hours lost per rep, per week on admin and research`,
      working: `17% CRM admin + 15% prospect research \u00d7 40h working week = ${HOURS_LOST_PER_REP_WEEK}h`,
      source:  'Salesforce State of Sales 2025; Forrester Activity Study 2025',
    },
    {
      summary: `${fmtNum(c.totalHoursLostWeek)} hours lost per week across ${c.numReps} rep${c.numReps > 1 ? 's' : ''}`,
      working: `${HOURS_LOST_PER_REP_WEEK}h \u00d7 ${c.numReps} = ${fmtNum(c.totalHoursLostWeek)}h`,
      source:  null,
    },
    {
      summary: `${fmtNum(c.missedCallsWeek)} calls missed per week (30-minute average)`,
      working: `${fmtNum(c.totalHoursLostWeek)}h \u00f7 0.5h per call = ${fmtNum(c.missedCallsWeek)} calls`,
      source:  'Chorus / ZoomInfo Sales Benchmark Report \u2014 average B2B sales call 30 minutes',
    },
    {
      summary: `${fmtNum(c.missedCallsCycle)} calls missed per ${c.cycleLabel.toLowerCase()} cycle`,
      working: `${fmtNum(c.missedCallsWeek)} calls \u00d7 ${c.cycleWeeks} weeks = ${fmtNum(c.missedCallsCycle)} calls`,
      source:  null,
    },
    {
      summary: `${fmtEur(c.pipelinePerCycle)} pipeline at risk per cycle at 5% conversion`,
      working: `${fmtNum(c.missedCallsCycle)} \u00d7 5% \u00d7 ${fmtEur(c.dealMidpoint)} avg deal = ${fmtEur(c.pipelinePerCycle)}`,
      source:  'Belkins B2B Outbound Benchmarks 2024 \u2014 conservative European outbound conversion rate',
    },
  ] : [];

  function reset() {
    setStep('deal'); setDealLabel(null); setCycleLabel(null);
    setTeamInput(''); setNumReps(null);
  }

  const isResults = step === 'results' && c;

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
          color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.65,
          whiteSpace: 'nowrap',
        }}>
          {'/* live model \u00b7 sources cited */'}
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: isResults ? 1200 : 580,
        transition: 'max-width 0.4s ease',
      }}>
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

              <div
                className="calc-results-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
                  gap: 'clamp(40px, 6vw, 88px)',
                  alignItems: 'start',
                }}
              >
                {/* LEFT — dominant number + outcome + CTA */}
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--text-muted)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: 24,
                  }}>
                    Your numbers
                  </div>

                  <AnimatePresence>
                    {showBigNum && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
                      >
                        <div style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(64px, 10vw, 128px)',
                          fontWeight: 700,
                          color: 'var(--coral)',
                          lineHeight: 0.95,
                          letterSpacing: '-0.04em',
                          marginBottom: 16,
                        }}>
                          <CountingNumber target={c.annualPipeline} duration={1400} />
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: 'var(--text-muted)', letterSpacing: '0.1em',
                          textTransform: 'uppercase', marginBottom: 36,
                        }}>
                          Annual pipeline at risk \u00b7 {c.numReps} rep{c.numReps > 1 ? 's' : ''}
                        </div>

                        <p style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(18px, 2.2vw, 26px)',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                          letterSpacing: '-0.015em',
                          margin: '0 0 40px',
                          maxWidth: 480,
                        }}>
                          That is the revenue your team is losing every year to admin and research time that Outround eliminates in{' '}
                          <span style={{ color: 'var(--coral)' }}>2 minutes</span>.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showCTA && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { const el = document.getElementById('how'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                          style={{
                            background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
                            color: '#0a0a0b', fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                            padding: '14px 36px', borderRadius: 999, border: 'none', cursor: 'pointer',
                            boxShadow: '0 0 28px rgba(242,107,69,0.25)', minHeight: 44,
                            marginBottom: 18, display: 'block',
                          }}
                        >
                          See how Outround recovers this.
                        </motion.button>
                        <button
                          onClick={reset}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)',
                            letterSpacing: '0.06em', padding: 0,
                          }}
                        >
                          Recalculate with different numbers
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT — proof rail */}
                {revealedRows > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    style={{
                      background: 'rgba(255,255,255,0.015)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 14,
                      padding: 'clamp(20px, 2.5vw, 32px)',
                    }}
                  >
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      color: 'var(--text-muted)', letterSpacing: '0.1em',
                      textTransform: 'uppercase', marginBottom: 14,
                    }}>
                      How we get there
                    </div>
                    {proofRows.slice(0, revealedRows).map((row, i) => (
                      <CollapsibleStep key={i} num={i + 1} summary={row.summary} working={row.working} source={row.source} delay={0} />
                    ))}
                  </motion.div>
                )}
              </div>

              <style>{`
                @media (max-width: 880px) {
                  .calc-results-grid { grid-template-columns: 1fr !important; }
                }
              `}</style>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
