import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';

interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  owner: string | null;
  deals_count: number;
  won_deals_count: number;
  added: string | null;
}
interface Deal {
  id: number;
  title: string;
  value: number | null;
  currency: string | null;
  status: string;
  stage: string | null;
  person_name: string | null;
  org_name: string | null;
  owner: string | null;
  probability: number | null;
  expected_close: string | null;
  updated: string | null;
}

const cell: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: T.t2,
  borderBottom: `1px solid ${T.border}`,
  verticalAlign: 'middle',
};
const head: React.CSSProperties = {
  ...cell,
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: 0.6,
  color: T.t3,
  fontWeight: 500,
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: T.sky,
    won: T.green,
    lost: T.red,
    deleted: T.t4,
  };
  return (
    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: colors[status] || T.t3, background: `${colors[status] || T.t3}18`, padding: '2px 7px', borderRadius: R.sm, border: `1px solid ${colors[status] || T.t3}33` }}>
      {status}
    </span>
  );
}

export default function CRMPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'contacts' | 'deals'>('deals');

  const { data: contactsData, loading: cLoading, error: cError } =
    useApi<{ contacts: Contact[]; total: number }>(tab === 'contacts' ? '/api/crm/contacts' : null);
  const { data: dealsData, loading: dLoading, error: dError } =
    useApi<{ deals: Deal[]; total: number }>(tab === 'deals' ? '/api/crm/deals' : null);

  const notConnected = cError?.includes('not_connected') || dError?.includes('not_connected');
  const loading = tab === 'contacts' ? cLoading : dLoading;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0.8, color: T.t3 }}>CRM</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: T.display, fontWeight: 700, fontSize: 26, letterSpacing: -0.5, margin: 0, color: T.t1 }}>Pipedrive</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['deals', 'contacts'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); }}
              style={{
                padding: '6px 14px',
                borderRadius: R.md,
                background: tab === t ? T.bgHover : 'transparent',
                border: `1px solid ${tab === t ? T.borderMd : 'transparent'}`,
                color: tab === t ? T.t1 : T.t2,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {notConnected && (
        <div style={{ padding: 24, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: T.t2, marginBottom: 12 }}>Pipedrive is not connected.</div>
          <button
            onClick={() => { navigate('/settings'); }}
            style={{ padding: '8px 20px', background: T.grad, border: 'none', borderRadius: R.md, color: '#fff', fontSize: 13, cursor: 'pointer' }}
          >
            Connect in Settings →
          </button>
        </div>
      )}

      {!notConnected && loading && (
        <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.t3, fontSize: 13 }}>
          Fetching Pipedrive data…
        </div>
      )}

      {!notConnected && !loading && tab === 'deals' && dealsData && (
        <>
          <div style={{ fontSize: 12, color: T.t3, marginBottom: 12 }}>
            {dealsData.total} open deal{dealsData.total !== 1 ? 's' : ''}
          </div>
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['DEAL', 'CONTACT', 'STAGE', 'VALUE', 'CLOSE DATE', 'OWNER', 'STATUS'].map(h => (
                    <th key={h} style={{ ...head, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dealsData.deals.length === 0 && (
                  <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', color: T.t3 }}>No open deals.</td></tr>
                )}
                {dealsData.deals.map(d => (
                  <tr key={d.id} style={{ cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...cell, color: T.t1, fontWeight: 500, maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                      {d.org_name && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{d.org_name}</div>}
                    </td>
                    <td style={cell}>{d.person_name || '—'}</td>
                    <td style={cell}>{d.stage || '—'}</td>
                    <td style={{ ...cell, fontFamily: "'DM Mono', monospace", color: d.value ? T.t1 : T.t3 }}>
                      {d.value != null ? `${d.currency || '€'}${d.value.toLocaleString()}` : '—'}
                    </td>
                    <td style={cell}>{d.expected_close ? new Date(d.expected_close).toLocaleDateString() : '—'}</td>
                    <td style={cell}>{d.owner || '—'}</td>
                    <td style={cell}><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!notConnected && !loading && tab === 'contacts' && contactsData && (
        <>
          <div style={{ fontSize: 12, color: T.t3, marginBottom: 12 }}>
            {contactsData.total} contact{contactsData.total !== 1 ? 's' : ''}
          </div>
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['NAME', 'EMAIL', 'COMPANY', 'OPEN DEALS', 'OWNER'].map(h => (
                    <th key={h} style={{ ...head, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contactsData.contacts.length === 0 && (
                  <tr><td colSpan={5} style={{ ...cell, textAlign: 'center', color: T.t3 }}>No contacts.</td></tr>
                )}
                {contactsData.contacts.map(c => (
                  <tr key={c.id}
                    onMouseEnter={e => (e.currentTarget.style.background = T.bgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ ...cell, color: T.t1, fontWeight: 500 }}>
                      {c.name}
                      {c.phone && <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>{c.phone}</div>}
                    </td>
                    <td style={cell}>{c.email || '—'}</td>
                    <td style={cell}>{c.company || '—'}</td>
                    <td style={{ ...cell, fontFamily: "'DM Mono', monospace" }}>
                      {c.deals_count > 0 ? c.deals_count : <span style={{ color: T.t3 }}>—</span>}
                    </td>
                    <td style={cell}>{c.owner || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
