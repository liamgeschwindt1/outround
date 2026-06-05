import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEAL_OPTIONS = ['Under €5k', '€5k to €25k', '€25k to €100k', 'Over €100k'];
const CYCLE_OPTIONS = ['Under 30 days', '30 to 90 days', '90 to 180 days', 'Over 180 days'];

const DEAL_MIDPOINTS = {
  'Under €5k': 3000,
  '€5k to €25k': 15000,
  '€25k to €100k': 60000,
  'Over €100k': 150000,
};

// weeks per cycle, cycles per year
const CYCLE_CONFIG = {
  'Under 30 days':   { weeks: 4,  cyclesPerYear: 12 },
  '30 to 90 days':   { weeks: 8,  cyclesPerYear: 6  },
  '90 to 180 days':  { weeks: 16, cyclesPerYear: 3  },
  'Over 180 days':   { weeks: 26, cyclesPerYear: 2  },
};

const OUTROUND_PER_REP_MONTH = 149;
const HOURS_LOST_PER_REP_WEEK = 12.8; // 17% + 15% of 40h
const CALL_DURATION_HRS = 0.5;        // 30 min
const CONVERSION_RATE = 0.05;         // 5%

function fmtEur(n) {
  if (n >= 1000000) return `€${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `€${Math.round(n / 1000)}k`;
  return `€${Math.round(n)}`;
}

function fmtNum(n) {
  return Math.round(n).toLocaleString('en');
}

function calc(dealLabel, cycleLabel, numReps) {
  const dealMidpoint = DEAL_MIDPOINTS[dealLabel];
  const { weeks: cycleWeeks, cyclesPerYear } = CYCLE_CONFIG[cycleLabel];

  const hoursLostPerRepWeek = HOURS_LOST_PER_REP_WEEK;                       // step 1
  const totalHoursLostWeek = hoursLostPerRepWeek * numReps;                   // step 2
  const missedCallsWeek = totalHoursLostWeek / CALL_DURATION_HRS;            // step 3
  const missedCallsCycle = missedCallsWeek * cycleWeeks;                     // step 4
  const pipelinePerCycle = missedCallsCycle * CONVERSION_RATE * dealMidpoint; // step 5
  const annualPipeline = pipelinePerCycle * cyclesPerYear;                   // step 6
  const outroundAnnual = numReps * OUTROUND_PER_REP_MONTH * 12;              // step 7
  const roi = annualPipeline / outroundAnnual;                               // step 8

  return {
    dealLabel, cycleLabel, numReps, dealMidpoint,
    cycleWeeks, cyclesPerYear,
    hoursLostPerRepWeek,
    totalHoursLostWeek,
    missedCallsWeek,
    missedCallsCycle,
    pipelinePerCycle,
    annualPipeline,
    outroundAnnual,
    roi,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function StepLine({ num, label, value, source, isHighlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      style={{ marginBottom: source ? 4 : 16 }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          flexShrink: 0,
          minWidth: 20,
        }}>
          {num}.
        </span>
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: isHighlight ? 'clamp(15px, 2vw, 18px)' : 'clamp(13px, 1.7vw, 15px)',
            color: 'var(--text-sub)',
            lineHeight: 1.5,
          }}>
            {label}{' '}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: isHighlight ? 'clamp(15px, 2vw, 18px)' : 'clamp(13px, 1.7vw, 15px)',
            fontWeight: 700,
            color: isHighlight ? 'var(--coral)' : 'var(--text-primary)',
          }}>
            {value}
          </span>
        </div>
      </div>
      {source && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--text-muted)',
          marginTop: 3,
          marginBottom: 14,
          marginLeft: 32,
          lineHeight: 1.5,
          fontStyle: 'italic',
          opacity: 0.75,
        }}>
          {source}
        </div>
      )}
    </motion.div>
  );
}

const STEP_SPRING = { type: 'spring', stiffness: 260, damping: 28 };

// ─── Main component ───────────────────────────────────────────────────────────

export default function RevenueCalculator() {
  const [step, setStep] = useState('deal');
  const [dealLabel, setDealLabel] = useState(null);
  const [cycleLabel, setCycleLabel] = useState(null);
  const [teamInput, setTeamInput] = useState('');
  const [teamError, setTeamError] = useState('');
  const [numReps, setNumReps] = useState(null);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const intervalRef = useRef(null);
  const teamInputRef = useRef(null);

  function selectDeal(label) {
    setDealLabel(label);
    setTimeout(() => setStep('cycle'), 280);
  }

  function selectCycle(label) {
    setCycleLabel(label);
    setTimeout(() => setStep('team'), 280);
  }

  function submitTeam(e) {
    e?.preventDefault();
    const n = parseInt(teamInput, 10);
    if (!n || n < 1 || n > 9999) {
      setTeamError('Please enter a number between 1 and 9999.');
      return;
    }
    setTeamError('');
    setNumReps(n);
    setTimeout(() => setStep('results'), 280);
  }

  useEffect(() => {
    if (step === 'team') setTimeout(() => teamInputRef.current?.focus(), 350);
  }, [step]);

  const TOTAL_STEPS = 10; // 8 calc steps + separator + ROI

  useEffect(() => {
    if (step !== 'results') return;
    setRevealedSteps(0);
    setShowCTA(false);
    let count = 0;
    intervalRef.current = setInterval(() => {
      count++;
      setRevealedSteps(count);
      if (count >= TOTAL_STEPS) {
        clearInterval(intervalRef.current);
        setTimeout(() => setShowCTA(true), 500);
      }
    }, 750);
    return () => clearInterval(intervalRef.current);
  }, [step]);

  const c = dealLabel && cycleLabel && numReps ? calc(dealLabel, cycleLabel, numReps) : null;

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
        padding: 'clamp(64px, 10vw, 100px) 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 580 }}>
        <AnimatePresence mode="wait">

          {/* Step 1 — Deal size */}
          {step === 'deal' && (
            <motion.div key="deal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator · 1 of 3
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                What is your average deal size?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DEAL_OPTIONS.map(opt => <ChoiceButton key={opt} label={opt} onClick={() => selectDeal(opt)} />)}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Sales cycle */}
          {step === 'cycle' && (
            <motion.div key="cycle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator · 2 of 3
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                How long is your average sales cycle?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CYCLE_OPTIONS.map(opt => <ChoiceButton key={opt} label={opt} onClick={() => selectCycle(opt)} />)}
              </div>
            </motion.div>
          )}

          {/* Step 3 — Team size */}
          {step === 'team' && (
            <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={STEP_SPRING}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator · 3 of 3
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                How many salespeople on your team?
              </h2>
              <form onSubmit={submitTeam} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  ref={teamInputRef}
                  type="number"
                  min="1"
                  max="9999"
                  value={teamInput}
                  onChange={e => { setTeamInput(e.target.value); setTeamError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') submitTeam(); }}
                  placeholder="e.g. 12"
                  style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    border: `0.5px solid ${teamError ? '#ef4444' : 'rgba(242,107,69,0.45)'}`,
                    borderRadius: 10,
                    padding: '16px 20px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(28px, 5vw, 40px)',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
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
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    fontWeight: 700,
                    padding: '14px 32px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: teamInput ? 'pointer' : 'default',
                    minHeight: 44,
                    transition: 'background 0.2s, color 0.2s',
                    alignSelf: 'flex-start',
                  }}
                >
                  Calculate the leak →
                </motion.button>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  €{OUTROUND_PER_REP_MONTH}/seat/month — no hidden fees
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 4 — Results */}
          {step === 'results' && c && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 36 }}>
                Your numbers
              </div>

              {/* Step 1 */}
              {revealedSteps >= 1 && (
                <StepLine
                  num="1"
                  label="Hours lost per rep per week"
                  value={`${c.hoursLostPerRepWeek}h`}
                  source="17% on CRM admin (Salesforce State of Sales, 2025) + 15% on prospect research (Forrester Activity Study, 2025) × 40h working week"
                />
              )}

              {/* Step 2 */}
              {revealedSteps >= 2 && (
                <StepLine
                  num="2"
                  label={`Total hours lost across ${c.numReps} rep${c.numReps > 1 ? 's' : ''} per week`}
                  value={`${c.hoursLostPerRepWeek} × ${c.numReps} = ${fmtNum(c.totalHoursLostWeek)}h`}
                />
              )}

              {/* Step 3 */}
              {revealedSteps >= 3 && (
                <StepLine
                  num="3"
                  label="Missed calls per week (30 min average call)"
                  value={`${fmtNum(c.totalHoursLostWeek)}h ÷ 0.5h = ${fmtNum(c.missedCallsWeek)} calls`}
                  source="Chorus / ZoomInfo Sales Benchmark Report — average B2B sales call 30 minutes"
                />
              )}

              {/* Step 4 */}
              {revealedSteps >= 4 && (
                <StepLine
                  num="4"
                  label={`Missed calls per ${c.cycleLabel.toLowerCase()} cycle (${c.cycleWeeks} weeks)`}
                  value={`${fmtNum(c.missedCallsWeek)} × ${c.cycleWeeks} = ${fmtNum(c.missedCallsCycle)} calls`}
                />
              )}

              {/* Step 5 */}
              {revealedSteps >= 5 && (
                <StepLine
                  num="5"
                  label={`Pipeline at risk per cycle (5% conversion × ${fmtEur(c.dealMidpoint)} deal)`}
                  value={`${fmtNum(c.missedCallsCycle)} × 5% × ${fmtEur(c.dealMidpoint)} = ${fmtEur(c.pipelinePerCycle)}`}
                  source="Belkins B2B Outbound Benchmarks, 2024 — conservative European outbound call-to-opportunity rate"
                />
              )}

              {/* Step 6 */}
              {revealedSteps >= 6 && (
                <StepLine
                  num="6"
                  label={`Annual pipeline at risk (${c.cyclesPerYear} cycles/year)`}
                  value={`${fmtEur(c.pipelinePerCycle)} × ${c.cyclesPerYear} = ${fmtEur(c.annualPipeline)}`}
                  isHighlight
                />
              )}

              {/* Separator */}
              {revealedSteps >= 7 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ height: '0.5px', background: 'var(--border-md)', margin: '16px 0' }}
                />
              )}

              {/* Step 7 */}
              {revealedSteps >= 8 && (
                <StepLine
                  num="7"
                  label={`Outround annual cost (${c.numReps} rep${c.numReps > 1 ? 's' : ''} × €${OUTROUND_PER_REP_MONTH}/mo × 12)`}
                  value={fmtEur(c.outroundAnnual)}
                />
              )}

              {/* Step 8 — ROI */}
              {revealedSteps >= 9 && (
                <StepLine
                  num="8"
                  label="Return on investment"
                  value={`${c.roi.toFixed(0)}×`}
                  isHighlight
                />
              )}

              {/* Disclaimer + refs */}
              {revealedSteps >= 10 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div style={{
                    marginTop: 28,
                    padding: '14px 16px',
                    background: 'var(--bg-card)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 8,
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    lineHeight: 1.65,
                    marginBottom: 20,
                  }}>
                    This calculation reflects only the pipeline impact of time lost to admin and research. It does not account for the increase in close rate resulting from improved call quality and intelligence — which Outround also delivers.
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {showCTA && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(242,107,69,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => document.getElementById('invisible')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{
                      marginTop: 28,
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
                    See what Outround reveals
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
