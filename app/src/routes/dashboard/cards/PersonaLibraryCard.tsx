import { Card, CardHead } from '../../../design/primitives/Card';
import { Tag } from '../../../design/primitives/Text';
import { T, R } from '../../../design/tokens';
import { useNavigate } from 'react-router-dom';

interface PersonaTile {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  locked: boolean;
}

const personas: PersonaTile[] = [
  {
    id: 'hendrik',
    name: 'Hendrik',
    role: 'CFO · Logistics',
    avatar: '/hendrik.jpg',
    locked: false,
  },
  { id: 'natalie', name: 'Natalie', role: 'Partner · VC', avatar: '/natalie.jpg', locked: true },
];

export function PersonaLibraryCard() {
  const nav = useNavigate();
  return (
    <Card span={6}>
      <CardHead kicker="OPPONENTS" title="Personas" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {personas.map((p) => (
          <button
            key={p.id}
            disabled={p.locked}
            onClick={() => {
              if (!p.locked) nav(`/practice?persona=${p.id}`);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: p.locked ? T.bgSub : T.bgElevate,
              border: `1px solid ${T.border}`,
              borderRadius: R.md,
              opacity: p.locked ? 0.55 : 1,
              cursor: p.locked ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 120ms',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: R.pill,
                background: p.avatar ? `center/cover url(${p.avatar})` : T.grad,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.display,
                  fontWeight: 600,
                  fontSize: 13,
                  color: T.t1,
                  marginBottom: 2,
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: T.t2 }}>{p.role}</div>
            </div>
            {p.locked && <Tag kind="neutral">SOON</Tag>}
          </button>
        ))}
      </div>
    </Card>
  );
}
