import { useState } from 'react';
import { T, R, scoreColor } from '../../design/tokens';
import { Card, CardHead } from '../../design/primitives/Card';
import { Num } from '../../design/primitives/Text';
import { useApi } from '../../api/hooks';
import type { LeaderboardResponse } from '../../api/types';

// ─── Seeded data ──────────────────────────────────────────────────────────────

const SEED_PERSONAL = [
  { rank: 1,   name: 'Sophie R.',  role: 'VP Sales', elo: 1920, rounds: 47, isYou: false },
  { rank: 2,   name: 'Marcus T.',  role: 'AE',       elo: 1884, rounds: 39, isYou: false },
  { rank: 3,   name: 'Lena K.',    role: 'SDR',      elo: 1847, rounds: 52, isYou: false },
  { rank: 4,   name: 'You',        role: 'Amsterdam', elo: 1782, rounds: 23, isYou: true  },
  { rank: 849, name: 'James W.',   role: 'AE',       elo: 1774, rounds: 18, isYou: false },
];

const SEED_GLOBAL = [
  { rank: 1,   name: 'A. Schmidt',  role: 'DE',   elo: 2104, rounds: 142, isYou: false },
  { rank: 2,   name: 'P. van Dam',  role: 'NL',   elo: 2087, rounds: 118, isYou: false },
  { rank: 3,   name: 'E. Lindqvist',role: 'SE',   elo: 2031, rounds: 97,  isYou: false },
  { rank: 847, name: 'You',         role: 'Amsterdam', elo: 1782, rounds: 23, isYou: true },
  { rank: 848, name: 'C. Dubois',   role: 'FR',   elo: 1778, rounds: 21,  isYou: false },
];

type Tab = 'personal' | 'team' | 'global' | 'global-teams';

const TABS: { id: Tab; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'team',     label: 'My Team'  },
  { id: 'global',   label: 'Global'   },
  { id: 'global-teams', label: 'Global Teams' },
];

// ─── Leaderboard page ─────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('personal');
  const { data } = useApi<LeaderboardResponse>('/api/leaderboard');

  const rows = tab === 'global' || tab === 'global-teams' ? SEED_GLOBAL : SEED_PERSONAL;
  const youRow = rows.find(r => r.isYou);

  // Map API data if available
  const displayRows = data?.entries?.length
    ? data.entries.map((e, i) => ({ rank: i + 1, name: e.name, role: e.role ?? '', elo: e.score, rounds: 0, isYou: e.is_you ?? false }))
    : rows;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 16px',
                background: tab === t.id ? T.bgHover : 'transparent',
                border: `1px solid ${tab === t.id ? T.borderMd : T.border}`,
                borderRadius: R.pill,
                color: tab === t.id ? T.t1 : T.t2,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Board */}
        <Card style={{ flex: 1 }}>
          <CardHead kicker={tab === 'personal' ? 'This week' : 'All time'} title="" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['#', 'Name', 'Role', 'ELO', 'Rounds'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0 0 10px', fontSize: 10, fontFamily: T.mono, color: T.t4, letterSpacing: 0.5, fontWeight: 400, paddingRight: 20 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => {
                const isYou = row.isYou;
                const showGap = i > 0 && row.rank > displayRows[i - 1].rank + 1;
                return (
                  <>
                    {showGap && (
                      <tr key={`gap-${i}`}>
                        <td colSpan={5} style={{ padding: '4px 0', color: T.t4, fontSize: 11, textAlign: 'center' }}>···</td>
                      </tr>
                    )}
                    <tr
                      key={row.rank}
                      style={{
                        borderTop: `1px solid ${T.border}`,
                        background: isYou ? `rgba(240,90,50,0.06)` : 'transparent',
                        borderLeft: isYou ? `2px solid ${T.coral}` : `2px solid transparent`,
                      }}
                    >
                      <td style={{ padding: '11px 20px 11px 8px' }}>
                        <span style={{ fontFamily: T.numeric, color: row.rank <= 3 ? T.coral : T.t3, fontWeight: row.rank <= 3 ? 700 : 400 }}>
                          {row.rank}
                        </span>
                      </td>
                      <td style={{ padding: '11px 20px 11px 0', color: T.t1, fontWeight: isYou ? 600 : 400 }}>
                        {row.name}
                        {isYou && <span style={{ fontSize: 10, color: T.coral, marginLeft: 6 }}>→ you</span>}
                      </td>
                      <td style={{ padding: '11px 20px 11px 0', color: T.t3 }}>{row.role}</td>
                      <td style={{ padding: '11px 20px 11px 0', fontFamily: T.numeric }}>
                        <span style={{ color: isYou ? T.coral : T.t2 }}>{row.elo.toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '11px 0', color: T.t3 }}>{row.rounds}</td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Sticky footer */}
        {youRow && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 16px',
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: R.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}
          >
            <span style={{ color: T.t2 }}>
              You are{' '}
              <Num style={{ color: T.coral, fontWeight: 600 }}>#{youRow.rank}</Num>
              {' '}globally · Top 12%
            </span>
            <span style={{ color: T.t3, fontSize: 12 }}>ELO {youRow.elo.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
