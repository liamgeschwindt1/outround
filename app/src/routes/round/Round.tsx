import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R, scoreColor } from '../../design/tokens';
import { Num } from '../../design/primitives/Text';

// ─── Types ────────────────────────────────────────────────────────────────────

type RoundState = 'choose' | 'brief' | 'live' | 'loading' | 'analysis';

interface Persona {
  id: string;
  name: string;
  flag: string;
  role: string;
  company: string;
  resistance: number;
  avgScore: number;
  locked?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'cold-call', label: 'Cold Call', active: true },
  { id: 'investor', label: 'Investor Pitch', active: false },
  { id: 'discovery', label: 'Customer Discovery', active: false },
  { id: 'negotiation', label: 'Negotiation', active: false },
];

const PERSONAS: Persona[] = [
  { id: 'hendrik', name: 'Hendrik van der Berg', flag: '🇳🇱', role: 'CFO', company: 'Vandermeer Logistics', resistance: 3, avgScore: 71 },
  { id: 'natalie', name: 'Natalie Bauer', flag: '🇩🇪', role: 'Partner', company: 'Volta Capital', resistance: 4, avgScore: 64, locked: true },
  { id: 'coming1', name: 'Coming soon', flag: '🇸🇪', role: '—', company: '—', resistance: 0, avgScore: 0, locked: true },
  { id: 'coming2', name: 'Coming soon', flag: '🇫🇮', role: '—', company: '—', resistance: 0, avgScore: 0, locked: true },
];

// ─── Loading steps ────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { id: 'transcribe', label: 'Transcribing' },
  { id: 'tone', label: 'Analysing tone' },
  { id: 'coaching', label: 'Generating coaching' },
  { id: 'report', label: 'Building report' },
];

// ─── Seeded analysis data ────────────────────────────────────────────────────

const SEED_ANALYSIS = {
  score: 67,
  dimensions: [
    { label: 'Opening', score: 82 },
    { label: 'Objections', score: 58 },
    { label: 'Pace', score: 71 },
    { label: 'Talk ratio', score: 65 },
    { label: 'Closing', score: 74 },
  ],
  metrics: ['240 wpm peak', '3:12 monologue', '0.3s response', '14 filler words'],
  headline: 'You handed Hendrik an exit at 0:47. Everything after that was damage limitation.',
  transcript: [
    { speaker: 'You', text: 'Hi Hendrik, I\'m calling from Outround — we help sales teams get ready before high-stakes calls.', annotation: 'Strong opener. Good pacing.', positive: true },
    { speaker: 'Hendrik', text: 'What do you actually want?' },
    { speaker: 'You', text: 'Right so the reason I\'m calling is — we\'ve been working with a few logistics firms and', annotation: 'Pace jumped to 240wpm. Hendrik felt that.', positive: false },
    { speaker: 'Hendrik', text: 'I\'m not interested. We already have a training platform.' },
    { speaker: 'You', text: 'Of course, and I totally understand — actually that\'s exactly why I wanted to speak with you...', annotation: 'Filler words spike here. Lost authority.', positive: false },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResistanceDots({ level }: { level: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i < level ? T.coral : T.bgHover,
          }}
        />
      ))}
    </div>
  );
}

function PersonaCard({ persona, onSelect }: { persona: Persona; onSelect: () => void }) {
  const faded = persona.locked && persona.id.startsWith('coming');
  return (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: R.xl,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: faded ? 0.35 : 1,
        transition: 'border-color 150ms, transform 150ms',
        cursor: persona.locked ? 'default' : 'pointer',
        position: 'relative',
      }}
      onClick={() => !persona.locked && onSelect()}
      onMouseEnter={e => { if (!persona.locked) (e.currentTarget).style.borderColor = T.borderStr; }}
      onMouseLeave={e => { if (!persona.locked) (e.currentTarget).style.borderColor = T.border; }}
    >
      {persona.locked && !faded && (
        <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontFamily: T.mono, color: T.t3, background: T.bgSub, padding: '2px 6px', borderRadius: R.sm, border: `1px solid ${T.border}` }}>
          COMING SOON
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>{persona.flag}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>{persona.name}</div>
          <div style={{ fontSize: 12, color: T.t3 }}>{persona.role} · {persona.company}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: T.t4, marginBottom: 4 }}>RESISTANCE</div>
          <ResistanceDots level={persona.resistance} />
        </div>
        {persona.avgScore > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: T.t4, marginBottom: 2 }}>AVG SCORE</div>
            <span style={{ fontSize: 18, fontWeight: 600, color: scoreColor(persona.avgScore), fontFamily: T.numeric }}>
              {persona.avgScore}
            </span>
          </div>
        )}
      </div>
      {!persona.locked && (
        <button
          style={{
            padding: '8px 0',
            background: T.grad,
            border: 'none',
            borderRadius: R.md,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Start →
        </button>
      )}
    </div>
  );
}

// ─── Round page ───────────────────────────────────────────────────────────────

export default function Round() {
  const nav = useNavigate();
  const [state, setState] = useState<RoundState>('choose');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [activeMode, setActiveMode] = useState('cold-call');
  const [briefSeconds, setBriefSeconds] = useState(30);
  const [callSeconds, setCallSeconds] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Brief countdown
  useEffect(() => {
    if (state !== 'brief') return;
    timerRef.current = window.setInterval(() => {
      setBriefSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setState('live');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { clearInterval(timerRef.current!); };
  }, [state]);

  // Call timer
  useEffect(() => {
    if (state !== 'live') return;
    timerRef.current = window.setInterval(() => { setCallSeconds(s => s + 1); }, 1000);
    return () => { clearInterval(timerRef.current!); };
  }, [state]);

  // Loading pipeline
  useEffect(() => {
    if (state !== 'loading') return;
    let step = 0;
    const advance = () => {
      step++;
      if (step >= LOADING_STEPS.length) {
        clearInterval(iv);
        setTimeout(() => { setState('analysis'); }, 400);
      } else {
        setLoadingStep(step);
      }
    };
    const iv = window.setInterval(advance, 1200);
    return () => { clearInterval(iv); };
  }, [state]);

  const startRound = (persona: Persona) => {
    setSelectedPersona(persona);
    setBriefSeconds(30);
    setState('brief');
  };

  const endCall = () => {
    clearInterval(timerRef.current!);
    setState('loading');
    setLoadingStep(0);
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Analysis view ──────────────────────────────────────────────────────────

  if (state === 'analysis') {
    const a = SEED_ANALYSIS;
    return (
      <div>
        {/* Headline */}
        <div style={{ padding: '14px 20px', background: `rgba(240,90,50,0.06)`, border: `1px solid rgba(240,90,50,0.2)`, borderRadius: R.xl, marginBottom: 20, fontSize: 14, color: T.t2, fontStyle: 'italic' }}>
          "{a.headline}"
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
          {/* Transcript */}
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            <div style={{ fontSize: 10, fontFamily: T.mono, letterSpacing: 0.6, color: T.t3, marginBottom: 14 }}>TRANSCRIPT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {a.transcript.map((line, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: line.speaker === 'You' ? T.coral : T.sky, flexShrink: 0, width: 50 }}>
                      {line.speaker}
                    </span>
                    <span style={{ fontSize: 13, color: T.t1, lineHeight: 1.6 }}>{line.text}</span>
                  </div>
                  {line.annotation && (
                    <div style={{ marginLeft: 58, marginTop: 4, fontSize: 12, color: line.positive ? T.green : T.amber, fontStyle: 'italic' }}>
                      ↳ {line.annotation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Score panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: 20 }}>
              <Num style={{ fontSize: 64, fontWeight: 600, lineHeight: 1, color: scoreColor(a.score), display: 'block' }}>
                {a.score}
              </Num>
              <div style={{ fontSize: 14, color: T.t3, marginBottom: 16 }}>/100</div>
              {a.dimensions.map(d => (
                <div key={d.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: d.score < 65 ? T.coral : T.t2 }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontFamily: T.numeric, color: scoreColor(d.score) }}>{d.score}</span>
                  </div>
                  <div style={{ height: 3, background: T.bgHover, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${d.score}%`, background: scoreColor(d.score), borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: 16 }}>
              {a.metrics.map(m => (
                <div key={m} style={{ fontSize: 12, color: T.t2, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                  {m}
                </div>
              ))}
            </div>

            {/* Actions */}
            <button
              onClick={() => { setState('choose'); }}
              style={{ padding: '10px', background: T.grad, border: 'none', borderRadius: R.md, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Go again →
            </button>
            <button
              onClick={() => {/* share */}}
              style={{ padding: '10px', background: T.bgElevate, border: `1px solid ${T.borderMd}`, borderRadius: R.md, color: T.t2, fontSize: 13, cursor: 'pointer' }}
            >
              Share {a.score}/100
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: '32px 40px', minWidth: 280 }}>
          <div style={{ fontSize: 14, color: T.t3, marginBottom: 20, textAlign: 'center' }}>
            Hendrik just hung up.
          </div>
          {LOADING_STEPS.map((step, i) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: i < loadingStep ? T.green : i === loadingStep ? T.coral : T.bgHover,
                border: i === loadingStep ? `2px solid ${T.coral}` : 'none',
                flexShrink: 0,
                transition: 'background 300ms',
              }} />
              <span style={{ fontSize: 13, color: i <= loadingStep ? T.t1 : T.t3 }}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Live call ──────────────────────────────────────────────────────────────

  if (state === 'live') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: '32px 40px', textAlign: 'center', minWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', animation: 'orb-pulse 1s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontFamily: T.mono, color: T.red, letterSpacing: 0.5 }}>LIVE</span>
            <span style={{ fontSize: 14, fontFamily: T.mono, color: T.t1, marginLeft: 8 }}>{fmtTime(callSeconds)}</span>
          </div>
          {/* Waveform */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 40, marginBottom: 24 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  borderRadius: 2,
                  background: T.coral,
                  height: `${20 + Math.random() * 60}%`,
                  opacity: 0.6 + Math.random() * 0.4,
                  animation: `waveform-${i} 0.${3 + (i % 5)}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
          <button
            onClick={endCall}
            style={{
              padding: '10px 32px',
              background: 'rgba(220,38,38,0.1)',
              border: `1px solid rgba(220,38,38,0.4)`,
              borderRadius: R.pill,
              color: T.red,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            End call
          </button>
        </div>
      </div>
    );
  }

  // ── Brief ──────────────────────────────────────────────────────────────────

  if (state === 'brief' && selectedPersona) {
    const progress = ((30 - briefSeconds) / 30) * 100;
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(9,9,10,0.85)',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderMd}`, borderRadius: R.xl, padding: '32px 40px', maxWidth: 400, width: '100%' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 32 }}>{selectedPersona.flag}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.t1 }}>{selectedPersona.name}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>{selectedPersona.role} · {selectedPersona.company}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.6, marginBottom: 24 }}>
            You're calling about a software solution for logistics operations. Hendrik is skeptical, time-poor, and data-driven. You have 90 seconds before he hangs up.
          </div>
          {/* Countdown bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 4, background: T.bgHover, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: T.grad, borderRadius: 2, transition: 'width 1s linear' }} />
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 13, color: T.t1, width: 28, flexShrink: 0 }}>
              0:{String(briefSeconds).padStart(2, '0')}
            </span>
          </div>
          <div style={{ fontSize: 11, color: T.t4, marginTop: 8, textAlign: 'center' }}>
            Brief disappears when the call starts
          </div>
        </div>
      </div>
    );
  }

  // ── Choose ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => mode.active && setActiveMode(mode.id)}
              style={{
                padding: '7px 16px',
                background: activeMode === mode.id ? T.bgHover : 'transparent',
                border: `1px solid ${activeMode === mode.id ? T.borderMd : T.border}`,
                borderRadius: R.pill,
                color: !mode.active ? T.t4 : activeMode === mode.id ? T.t1 : T.t2,
                fontSize: 13,
                cursor: mode.active ? 'pointer' : 'not-allowed',
                opacity: !mode.active ? 0.5 : 1,
                transition: 'all 120ms',
              }}
            >
              {mode.label}
              {!mode.active && <span style={{ fontSize: 10, marginLeft: 6, color: T.t4 }}>locked</span>}
            </button>
          ))}
        </div>

        {/* Persona grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {PERSONAS.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onSelect={() => { startRound(persona); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
