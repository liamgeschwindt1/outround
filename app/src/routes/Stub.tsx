import { T } from '../design/tokens';
import { SectionHead } from '../design/primitives/Text';

export default function Stub({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: '32px 32px', maxWidth: 720, margin: '0 auto' }}>
      <SectionHead kicker="COMING SOON" title={title} />
      <p style={{ color: T.t2, fontSize: 14, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}
