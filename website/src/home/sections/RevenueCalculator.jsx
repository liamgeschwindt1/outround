import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEAL_OPTIONS = ['Under €5k', '€5k to €25k', '€25k to €100k', 'Over €100k'];
const CYCLE_OPTIONS = ['Under 30 days', '30 to 90 days', '90 to 180 days', 'Over 180 days'];

const DEAL_VALUES = {
  'Under €5k': 3000,
  '€5k to €25k': 15000,
  '€25k to €100k': 60000,
  'Over €100k': 150000,
};

// Average cycle in months — used to compute pipeline at risk per cycle
const CYCLE_MONTHS = {
  'Under 30 days': 0.75,
  '30 to 90 days': 2,
  '90 to 180 days': 4,
  'Over 180 days': 7,
};

const OUTROUND_PER_REP = 149;

function fmtEur(n) {
  if (n >= 100000) return `€${Math.round(n / 1000)}k`;
  if (n >= 1000) return `€${Math.round(n / 1000)}k`;
  return `€${n}`;
}

function calc(dealLabel, cycleLabel, numReps) {
  const dealVal = DEAL_VALUES[dealLabel];
  const cycleLen = CYCLE_MONTHS[cycleLabel];
  const adminHrs = Math.round(6.8 * numReps);
  const researchHrs = Math.round(6 * numReps);
  const missedCalls = Math.round((adminHrs + researchHrs) / 1.5);
  const pipelinePerCall = Math.round(dealVal * 0.15);
  const monthlyLeak = missedCalls * 4 * pipelinePerCall;
  const cycleRisk = Math.round(monthlyLeak * cycleLen);
  const outroundCost = numReps * OUTROUND_PER_REP;
  return { adminHrs, researchHrs, missedCalls, pipelinePerCall, monthlyLeak, cycleRisk, outroundCost, cycleLabel };
}

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

const STEP_SPRING = { type: 'spring', stiffness: 260, damping: 28 };

export default function RevenueCalculator() {
  const [step, setStep] = useState('deal');
  const [dealLabel, setDealLabel] = useState(null);
  const [cycleLabel, setCycleLabel] = useState(null);
  const [teamInput, setTeamInput] = useState('');
  const [teamError, setTeamError] = useState('');
  const [numReps, setNumReps] = useState(null);
  const [revealedLines, setRevealedLines] = useState(0);
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
    if (!n || n < 1 || n > 999) {
      setTeamError('Please enter a number between 1 and 999.');
      return;
    }
    setTeamError('');
    setNumReps(n);
    setTimeout(() => setStep('results'), 280);
  }

  // Focus input when team step loads
  useEffect(() => {
    if (step === 'team') {
      setTimeout(() => teamInputRef.current?.focus(), 350);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'results') return;
    setRevealedLines(0);
    setShowCTA(false);
    let count = 0;
    const total = 9; // lines including separator
    intervalRef.current = setInterval(() => {
      count++;
      setRevealedLines(count);
      if (count >= total) {
        clearInterval(intervalRef.current);
        setTimeout(() => setShowCTA(true), 500);
      }
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [step]);

  const c = dealLabel && cycleLabel && numReps ? calc(dealLabel, cycleLabel, numReps) : null;

  function buildLines(c) {
    return [
      {
        text: <>Your team spends <strong>{c.adminHrs} hours per week</strong> on CRM admin.</>,
        source: 'Reps spend 17% of their working week on data entry alone. — Salesforce State of Sales, 2025',
      },
      {
        text: <>They spend another <strong>{c.researchHrs} hours per week</strong> researching prospects before calls.</>,
        source: 'Forrester tracked 3,031 reps. 15% of the working week goes to prospect research before outreach. — Forrester Activity Study, 2025',
      },
      {
        text: <>That is <strong>{c.missedCalls} calls per week</strong> they are not making.</>,
      },
      {
        text: <>At your deal size, each missed call costs <strong>{fmtEur(c.pipelinePerCall)}</strong> in pipeline.</>,
      },
      {
        text: <>At a {c.cycleLabel.toLowerCase()} sales cycle, that is <strong>{fmtEur(c.cycleRisk)} in pipeline at risk</strong> per cycle.</>,
      },
      {
        text: (
          <>
            <strong style={{
              background: 'linear-gradient(135deg, #f26b45, #4ba3e3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>67%</strong>
            {' '}of revenue leaders do not trust the data in their own CRM.
          </>
        ),
        source: 'Gartner, 2025',
      },
      { separator: true },
      {
        text: <>The leak: <strong style={{ color: 'var(--coral)' }}>{fmtEur(c.monthlyLeak)} per month.</strong></>,
        large: true,
      },
      {
        text: <>Outround costs: <strong>{fmtEur(c.outroundCost)} per month.</strong></>,
        large: true,
      },
    ];
  }

  const lines = c ? buildLines(c) : [];

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
      <div style={{ width: '100%', maxWidth: 540 }}>
        <AnimatePresence mode="wait">

          {/* Step 1: Deal size */}
          {step === 'deal' && (
            <motion.div
              key="deal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={STEP_SPRING}
            >
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

          {/* Step 2: Sales cycle */}
          {step === 'cycle' && (
            <motion.div
              key="cycle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={STEP_SPRING}
            >
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

          {/* Step 3: Team size (free text) */}
          {step === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={STEP_SPRING}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
                The revenue leak calculator · 3 of 3
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28, lineHeight: 1.15 }}>
                How many salespeople on your team?
              </h2>
              <form onSubmit={submitTeam} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={teamInputRef}
                    type="number"
                    min="1"
                    max="999"
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
                      appearance: 'textfield',
                      MozAppearance: 'textfield',
                      WebkitAppearance: 'none',
                    }}
                  />
                </div>
                {teamError && (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ef4444' }}>{teamError}</div>
                )}
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
                  €{OUTROUND_PER_REP}/seat/month — no hidden fees
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 'results' && c && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 36 }}>
                Your numbers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {lines.map((line, i) =>
                  i < revealedLines ? (
                    line.separator ? (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ height: '0.5px', background: 'var(--border-md)', margin: '20px 0' }}
                      />
                    ) : (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ marginBottom: line.source ? 2 : 18 }}
                      >
                        <div style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: line.large ? 'clamp(17px, 2.5vw, 21px)' : 'clamp(14px, 1.8vw, 16px)',
                          color: 'var(--text-primary)',
                          lineHeight: 1.55,
                        }}>
                          {line.text}
                        </div>
                        {line.source && (
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            marginTop: 5,
                            marginBottom: 16,
                            lineHeight: 1.5,
                            fontStyle: 'italic',
                          }}>
                            {line.source}
                          </div>
                        )}
                      </motion.div>
                    )
                  ) : null
                )}
              </div>

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

