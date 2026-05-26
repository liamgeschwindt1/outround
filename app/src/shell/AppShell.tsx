import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useAuth } from '../auth/AuthProvider';

const navItems: Array<{
  to: string;
  label: string;
  icon: string;
  locked?: boolean;
}> = [
  { to: '/', label: 'Practice', icon: '◎' },
  { to: '/sessions', label: 'Sessions', icon: '≡' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '★' },
  { to: '/meetings', label: 'Meeting Bot', icon: '◉', locked: true },
  { to: '/analytics', label: 'Analytics', icon: '▣', locked: true },
  { to: '/team', label: 'Team', icon: '◍', locked: true },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

function Sidebar() {
  return (
    <aside
      style={{
        width: 56,
        background: T.bgSub,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0',
        gap: 6,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: T.grad,
          marginBottom: 14,
          flexShrink: 0,
        }}
        title="Outround"
      />

      {navItems.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          title={n.locked ? `${n.label} — coming soon` : n.label}
          onClick={(e) => { if (n.locked) e.preventDefault(); }}
          style={({ isActive }) => ({
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: R.md,
            color: n.locked ? T.t4 : isActive ? T.t1 : T.t2,
            background: isActive && !n.locked ? T.bgHover : 'transparent',
            border: isActive && !n.locked ? `1px solid ${T.border}` : '1px solid transparent',
            fontSize: 18,
            cursor: n.locked ? 'not-allowed' : 'pointer',
            transition: 'all 120ms',
          })}
        >
          {n.icon}
        </NavLink>
      ))}
    </aside>
  );
}

function TopBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = (user?.name || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <header
      style={{
        height: 56,
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: T.display,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: -0.1,
          color: T.t1,
        }}
      >
        {greeting()}, <span style={{ color: T.t2 }}>{user?.name?.split(' ')[0] || 'champ'}.</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={async () => { await logout(); nav('/login'); }}
          style={{
            fontSize: 12,
            color: T.t2,
            padding: '6px 10px',
            borderRadius: R.md,
            border: `1px solid ${T.border}`,
          }}
        >
          Sign out
        </button>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: R.pill,
            background: T.grad,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: T.display,
            fontWeight: 600,
            fontSize: 13,
            color: '#fff',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: T.bg,
        color: T.t1,
        overflow: 'hidden',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <main
          className="dot-grid"
          style={{
            flex: 1,
            overflow: 'auto',
            background: T.bg,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
