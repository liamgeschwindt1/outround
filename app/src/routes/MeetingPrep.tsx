import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../api/hooks';
import { Card, CardHead } from '../design/primitives/Card';
import { Tag, Hairline, SectionHead } from '../design/primitives/Text';
import { SkeletonLines, EmptyState } from '../design/primitives/Skeleton';
import { Button } from '../design/primitives/Button';
import { T, R } from '../design/tokens';
import type { MeetingPrepResponse, PersonaSummary } from '../api/types';

export default function MeetingPrep() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi<MeetingPrepResponse>(
    id ? `/api/meetings/${id}/prep` : null
  );

  if (loading) {
    return (
      <div style={pageStyle}>
        <SectionHead kicker="MEETING PREP" title="Getting you ready…" />
        <div style={gridStyle}>
          <Card span={8}><SkeletonLines count={6} /></Card>
          <Card span={4}><SkeletonLines count={4} /></Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={pageStyle}>
        <SectionHead kicker="MEETING PREP" title="Couldn’t load this meeting" />
        <Card>
          <EmptyState
            title={error || 'Not found'}
            body="Try refreshing, or head back to the dashboard."
            cta={<Button variant="primary" size="md" onClick={() => navigate('/')}>Back to dashboard</Button>}
          />
        </Card>
      </div>
    );
  }

  const m = data.meeting;
  const start = new Date(m.starts_at);
  const when = start.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={pageStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 0.6, color: T.t3, marginBottom: 6 }}>
            MEETING PREP · {when.toUpperCase()}
          </div>
          <h1 style={{ fontFamily: T.display, fontWeight: 600, fontSize: 28, letterSpacing: -0.6, margin: 0, color: T.t1 }}>
            {m.title}
          </h1>
          {m.prospect.company && (
            <div style={{ fontSize: 14, color: T.t2, marginTop: 4 }}>{m.prospect.company}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {data.cached && <Tag kind="neutral">CACHED</Tag>}
          <Button variant="ghost" size="sm" onClick={() => refetch()}>Refresh intel</Button>
          <Button
            variant="primary"
            size="md"
            disabled={!data.persona_summary}
            onClick={() => navigate(`/practice?meeting=${m.id}`)}
          >
            Get ready
          </Button>
        </div>
      </header>

      <div style={gridStyle}>
        {/* Left column — prospect intel */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <CardHead kicker="PROSPECT" title="Who you’re calling" />
            <ProspectBlock data={data} />
          </Card>

          <Card>
            <CardHead kicker="INTELLIGENCE" title="The one-paragraph read" />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: T.t1 }}>
              {data.prospect_summary}
            </p>
            {data.last_interaction && (
              <>
                <Hairline style={{ margin: '16px 0' }} />
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, marginBottom: 4, letterSpacing: 0.5 }}>
                  LAST INTERACTION
                </div>
                <div style={{ fontSize: 13, color: T.t2 }}>{data.last_interaction}</div>
              </>
            )}
            {data.open_next_steps.length > 0 && (
              <>
                <Hairline style={{ margin: '16px 0' }} />
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, marginBottom: 8, letterSpacing: 0.5 }}>
                  OPEN NEXT STEPS
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: T.t1, fontSize: 13, lineHeight: 1.6 }}>
                  {data.open_next_steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            )}
          </Card>

          <Card>
            <CardHead kicker="CRM NOTES" title="What your team has logged" right={<Tag kind="neutral">{data.notes.length}</Tag>} />
            {data.notes.length === 0 ? (
              <EmptyState title="No notes yet" body="Nothing has been logged for this prospect in Pipedrive." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.notes.map(n => (
                  <div key={n.id} style={noteStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, color: T.t3, marginBottom: 6, letterSpacing: 0.5 }}>
                      <span>{n.user_name || 'TEAM'}</span>
                      <span>{n.add_time?.split('T')[0] || ''}</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.t1, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{n.content}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column — coaching + persona + deal */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.deal && <DealCard deal={data.deal} />}
          <CoachingCard notes={data.coaching_notes} />
          <PersonaCard persona={data.persona_summary} insufficient={data.insufficient_crm_data} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProspectBlock({ data }: { data: MeetingPrepResponse }) {
  const p = data.prospect;
  const fallbackName = data.meeting.prospect.name;
  const name = p?.name || fallbackName || 'Unknown prospect';
  const title = p?.title;
  const company = p?.org || data.meeting.prospect.company;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={avatarStyle}>
        {p?.photo_url
          ? <img src={p.photo_url} alt={name} style={{ width: '100%', height: '100%', borderRadius: R.lg, objectFit: 'cover' }} />
          : <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22, color: T.t2 }}>{name.charAt(0).toUpperCase()}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 18, color: T.t1 }}>{name}</div>
        {title && <div style={{ fontSize: 13, color: T.t2 }}>{title}</div>}
        {company && <div style={{ fontSize: 13, color: T.t2 }}>{company}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {p?.email && <Tag kind="neutral">{p.email}</Tag>}
          {p?.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><Tag kind="sky">LinkedIn ↗</Tag></a>}
          {p && p.open_deals_count != null && <Tag kind="neutral">{p.open_deals_count} open · {p.closed_deals_count ?? 0} closed</Tag>}
        </div>
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: NonNullable<MeetingPrepResponse['deal']> }) {
  const v = deal.value
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: deal.currency || 'EUR', maximumFractionDigits: 0 }).format(deal.value)
    : null;
  return (
    <Card>
      <CardHead kicker="DEAL" title={deal.title} right={deal.status ? <Tag kind={deal.status === 'open' ? 'sky' : 'neutral'}>{deal.status.toUpperCase()}</Tag> : null} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Stat label="Value" value={v || '—'} />
        <Stat label="Stage" value={deal.stage_name || '—'} />
        <Stat label="Days in stage" value={deal.days_in_stage != null ? String(deal.days_in_stage) : '—'} />
        <Stat label="Probability" value={deal.probability != null ? `${deal.probability}%` : '—'} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, letterSpacing: 0.5, marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: T.numeric, fontSize: 16, color: T.t1 }}>{value}</div>
    </div>
  );
}

function CoachingCard({ notes }: { notes: string[] }) {
  return (
    <Card>
      <CardHead kicker="COACHING" title="Watch for this" />
      {notes.length === 0 ? (
        <div style={{ fontSize: 13, color: T.t2 }}>No coaching notes yet — go a round and your coach will start spotting patterns.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, color: T.t1, fontSize: 13, lineHeight: 1.6 }}>
          {notes.map((n, i) => <li key={i} style={{ marginBottom: 6 }}>{n}</li>)}
        </ul>
      )}
    </Card>
  );
}

function PersonaCard({ persona, insufficient }: { persona: PersonaSummary | null; insufficient: boolean }) {
  if (!persona) {
    return (
      <Card>
        <CardHead kicker="PERSONA" title="Your digital twin" />
        <div style={{ fontSize: 13, color: T.t2 }}>
          {insufficient
            ? 'Not enough CRM data to build a sharp twin yet. You can still go a generic round.'
            : 'Persona could not be assembled — try refreshing intel.'}
        </div>
      </Card>
    );
  }
  const level = Math.max(1, Math.min(5, persona.resistance_level || 3));
  return (
    <Card>
      <CardHead kicker="PERSONA" title="Your digital twin" right={<Tag kind={level >= 4 ? 'bad' : level === 3 ? 'warn' : 'good'}>RESISTANCE {level}/5</Tag>} />
      <div style={{ fontSize: 13, color: T.t1, lineHeight: 1.55, marginBottom: 12 }}>{persona.communication_style}</div>

      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, letterSpacing: 0.5, marginBottom: 6 }}>KNOWN OBJECTIONS</div>
      <ul style={{ margin: 0, paddingLeft: 18, color: T.t1, fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>
        {persona.known_objections.map((o, i) => <li key={i}><span style={{ color: T.t2 }}>“{o}”</span></li>)}
      </ul>

      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, letterSpacing: 0.5, marginBottom: 6 }}>WHAT MOVES THEM</div>
      <ul style={{ margin: 0, paddingLeft: 18, color: T.t1, fontSize: 13, lineHeight: 1.55 }}>
        {persona.what_moves_them.map((o, i) => <li key={i}>{o}</li>)}
      </ul>
    </Card>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = { padding: '24px 32px', maxWidth: 1440, margin: '0 auto' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 };
const noteStyle: React.CSSProperties = {
  background: T.bgSub,
  border: `1px solid ${T.border}`,
  borderRadius: R.lg,
  padding: 12,
};
const avatarStyle: React.CSSProperties = {
  width: 56, height: 56, borderRadius: R.lg, background: T.bgElevate,
  border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
