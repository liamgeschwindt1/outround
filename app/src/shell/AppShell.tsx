import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useAuth } from '../auth/AuthProvider';
import { CoachOrb } from './CoachOrb';

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
  );
}
function IconRound() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IconProgress() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconTeam() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function IconLeaderboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/>
    </svg>
  );
}
function IconMeetings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavItem = { to: string; label: string; Icon: () => JSX.Element; primary?: boolean; locked?: string };
type NavEntry = NavItem | 'divider' | 'spacer';

const NAV: NavEntry[] = [
  { to: '/',            label: 'Home',        Icon: IconHome },
  { to: '/round',       label: 'Round',       Icon: IconRound, primary: true },
  { to: '/progress',    label: 'Progress',    Icon: IconProgress },
  'divider',
  { to: '/team',        label: 'Team',        Icon: IconTeam,        locked: 'Basic plan' },
  { to: '/leaderboard', label: 'Leaderboard', Icon: IconLeaderboard },
  'divider',
  { to: '/meetings',    label: 'Meetings',    Icon: IconMeetings,    locked: 'Phase 2' },
  'spacer',
  { to: '/settings',    label: 'Settings',    Icon: IconSettings },
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
          <div style={{ fontSize: 11, color: T.t3 }}>Growth · 67/150 min</div>
        </div>
      </div>
      <div style={{ height: 1, background: T.border, margin: '0 -4px 8px' }} />
      {[
        { label: 'Account settings', to: '/settings' },
        { label: 'Billing', to: '/settings/billing' },
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
        width: 44,
        background: T.bgSub,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 2,
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: T.grad,
          marginBottom: 12,
          flexShrink: 0,
        }}
        title="Outround"
      />

      {NAV.map((item, i) => {
        if (item === 'divider') {
          return <div key={i} style={{ width: 20, height: 1, background: T.border, margin: '4px 0' }} />;
        }
        if (item === 'spacer') {
          return <div key={i} style={{ flex: 1 }} />;
        }
        const { to, label, Icon, primary, locked } = item;
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={locked ? `${label} — ${locked}` : label}
            onClick={(e) => { if (locked) e.preventDefault(); }}
            style={({ isActive }) => ({
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: R.md,
              color: locked ? T.t4 : isActive ? '#fff' : T.t2,
              background: isActive && !locked
                ? (primary ? `rgba(240,90,50,0.18)` : T.bgHover)
                : 'transparent',
              border: isActive && !locked
                ? `1px solid ${primary ? 'rgba(240,90,50,0.4)' : T.borderMd}`
                : '1px solid transparent',
              cursor: locked ? 'not-allowed' : 'pointer',
              transition: 'all 120ms',
              opacity: locked ? 0.4 : 1,
              textDecoration: 'none',
              flexShrink: 0,
            })}
          >
            <Icon />
          </NavLink>
        );
      })}

      {/* Profile button — pinned bottom */}
      <div style={{ position: 'relative' }}>
        {profileOpen && <ProfilePopup onClose={() => setProfileOpen(false)} />}
        <button
          onClick={() => setProfileOpen(o => !o)}
          title={name}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: R.pill,
            background: profileOpen ? T.bgHover : T.grad,
            border: profileOpen ? `1px solid ${T.borderMd}` : '1px solid transparent',
            cursor: 'pointer',
            marginTop: 6,
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {initials}
        </button>
      </div>
    </aside>
  );
}
// ─── TopBar ───────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

function TopBar() {
  const { user } = useAuth();
  return (
    <header
      style={{
        height: 52,
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px 0 16px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: T.display,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: -0.2,
          color: T.t1,
        }}
      >
        {greeting()},{' '}
        <span style={{ color: T.t2 }}>{user?.name?.split(' ')[0] || 'champ'}.</span>
      </div>
      <CoachOrb />
    </header>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
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
    </div>
  );
}
