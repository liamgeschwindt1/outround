import { T } from '../tokens';

interface SkeletonProps {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: React.CSSProperties;
}

export function Skeleton({ w = '100%', h = 14, r = 4, style }: SkeletonProps) {
  return <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkeletonLines({ count = 3, gap = 10 }: { count?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} h={12} w={i === count - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: T.t2 }}>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.t1, marginBottom: 6 }}>
        {title}
      </div>
      {body && <div style={{ fontSize: 13, marginBottom: cta ? 16 : 0 }}>{body}</div>}
      {cta}
    </div>
  );
}
