import type { CSSProperties, ReactNode } from 'react';
import { T, R } from '../tokens';

// ─── Mono ────────────────────────────────────────────────────────────────────
export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 0.4, ...style }}>
      {children}
    </span>
  );
}

// ─── Numeric (DM Mono) ───────────────────────────────────────────────────────
export function Num({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span style={{ fontFamily: T.numeric, fontVariantNumeric: 'tabular-nums', ...style }}>
      {children}
    </span>
  );
}

// ─── Hairline divider ────────────────────────────────────────────────────────
export function Hairline({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: T.border, ...style }} />;
}

// ─── Section header ──────────────────────────────────────────────────────────
export function SectionHead({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <header style={{ marginBottom: 16 }}>
      {kicker && (
        <Mono
          style={{ color: T.t3, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}
        >
          {kicker}
        </Mono>
      )}
      <h2
        style={{
          fontFamily: T.display,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: -0.4,
          margin: 0,
          color: T.t1,
        }}
      >
        {title}
      </h2>
    </header>
  );
}

// ─── Label (form/meta) ───────────────────────────────────────────────────────
export function Label({ children }: { children: ReactNode }) {
  return (
    <Mono style={{ color: T.t2, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
      {children}
    </Mono>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
type TagKind = 'neutral' | 'coral' | 'sky' | 'good' | 'warn' | 'bad';
const tagPalette: Record<TagKind, { bg: string; bd: string; fg: string }> = {
  neutral: { bg: 'rgba(255,255,255,0.04)', bd: T.border, fg: T.t2 },
  coral: { bg: 'rgba(240,90,50,0.10)', bd: 'rgba(240,90,50,0.35)', fg: T.coral },
  sky: { bg: 'rgba(61,159,212,0.10)', bd: 'rgba(61,159,212,0.35)', fg: T.sky },
  good: { bg: 'rgba(22,163,74,0.10)', bd: 'rgba(22,163,74,0.35)', fg: T.green },
  warn: { bg: 'rgba(217,119,6,0.10)', bd: 'rgba(217,119,6,0.35)', fg: T.amber },
  bad: { bg: 'rgba(220,38,38,0.10)', bd: 'rgba(220,38,38,0.35)', fg: T.red },
};

export function Tag({ children, kind = 'neutral' }: { children: ReactNode; kind?: TagKind }) {
  const p = tagPalette[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: R.pill,
        background: p.bg,
        border: `1px solid ${p.bd}`,
        color: p.fg,
        fontFamily: T.mono,
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  );
}
