import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { Button } from '../design/primitives/Button';
import { useTypewriter } from '../hooks/useTypewriter';

const WELCOMED_KEY = 'outround_welcomed';

const lines = [
  { text: 'They train.', delay: 200, speed: 60 },
  { text: 'You ready.', delay: 400, speed: 60 },
];

const tagline = 'The round before it counts.';

const beats = [
  { kicker: '01', title: 'Brief in 30s', body: 'Persona, stakes, posture. Then it disappears.' },
  { kicker: '02', title: 'One round', body: 'Live call. They push back. You hold the line.' },
  { kicker: '03', title: 'Go again', body: 'Score, beats, the one thing to change. Reload.' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showBeats, setShowBeats] = useState(false);
  const [showCTA, setShowCTA] = useState(false);

  const line1 = useTypewriter({
    text: lines[0].text,
    speedMs: lines[0].speed,
    startDelayMs: lines[0].delay,
    enabled: step >= 0,
    onDone: () => setStep(1),
  });

  const line2 = useTypewriter({
    text: lines[1].text,
    speedMs: lines[1].speed,
    startDelayMs: 250,
    enabled: step >= 1,
    onDone: () => setStep(2),
  });

  const tagTw = useTypewriter({
    text: tagline,
    speedMs: 35,
    startDelayMs: 450,
    enabled: step >= 2,
    onDone: () => {
      setTimeout(() => setShowBeats(true), 350);
      setTimeout(() => setShowCTA(true), 1100);
    },
  });

  useEffect(() => {
    if (localStorage.getItem(WELCOMED_KEY) === '1') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const proceed = () => {
    localStorage.setItem(WELCOMED_KEY, '1');
    navigate('/login');
  };

  return (
    <div
      className="dot-grid"
      style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient wash, top-left */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(240,90,50,0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: 880, textAlign: 'center', position: 'relative' }}>
        <div
          style={{
            fontFamily: T.display,
            fontWeight: 700,
            fontSize: 'clamp(48px, 9vw, 96px)',
            lineHeight: 1.02,
            letterSpacing: -2.4,
            color: T.t1,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'block' }}>
            {line1.out}
            {!line1.done && <span className="tw-cursor" style={{ height: '0.85em' }} />}
          </div>
          <div style={{ display: 'block', minHeight: '1.05em' }}>
            {step >= 1 && (
              <>
                {line2.out}
                {!line2.done && line1.done && (
                  <span className="tw-cursor" style={{ height: '0.85em' }} />
                )}
              </>
            )}
          </div>
        </div>

        <div
          style={{
            fontFamily: T.display,
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(20px, 3vw, 28px)',
            color: T.coral,
            letterSpacing: -0.4,
            minHeight: '1.4em',
            marginBottom: 56,
          }}
        >
          {step >= 2 && (
            <>
              {tagTw.out}
              {!tagTw.done && <span className="tw-cursor" />}
            </>
          )}
        </div>

        {/* Three beats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 48,
            opacity: showBeats ? 1 : 0,
            transform: showBeats ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 500ms ease, transform 500ms ease',
          }}
        >
          {beats.map((b, i) => (
            <div
              key={b.kicker}
              style={{
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: R.lg,
                padding: '20px 18px',
                textAlign: 'left',
                transition: `all 400ms ease ${i * 100}ms`,
                opacity: showBeats ? 1 : 0,
                transform: showBeats ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.t3,
                  letterSpacing: 0.6,
                  marginBottom: 10,
                }}
              >
                {b.kicker}
              </div>
              <div
                style={{
                  fontFamily: T.display,
                  fontWeight: 600,
                  fontSize: 16,
                  color: T.t1,
                  marginBottom: 6,
                  letterSpacing: -0.2,
                }}
              >
                {b.title}
              </div>
              <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.45 }}>{b.body}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            opacity: showCTA ? 1 : 0,
            transform: showCTA ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 400ms ease, transform 400ms ease',
            display: 'inline-block',
          }}
        >
          <Button variant="primary" size="lg" onClick={proceed}>
            Enter the round →
          </Button>
        </div>
      </div>
    </div>
  );
}
