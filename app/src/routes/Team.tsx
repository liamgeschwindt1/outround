import { useState } from 'react';
import { T, R } from '../design/tokens';
import { useAuth } from '../auth/AuthProvider';

// Team page — members list + invite. Dummy data until team backend is built.

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited';
  joined?: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('AE');
  const [sent, setSent] = useState<string[]>([]);

  const members: Member[] = [
    {
      id: '1',
      name: user?.name ?? user?.email.split('@')[0] ?? 'You',
      email: user?.email ?? '',
      role: user?.role ?? 'Founder',
      status: 'active',
      joined: 'Today',
    },
  ];

  const sendInvite = () => {
    const e = inviteEmail.trim().toLowerCase();
    if (!e || sent.includes(e)) return;
    setSent((p) => [...p, e]);
    setInviteEmail('');
  };

  const initials = (name: string) => name.slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: 0.8,
          color: T.t3,
        }}
      >
        TEAM
      </div>
      <h1
        style={{
          fontFamily: T.display,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: -0.5,
          margin: '0 0 24px',
          color: T.t1,
        }}
      >
        Your team
      </h1>

      {/* Member list */}
      <div
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: R.xl,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: i < members.length - 1 ? `1px solid ${T.border}` : 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: T.grad,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {initials(m.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>
                {m.name}{' '}
                {m.email === user?.email && (
                  <span style={{ fontSize: 11, color: T.t3 }}>(you)</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: T.t3 }}>{m.email}</div>
            </div>
            <div style={{ fontSize: 12, color: T.t2 }}>{m.role}</div>
            <span
              style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: m.status === 'active' ? T.green : T.amber,
                background: m.status === 'active' ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.12)',
                padding: '2px 8px',
                borderRadius: R.sm,
                border: `1px solid ${m.status === 'active' ? 'rgba(22,163,74,0.3)' : 'rgba(217,119,6,0.3)'}`,
              }}
            >
              {m.status}
            </span>
          </div>
        ))}

        {/* Pending invites */}
        {sent.map((email) => (
          <div
            key={email}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderTop: `1px solid ${T.border}`,
              opacity: 0.7,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: T.bgElevate,
                border: `1px solid ${T.borderMd}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: T.t3,
                flexShrink: 0,
              }}
            >
              ✉
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.t2 }}>{email}</div>
              <div style={{ fontSize: 11, color: T.t3 }}>Invite sent</div>
            </div>
            <span
              style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: T.amber,
                background: 'rgba(217,119,6,0.12)',
                padding: '2px 8px',
                borderRadius: R.sm,
                border: '1px solid rgba(217,119,6,0.3)',
              }}
            >
              invited
            </span>
          </div>
        ))}
      </div>

      {/* Invite form */}
      <div
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: R.xl,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 16 }}>
          Invite a team member
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={inviteEmail}
            onChange={(e) => {
              setInviteEmail(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendInvite();
            }}
            placeholder="colleague@company.com"
            type="email"
            style={{
              flex: 1,
              height: 40,
              background: T.bgSub,
              border: `1px solid ${T.borderMd}`,
              borderRadius: R.md,
              padding: '0 12px',
              color: T.t1,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <select
            value={inviteRole}
            onChange={(e) => {
              setInviteRole(e.target.value);
            }}
            style={{
              height: 40,
              background: T.bgSub,
              border: `1px solid ${T.borderMd}`,
              borderRadius: R.md,
              padding: '0 10px',
              color: T.t2,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {['AE', 'SDR', 'BDR', 'VP Sales', 'Founder', 'Other'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={sendInvite}
            disabled={!inviteEmail.trim()}
            style={{
              height: 40,
              padding: '0 18px',
              background: inviteEmail.trim() ? T.grad : T.bgElevate,
              border: 'none',
              borderRadius: R.md,
              color: inviteEmail.trim() ? '#fff' : T.t3,
              fontSize: 13,
              fontWeight: 600,
              cursor: inviteEmail.trim() ? 'pointer' : 'default',
              transition: 'all 150ms',
            }}
          >
            Send invite
          </button>
        </div>
        <div style={{ fontSize: 12, color: T.t3, marginTop: 10 }}>
          Invites are visible here. Email delivery requires your SMTP configuration — coming in
          Phase 2.
        </div>
      </div>
    </div>
  );
}
