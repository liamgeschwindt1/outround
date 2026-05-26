// Design tokens — single source of truth, mirrors /UI spec verbatim.
// Used to generate CSS variables in global.css and as typed constants in TS.

export const T = {
  // Backgrounds — near-black, not black. Depth without drama.
  bg: '#09090a',
  bgSub: '#0f0f11',
  bgCard: '#161618',
  bgElevate: '#1c1c1f',
  bgHover: '#222226',

  // Light mode
  bgL: '#fafafa',
  bgSubL: '#f3f3f2',
  bgCardL: '#ffffff',
  bgElevateL: '#f8f8f7',

  // Borders — gossamer
  border: 'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.09)',
  borderStr: 'rgba(255,255,255,0.14)',
  borderL: 'rgba(0,0,0,0.07)',
  borderMdL: 'rgba(0,0,0,0.11)',
  borderStrL: 'rgba(0,0,0,0.17)',

  // Text hierarchy
  t1: '#edecea',
  t2: 'rgba(237,236,234,0.60)',
  t3: 'rgba(237,236,234,0.35)',
  t4: 'rgba(237,236,234,0.18)',
  t1L: '#111110',
  t2L: '#52524f',
  t3L: '#8e8e8a',
  t4L: '#c4c4c0',

  // Brand
  coral: '#f05a32',
  sky: '#3d9fd4',
  grad: 'linear-gradient(135deg, #f05a32 0%, #3d9fd4 100%)',
  gradR: 'linear-gradient(135deg, #3d9fd4 0%, #f05a32 100%)',

  // Semantic
  green: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',

  // Score
  scoreHigh: '#16a34a',
  scoreMid: '#d97706',
  scoreLow: '#dc2626',

  // Type
  display: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
  numeric: "'DM Mono', 'JetBrains Mono', monospace",
} as const;

export const R = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  pill: 999,
} as const;

export const scoreColor = (v: number): string =>
  v >= 75 ? T.scoreHigh : v >= 50 ? T.scoreMid : T.scoreLow;
