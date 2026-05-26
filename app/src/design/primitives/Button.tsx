import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { T, R } from '../tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const sizes: Record<Size, { pad: string; fs: number; h: number }> = {
  sm: { pad: '6px 12px', fs: 12, h: 28 },
  md: { pad: '9px 16px', fs: 13, h: 36 },
  lg: { pad: '12px 22px', fs: 14, h: 44 },
};

export function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  children,
  style,
  ...rest
}: ButtonProps) {
  const s = sizes[size];
  const base = {
    height: s.h,
    padding: s.pad,
    fontSize: s.fs,
    fontFamily: T.body,
    fontWeight: 500,
    letterSpacing: 0.1,
    borderRadius: R.md,
    border: '1px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: fullWidth ? '100%' : undefined,
    transition: 'all 120ms ease',
    cursor: 'pointer',
  } as const;

  const variants: Record<Variant, React.CSSProperties> = {
    primary: { background: T.grad, color: '#fff' },
    secondary: { background: T.bgElevate, color: T.t1, borderColor: T.borderMd },
    ghost: { background: 'transparent', color: T.t2, borderColor: T.border },
    danger: { background: 'rgba(220,38,38,0.10)', color: T.red, borderColor: 'rgba(220,38,38,0.35)' },
  };

  return (
    <button {...rest} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}
