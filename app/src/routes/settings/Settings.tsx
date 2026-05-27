import { useState } from 'react';
import { T, R } from '../../design/tokens';
import { Card, CardHead } from '../../design/primitives/Card';
import { useAuth } from '../../auth/AuthProvider';
import { useApi } from '../../api/hooks';
import type { User } from '../../api/types';

// ─── Left nav tabs ────────────────────────────────────────────────────────────

type SettingsTab = 'profile' | 'workspace' | 'billing' | 'integrations' | 'notifications' | 'danger';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'profile',       label: 'Profile'       },
  { id: 'workspace',     label: 'Workspace'      },
  { id: 'billing',       label: 'Plan & Billing' },
  { id: 'integrations',  label: 'Integrations'   },
  { id: 'notifications', label: 'Notifications'  },
  { id: 'danger',        label: 'Danger'         },
];

// ─── Integration row ──────────────────────────────────────────────────────────

function IntegrationRow({
  label,
  connected,
  locked,
  lockLabel,
  onConnect,
  onDisconnect,
}: {
  label: string;
  connected: boolean;
  locked?: boolean;
  lockLabel?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: locked ? T.t4 : connected ? T.green : T.bgHover, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: locked ? T.t3 : T.t1 }}>{label}</span>
        {lockLabel && <span style={{ fontSize: 10, fontFamily: T.mono, color: T.t4, background: T.bgSub, padding: '2px 6px', borderRadius: R.sm, border: `1px solid ${T.border}` }}>{lockLabel}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {!locked && connected && (
          <>
            <span style={{ fontSize: 12, color: T.green, padding: '5px 10px', border: `1px solid rgba(22,163,74,0.3)`, borderRadius: R.md }}>Connected ✓</span>
            <button onClick={onDisconnect} style={{ fontSize: 12, color: T.t3, padding: '5px 10px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: R.md, cursor: 'pointer' }}>Disconnect</button>
          </>
        )}
        {!locked && !connected && (
          <button onClick={onConnect} style={{ fontSize: 12, color: T.t1, padding: '5px 10px', background: T.bgHover, border: `1px solid ${T.borderMd}`, borderRadius: R.md, cursor: 'pointer' }}>Connect</button>
        )}
        {locked && (
          <button disabled style={{ fontSize: 12, color: T.t4, padding: '5px 10px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: R.md, cursor: 'not-allowed', opacity: 0.5 }}>locked</button>
        )}
      </div>
    </div>
  );
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuth();
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 40,
    background: T.bgSub,
    border: `1px solid ${T.borderMd}`,
    borderRadius: R.md,
    padding: '0 12px',
    color: T.t1,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div>
        <label style={{ fontSize: 11, color: T.t3, letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>DISPLAY NAME</label>
        <input style={inputStyle} defaultValue={user?.name ?? ''} placeholder="Your name" />
      </div>
      <div>
        <label style={{ fontSize: 11, color: T.t3, letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>EMAIL</label>
        <input style={{ ...inputStyle, opacity: 0.6 }} value={user?.email ?? ''} readOnly />
      </div>
      <div>
        <label style={{ fontSize: 11, color: T.t3, letterSpacing: 0.4, display: 'block', marginBottom: 6 }}>ROLE</label>
        <input style={inputStyle} defaultValue={user?.role ?? ''} placeholder="e.g. AE, SDR, VP Sales" />
      </div>
      <button style={{ padding: '9px 20px', background: T.grad, border: 'none', borderRadius: R.md, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
        Save changes
      </button>
    </div>
  );
}

function BillingTab() {
  const plans = [
    { name: 'Basic',  price: '€29/mo',  features: ['150 min/mo', '1 persona', 'Email reports'] },
    { name: 'Growth', price: '€79/mo',  features: ['500 min/mo', 'All personas', 'Tone analysis', 'Leaderboard'], current: true },
    { name: 'Pro',    price: '€149/mo', features: ['Unlimited', 'All personas', 'Team dashboard', 'API access'] },
  ];
  return (
    <div>
      <div style={{ fontSize: 12, color: T.t3, marginBottom: 20 }}>14-day trial · No credit card required until trial ends</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {plans.map(plan => (
          <div
            key={plan.name}
            style={{
              background: plan.current ? 'rgba(240,90,50,0.06)' : T.bgElevate,
              border: `1px solid ${plan.current ? 'rgba(240,90,50,0.35)' : T.border}`,
              borderRadius: R.xl,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: T.t1, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: plan.current ? T.coral : T.t1, marginBottom: 16, fontFamily: T.numeric }}>{plan.price}</div>
            {plan.features.map(f => (
              <div key={f} style={{ fontSize: 12, color: T.t2, marginBottom: 6 }}>✓ {f}</div>
            ))}
            <button
              style={{
                marginTop: 16,
                width: '100%',
                padding: '8px 0',
                background: plan.current ? 'transparent' : T.grad,
                border: plan.current ? `1px solid ${T.borderMd}` : 'none',
                borderRadius: R.md,
                color: plan.current ? T.t3 : '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: plan.current ? 'default' : 'pointer',
              }}
            >
              {plan.current ? 'Current plan' : `Upgrade →`}
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: T.t3 }}>Annual billing saves 20%</div>
    </div>
  );
}

function IntegrationsTab() {
  const { data: user } = useApi<User>('/auth/me');
  const pipedrive = user?.integrations?.pipedrive ?? false;
  const gcal = user?.integrations?.gcal ?? false;
  return (
    <div style={{ maxWidth: 540 }}>
      <Card style={{ marginBottom: 14 }}>
        <CardHead kicker="CRM" title="" />
        <IntegrationRow label="HubSpot" connected={false} onConnect={() => {}} />
        <IntegrationRow
          label="Pipedrive"
          connected={pipedrive}
          onConnect={() => { window.location.href = '/auth/pipedrive'; }}
          onDisconnect={() => {}}
        />
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <CardHead kicker="Calendar" title="" />
        <IntegrationRow
          label="Google Calendar"
          connected={gcal}
          onConnect={() => { window.location.href = '/auth/gcal'; }}
          onDisconnect={() => {}}
        />
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <CardHead kicker="Meeting Bot" title="" />
        <IntegrationRow label="Auto-join calls" connected={false} locked lockLabel="Phase 2" />
      </Card>
      <Card>
        <CardHead kicker="Slack" title="" />
        <IntegrationRow label="Coach nudges" connected={false} onConnect={() => {}} />
      </Card>
    </div>
  );
}

function DangerTab() {
  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ padding: 20, background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.25)`, borderRadius: R.xl }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.red, marginBottom: 8 }}>Delete account</div>
        <div style={{ fontSize: 13, color: T.t2, marginBottom: 16, lineHeight: 1.5 }}>
          Permanently deletes your account, all rounds, scores, and history. This cannot be undone.
        </div>
        <button
          style={{ padding: '8px 20px', background: 'transparent', border: `1px solid rgba(220,38,38,0.4)`, borderRadius: R.md, color: T.red, fontSize: 13, cursor: 'pointer' }}
        >
          Delete my account
        </button>
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('profile');

  const content: Record<SettingsTab, React.ReactNode> = {
    profile:       <ProfileTab />,
    workspace:     <div style={{ color: T.t2, fontSize: 13 }}>Workspace settings — coming soon.</div>,
    billing:       <BillingTab />,
    integrations:  <IntegrationsTab />,
    notifications: <div style={{ color: T.t2, fontSize: 13 }}>Notification preferences — coming soon.</div>,
    danger:        <DangerTab />,
  };

  return (
    <div>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 24 }}>
        {/* Left nav */}
        <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 12px',
                background: tab === t.id ? T.bgHover : 'transparent',
                border: `1px solid ${tab === t.id ? T.borderMd : 'transparent'}`,
                borderRadius: R.md,
                color: tab === t.id ? T.t1 : T.t2,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 120ms',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.t1, marginBottom: 20 }}>
            {TABS.find(t => t.id === tab)?.label}
          </div>
          {content[tab]}
        </div>
      </div>
    </div>
  );
}
