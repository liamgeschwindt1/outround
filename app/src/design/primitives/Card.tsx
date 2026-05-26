import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';
import { T, R } from '../tokens';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevate?: boolean;
  span?: number; // grid column span (out of 12)
  pad?: number;
  style?: CSSProperties;
}

export function Card({ children, elevate, span, pad = 20, style, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      style={{
        background: elevate ? T.bgElevate : T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: R.xl,
        padding: pad,
        gridColumn: span ? `span ${span}` : undefined,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  kicker,
  right,
}: {
  title: string;
  kicker?: string;
  right?: ReactNode;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {kicker && (
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: T.t3,
              marginBottom: 4,
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            fontFamily: T.display,
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: -0.2,
            color: T.t1,
          }}
        >
          {title}
        </div>
      </div>
      {right}
    </header>
  );
}
