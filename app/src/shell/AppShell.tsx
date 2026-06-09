import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useAuth } from '../auth/AuthProvider';

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconMeetings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavItem = { to: string; label: string; Icon: () => JSX.Element };

const NAV: NavItem[] = [
  { to: '/',         label: 'Meetings', Icon: IconMeetings },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

// ─── Profile popup ────────────────────────────────────────────────────────────

function ProfilePopup({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const name = user?.name || user?.email || 'Dev User';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 52,
        left: 8,
        width: 200,
        background: T.bgElevate,
        border: `1px solid ${T.borderMd}`,
        borderRadius: R.xl,
        padding: 12,
        zIndex: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: R.pill, background: T.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name.split(' ')[0]}</div>
          <div style={{ fontSize: 11, color: T.t3 }}>Founder</div>
        </div>
      </div>
      <div style={{ height: 1, background: T.border, margin: '0 -4px 8px' }} />
      {[
        { label: 'Account settings', to: '/settings' },
      ].map(({ label, to }) => (
        <button
          key={to}
          onClick={() => { nav(to); onClose(); }}
          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', background: 'transparent', border: 'none', borderRadius: R.md, color: T.t2, fontSize: 13, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = T.bgHover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {label}
        </button>
      ))}
      <div style={{ height: 1, background: T.border, margin: '8px -4px' }} />
      <button
        onClick={async () => { await logout(); nav('/login'); onClose(); }}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 8px', background: 'transparent', border: 'none', borderRadius: R.md, color: T.red, fontSize: 13, cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        Sign out
      </button>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar() {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const name = user?.name || user?.email || 'Dev User';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <aside
      style={{
        width: 180,
        background: T.bgSub,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 10px',
        gap: 2,
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingLeft: 4 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: T.grad, flexShrink: 0 }} />
        <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 14, letterSpacing: -0.3, color: T.t1 }}>Outround</span>
      </div>

      {/* Nav items */}
      {NAV.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: R.md,
            color: isActive ? T.t1 : T.t2,
            background: isActive ? T.bgHover : 'transparent',
            border: `1px solid ${isActive ? T.borderMd : 'transparent'}`,
            cursor: 'pointer',
            transition: 'all 120ms',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: isActive ? 500 : 400,
          })}
        >
          <Icon />
          {label}
        </NavLink>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Profile */}
      <div style={{ position: 'relative' }}>
        {profileOpen && <ProfilePopup onClose={() => setProfileOpen(false)} />}
        <button
          onClick={() => setProfileOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 10px',
            background: profileOpen ? T.bgHover : 'transparent',
            border: `1px solid ${profileOpen ? T.borderMd : 'transparent'}`,
            borderRadius: R.md,
            cursor: 'pointer',
            color: T.t2,
            fontSize: 13,
            textAlign: 'left',
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: R.pill, background: T.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 500, color: T.t1 }}>
            {name.split(' ')[0]}
          </div>
        </button>
      </div>
    </aside>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

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
      <main
        className="dot-grid"
        style={{
          flex: 1,
          overflow: 'auto',
          background: T.bg,
          padding: '28px 32px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
