import { useState } from 'react';
import { Card } from '../../../design/primitives/Card';
import { T, R } from '../../../design/tokens';
import { useToast } from '../../../design/primitives/Toast';

export function CoachOrbCard() {
  const toast = useToast();
  const [pulsing, setPulsing] = useState(false);

  const activate = () => {
    setPulsing(true);
    toast.push('Coach — coming soon. They’ll meet you here after every round.', 'info');
    setTimeout(() => setPulsing(false), 900);
  };

  return (
    <Card
      span={4}
      style={{
        background: T.bgCard,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        minHeight: 220,
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={activate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 35%, rgba(240,90,50,0.10), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: R.pill,
          background:
            'radial-gradient(circle at 30% 30%, #ff7a52 0%, #f05a32 40%, #3d9fd4 100%)',
          boxShadow: '0 12px 40px rgba(240,90,50,0.35)',
          animation: pulsing ? 'orb-pulse 700ms ease' : undefined,
          position: 'relative',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontFamily: T.display,
            fontWeight: 600,
            fontSize: 15,
            color: T.t1,
            marginBottom: 4,
          }}
        >
          Coach
        </div>
        <div style={{ fontSize: 12, color: T.t2 }}>Tap to summon. Coming soon.</div>
      </div>
    </Card>
  );
}
