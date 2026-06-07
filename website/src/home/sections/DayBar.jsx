import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOTAL_H    = 8;
const SHRINK     = 0.2; // coral segments contract to 20% of original width

const SEGS = [
  { id: 'selling',   label: 'Selling',   sub: 'connected calls',  hours: 2.3,  coral: false, rec: false, color: '#4ba3e3' },
  { id: 'recovered', label: 'Recovered', sub: 'selling time',      hours: 0,    coral: false, rec: true,  color: 'rgba(75,163,227,0.55)' },
  { id: 'crm',       label: 'CRM',       sub: 'manual logging',    hours: 1.45, coral: true,  rec: false, color: '#f26b45' },
  { id: 'research',  label: 'Research',  sub: 'pre-call',          hours: 1.3,  coral: true,  rec: false, color: '#e85c38' },
  { id: 'followup',  label: 'Follow-up', sub: 'emails',            hours: 0.8,  coral: true,  rec: false, color: '#d44c2e' },
  { id: 'meetings',  label: 'Meetings',  sub: '& admin',           hours: 1.15, coral: false, rec: false, color: 'rgba(242,241,239,0.11)' },
  { id: 'other',     label: 'Other',     sub: 'non-selling',       hours: 1.0,  coral: false, rec: false, color: 'rgba(242,241,239,0.05)' },
];

const CORAL_H         = SEGS.filter(s => s.coral).reduce((a, s) => a + s.hours, 0); // 3.55h
const REC_H           = parseFloat((CORAL_H * (1 - SHRINK)).toFixed(2));             // 2.84h
const AFTER_SELL_H    = parseFloat((2.3 + REC_H).toFixed(2));                        // 5.14h
const BEFORE_SELL_PCT = Math.round(2.3 / TOTAL_H * 100);                             // 29
const AFTER_SELL_PCT  = Math.round(AFTER_SELL_H / TOTAL_H * 100);                    // 64

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(n) {
  if (n >= 1_000_000) return '\u20ac' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '\u20ac' + Math.round(n / 1_000) + 'k';
  return '\u20ac' + Math.round(n);
}

function CountUp({ target, duration = 1200, fmt }) {
  const [v, setV] = useState(0);
  const t0  = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    t0.current = null;
    function step(ts) {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return <>{fmt ? fmt(v) : Math.round(v)}</>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DayBar() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const [animated,  setAnimated]  = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [recPipe,   setRecPipe]   = useState(null);
  const [numReps,   setNumReps]   = useState(null);

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setAnimated(true),  800);
    const t2 = setTimeout(() => setShowStats(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isInView]);

  useEffect(() => {
    const read = () => {
      try {
        const r = localStorage.getItem('outround_recovered');
        const n = localStorage.getItem('outround_reps');
        if (r) setRecPipe(parseFloat(r));
        if (n) setNumReps(parseInt(n, 10));
      } catch (_) {}
    };
    read();
    const onCalc = e => {
      if (e?.detail) { setRecPipe(e.detail.recovered); setNumReps(e.detail.reps); }
    };
    window.addEventListener('outround:calc', onCalc);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener('outround:calc', onCalc);
      window.removeEventListener('storage', read);
    };
  }, []);

  const dispReps   = numReps || 10;
  // Default: REC_H hrs/rep/day → (1 call per 30 min) × 250 days × 3% close × €15k ACV × N reps
  const defaultRec = REC_H / 0.5 * 250 * 0.03 * 15_000 * dispReps;
  const annualRec  = recPipe || defaultRec;

  // Flex-grow for each segment
  const grow = (seg) => {
    if (seg.rec)   return animated ? REC_H          : 0.0001;
    if (seg.coral) return animated ? seg.hours * SHRINK : seg.hours;
    return seg.hours;
  };

  // Label opacity
  const labelOp = (seg) => {
    if (seg.coral) return animated ? 0 : 1;
    if (seg.rec)   return animated ? 1 : 0;
    return 1;
  };

  const TRANS_BAR   = 'flex-grow 1.15s cubic-bezier(0.16, 1, 0.3, 1)';
  const TRANS_LABEL = 'flex-grow 1.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';
  const EASE        = { duration: 0.45, ease: [0.0, 0.0, 0.2, 1] };

  return (
    <section
      id="daybar"
      ref={ref}
      style={{
        background: '#111114',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(72px, 9vw, 110px) clamp(20px, 4vw, 56px)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 900 }}>

        {/* Section meta */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'clamp(32px, 5vw, 52px)', gap: 24,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--coral)', opacity: 0.8 }} />
            The 8-hour day
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', letterSpacing: '0.1em', opacity: 0.55, whiteSpace: 'nowrap',
          }}>
            {'/* where the time actually goes */'}
          </div>
        </div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={EASE}
          style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em',
            lineHeight: 1.1, margin: '0 0 12px',
          }}
        >
          A rep&rsquo;s day. Before and after Outround.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ ...EASE, delay: 0.15 }}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 'clamp(14px, 1.5vw, 16px)',
            color: 'var(--text-sub)', lineHeight: 1.65,
            margin: '0 0 clamp(28px, 4vw, 48px)', maxWidth: 560,
          }}
        >
          Out of an 8-hour day, only 2.3 hours are spent on calls. The rest is admin that already
          happened &mdash; now happening again.
        </motion.p>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ ...EASE, delay: 0.2 }}
          style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}
        >
          {[
            { color: '#4ba3e3',                   label: 'Selling time' },
            { color: '#f26b45',                   label: 'Outround eliminates' },
            { color: 'rgba(242,241,239,0.14)',    label: 'Other · unchanged', border: true },
          ].map(({ color, label, border }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                background: color,
                border: border ? '0.5px solid rgba(242,241,239,0.2)' : 'none',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* State label */}
        <div style={{ height: 20, marginBottom: 10 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={animated ? 'after' : 'before'}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: animated ? 'var(--coral)' : 'var(--text-muted)',
              }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
                background: animated ? 'var(--coral)' : 'var(--text-muted)',
                transition: 'background 0.3s',
              }} />
              {animated ? 'After Outround' : 'Before Outround'}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bar ───────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...EASE, delay: 0.3 }}
        >
          {/* Segment bar */}
          <div style={{
            display: 'flex', height: 64, borderRadius: 10,
            overflow: 'hidden', width: '100%',
          }}>
            {SEGS.map((seg, i) => (
              <div
                key={seg.id}
                style={{
                  flexGrow: grow(seg), flexShrink: 1, flexBasis: 0,
                  minWidth: 0, background: seg.color,
                  borderLeft: i > 0 ? '1.5px solid rgba(0,0,0,0.18)' : 'none',
                  transition: TRANS_BAR,
                }}
              />
            ))}
          </div>

          {/* Label row — same flex proportions as bar */}
          <div style={{ display: 'flex', width: '100%', marginTop: 10, alignItems: 'flex-start' }}>
            {SEGS.map(seg => (
              <div
                key={seg.id}
                style={{
                  flexGrow: grow(seg), flexShrink: 1, flexBasis: 0,
                  minWidth: 0, overflow: 'hidden',
                  paddingRight: 4,
                  opacity: labelOp(seg),
                  transition: TRANS_LABEL,
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: seg.rec ? '#4ba3e3' : (seg.coral ? 'var(--coral)' : 'var(--text-muted)'),
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  lineHeight: 1.35, whiteSpace: 'nowrap',
                }}>
                  {seg.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 11,
                  color: seg.rec ? 'rgba(75,163,227,0.65)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {seg.rec ? `+${REC_H.toFixed(1)}h` : `${seg.hours}h`}
                </div>
              </div>
            ))}
          </div>

          {/* Selling % callout */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginTop: 28, paddingTop: 20,
            borderTop: '0.5px solid var(--border)',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Selling time
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
                color: animated ? 'rgba(75,163,227,0.3)' : '#4ba3e3',
                transition: 'color 0.5s ease',
              }}>
                {BEFORE_SELL_PCT}%
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                →
              </span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
                color: animated ? '#4ba3e3' : 'rgba(75,163,227,0.2)',
                transition: 'color 0.6s ease 0.6s',
              }}>
                {AFTER_SELL_PCT}%
              </span>
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', opacity: 0.65,
            }}>
              of the working day
            </span>
          </div>

          {/* Stats — appear after animation completes */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.0, 0.0, 0.2, 1] }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                  marginTop: 28,
                }}
              >
                {/* Hours recovered */}
                <div style={{
                  background: 'rgba(75,163,227,0.06)',
                  border: '0.5px solid rgba(75,163,227,0.18)',
                  borderRadius: 10, padding: '18px 20px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    color: 'rgba(75,163,227,0.55)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    Recovered per rep / day
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 38,
                    fontWeight: 700, color: '#4ba3e3', lineHeight: 1,
                  }}>
                    <CountUp
                      target={REC_H}
                      duration={900}
                      fmt={v => (Math.round(v * 10) / 10).toFixed(1)}
                    />h
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'rgba(75,163,227,0.45)', marginTop: 6,
                  }}>
                    back in selling time, every day
                  </div>
                </div>

                {/* Pipeline recovered */}
                <div style={{
                  background: 'rgba(242,107,69,0.06)',
                  border: '0.5px solid rgba(242,107,69,0.18)',
                  borderRadius: 10, padding: '18px 20px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    color: 'rgba(242,107,69,0.55)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: 8,
                  }}>
                    {recPipe
                      ? 'Pipeline recovered \u00b7 per month'
                      : `Recovered pipeline \u00b7 ${dispReps} reps \u00b7 \u20ac15k ACV`}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 38,
                    fontWeight: 700, color: 'var(--coral)', lineHeight: 1,
                  }}>
                    <CountUp target={annualRec / 12} duration={1200} fmt={fmtEur} />
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'rgba(242,107,69,0.45)', marginTop: 6,
                  }}>
                    per month &middot; {dispReps} rep{dispReps !== 1 ? 's' : ''} &middot; 3% close rate
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
