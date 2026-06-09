import { useState } from 'react';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';

interface TranscriptEntry {
  id: string;
  meeting_title: string;
  prospect_name: string | null;
  prospect_company: string | null;
  starts_at: string | null;
  status: string;
  duration_seconds: number | null;
  has_transcript: boolean;
  summary: string | null;
  next_steps: string[];
  objections: string[];
  created_at: string;
}

interface FullTranscript extends TranscriptEntry {
  competitor_mentions: string[];
  transcript: { words?: unknown[]; utterances?: { speaker: string; text: string; start?: number }[] } | null;
  acoustic_metrics: unknown;
  pipedrive_pushed_at: string | null;
}

function fmtDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function TranscriptCard({ t, onOpen }: { t: TranscriptEntry; onOpen: () => void }) {
  const statusColor: Record<string, string> = { done: T.green, in_call: T.sky, joining: T.amber, failed: T.red };
  return (
    <div
      onClick={onOpen}
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: R.xl,
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color 120ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderMd)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>{t.meeting_title}</div>
          {(t.prospect_name || t.prospect_company) && (
            <div style={{ fontSize: 12, color: T.t2, marginTop: 2 }}>
              {[t.prospect_name, t.prospect_company].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          color: statusColor[t.status] || T.t3,
          background: `${statusColor[t.status] || T.t3}18`,
          padding: '3px 8px', borderRadius: R.sm,
          border: `1px solid ${statusColor[t.status] || T.t3}33`,
          flexShrink: 0,
        }}>
          {t.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.t3, fontFamily: "'JetBrains Mono', monospace", marginBottom: t.summary ? 12 : 0 }}>
        {t.starts_at && <span>{new Date(t.starts_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>}
        {t.duration_seconds && <span>{fmtDuration(t.duration_seconds)}</span>}
        {t.has_transcript && <span style={{ color: T.green }}>✓ transcript</span>}
      </div>

      {t.summary && (
        <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {t.summary}
        </div>
      )}

      {t.next_steps.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {t.next_steps.slice(0, 3).map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: T.sky, background: 'rgba(61,159,212,0.1)', padding: '2px 8px', borderRadius: R.sm, border: '1px solid rgba(61,159,212,0.25)' }}>
              {typeof s === 'string' ? s.slice(0, 50) : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Utterance({ u }: { u: { speaker: string; text: string; start?: number } }) {
  const isSpeakerA = u.speaker === 'A' || u.speaker?.includes('0');
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: isSpeakerA ? 'rgba(240,90,50,0.2)' : T.bgElevate,
        border: `1px solid ${isSpeakerA ? 'rgba(240,90,50,0.4)' : T.borderMd}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: isSpeakerA ? T.coral : T.t3,
      }}>
        {u.speaker?.slice(0, 1) || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.t3, marginBottom: 3 }}>
          Speaker {u.speaker}
          {u.start != null && ` · ${Math.floor(u.start / 60)}:${Math.round(u.start % 60).toString().padStart(2, '0')}`}
        </div>
        <div style={{ fontSize: 13, color: T.t1, lineHeight: 1.6 }}>{u.text}</div>
      </div>
    </div>
  );
}

function TranscriptDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, loading } = useApi<FullTranscript>(`/api/transcripts/${id}`);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'flex-end',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 600, height: '100%',
        background: T.bgCard, borderLeft: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.t1 }}>{data?.meeting_title || 'Transcript'}</div>
            {data?.starts_at && <div style={{ fontSize: 11, color: T.t3 }}>{new Date(data.starts_at).toLocaleString()}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.t3, cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {loading && <div style={{ color: T.t3, fontSize: 13 }}>Loading transcript…</div>}
          {data && (
            <>
              {data.summary && (
                <div style={{ background: T.bgElevate, border: `1px solid ${T.border}`, borderRadius: R.xl, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t3, letterSpacing: 0.6, marginBottom: 8 }}>SUMMARY</div>
                  <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.7 }}>{data.summary}</div>
                </div>
              )}

              {data.next_steps?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t3, letterSpacing: 0.6, marginBottom: 8 }}>NEXT STEPS</div>
                  {data.next_steps.map((s, i) => (
                    <div key={i} style={{ fontSize: 13, color: T.t1, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${T.sky}` }}>{typeof s === 'string' ? s : JSON.stringify(s)}</div>
                  ))}
                </div>
              )}

              {data.objections?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t3, letterSpacing: 0.6, marginBottom: 8 }}>OBJECTIONS</div>
                  {data.objections.map((o, i) => (
                    <div key={i} style={{ fontSize: 13, color: T.t1, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${T.coral}` }}>{typeof o === 'string' ? o : JSON.stringify(o)}</div>
                  ))}
                </div>
              )}

              {data.transcript?.utterances && data.transcript.utterances.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t3, letterSpacing: 0.6, marginBottom: 16 }}>TRANSCRIPT</div>
                  {data.transcript.utterances.map((u, i) => <Utterance key={i} u={u} />)}
                </div>
              )}

              {!data.transcript && (
                <div style={{ color: T.t3, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                  Transcript not yet available.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TranscriptsPage() {
  const { data, loading } = useApi<{ transcripts: TranscriptEntry[] }>('/api/transcripts');
  const [openId, setOpenId] = useState<string | null>(null);
  const transcripts = data?.transcripts || [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 0.8, color: T.t3 }}>TRANSCRIPTS</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: T.display, fontWeight: 700, fontSize: 26, letterSpacing: -0.5, margin: 0, color: T.t1 }}>Call transcripts</h1>
        {!loading && <div style={{ fontSize: 12, color: T.t3 }}>{transcripts.length} recording{transcripts.length !== 1 ? 's' : ''}</div>}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skel" style={{ height: 90, borderRadius: R.xl }} />
          ))}
        </div>
      )}

      {!loading && transcripts.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: R.xl }}>
          <div style={{ fontSize: 14, color: T.t2, marginBottom: 8 }}>No transcripts yet.</div>
          <div style={{ fontSize: 13, color: T.t3 }}>Invite the meeting bot to a call from the Meeting Bot page.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {transcripts.map(t => (
          <TranscriptCard key={t.id} t={t} onOpen={() => setOpenId(t.id)} />
        ))}
      </div>

      {openId && <TranscriptDrawer id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
