import { useState } from 'react';
import { T, R } from '../design/tokens';
import { useApi } from '../api/hooks';
import { api } from '../api/client';

interface BotRow {
  id: string;
  recall_bot_id: string | null;
  conference_url: string;
  status: string;
  join_at: string | null;
  duration_seconds: number | null;
  meeting_title: string | null;
  prospect_name: string | null;
  starts_at: string | null;
  created_at: string;
}

interface BotSettings {
  auto_join: boolean;
  join_type: 'all' | 'external';
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: T.amber,
  joining: T.sky,
  in_call: T.green,
  done: T.green,
  failed: T.red,
  cancelled: T.t4,
};

function fmtDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60),
    sec = s % 60;
  return `${String(m)}:${sec.toString().padStart(2, '0')}`;
}

export default function MeetingBotPage() {
  const { data: bots, loading, refetch } = useApi<BotRow[]>('/api/bots');
  const { data: savedSettings } = useApi<BotSettings>('/api/bots/settings');

  const [url, setUrl] = useState('');
  const [joinAt, setJoinAt] = useState('');
  const [sending, setSending] = useState(false);
  const [dispatchErr, setDispatchErr] = useState<string | null>(null);
  const [dispatchOk, setDispatchOk] = useState(false);

  // Settings state — initialised from server once loaded
  const [autoJoin, setAutoJoin] = useState<boolean | null>(null);
  const [joinType, setJoinType] = useState<'all' | 'external'>('all');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsOk, setSettingsOk] = useState(false);

  // Sync local state when server data arrives (only once)
  const resolvedAutoJoin = autoJoin ?? savedSettings?.auto_join ?? true;
  const resolvedJoinType =
    joinType !== (savedSettings?.join_type ?? 'all')
      ? joinType
      : (savedSettings?.join_type ?? 'all');

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsOk(false);
    try {
      await api.put('/api/bots/settings', {
        auto_join: resolvedAutoJoin,
        join_type: resolvedJoinType,
      });
      setSettingsOk(true);
      setTimeout(() => {
        setSettingsOk(false);
      }, 3000);
    } finally {
      setSettingsSaving(false);
    }
  };

  const dispatch = async () => {
    const meetingUrl = url.trim();
    if (!meetingUrl) return;
    setSending(true);
    setDispatchErr(null);
    setDispatchOk(false);
    try {
      await api.post('/api/bots/dispatch', {
        meeting_url: meetingUrl,
        join_at: joinAt || undefined,
      });
      setUrl('');
      setJoinAt('');
      setDispatchOk(true);
      setTimeout(() => {
        setDispatchOk(false);
      }, 4000);
      refetch();
    } catch (e) {
      setDispatchErr(e instanceof Error ? e.message : 'Dispatch failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: 0.8,
          color: T.t3,
        }}
      >
        MEETING BOT
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
        Outround Notetaker
      </h1>

      {/* Auto-join settings */}
      <div
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: R.xl,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 16 }}>
          Auto-join settings
        </div>

        {/* Auto-join toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: T.t1, fontWeight: 500 }}>
              Automatically join calendar meetings
            </div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>
              The bot joins upcoming Google Calendar events with a video link
            </div>
          </div>
          <button
            onClick={() => {
              setAutoJoin(!resolvedAutoJoin);
            }}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              background: resolvedAutoJoin ? T.green : T.bgHover,
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 150ms',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: resolvedAutoJoin ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 150ms',
                display: 'block',
              }}
            />
          </button>
        </div>

        {/* Meeting type selector — only shown when auto-join is on */}
        {resolvedAutoJoin && (
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: T.t3, marginBottom: 10, letterSpacing: 0.3 }}>
              WHICH MEETINGS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(
                [
                  {
                    value: 'all',
                    label: 'All meetings',
                    desc: 'Every calendar event with a video link',
                  },
                  {
                    value: 'external',
                    label: 'External meetings only',
                    desc: 'Skip internal-only events (no outside attendees)',
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name="join_type"
                    value={opt.value}
                    checked={resolvedJoinType === opt.value}
                    onChange={() => {
                      setJoinType(opt.value);
                    }}
                    style={{ marginTop: 2, accentColor: T.green, flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, color: T.t1 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: T.t3 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => {
              void saveSettings();
            }}
            disabled={settingsSaving}
            style={{
              padding: '8px 20px',
              background: T.grad,
              border: 'none',
              borderRadius: R.md,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: settingsSaving ? 'default' : 'pointer',
              opacity: settingsSaving ? 0.7 : 1,
            }}
          >
            {settingsSaving ? 'Saving…' : 'Save settings'}
          </button>
          {settingsOk && <span style={{ fontSize: 12, color: T.green }}>Saved ✓</span>}
        </div>
      </div>

      {/* Dispatch form */}
      <div
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: R.xl,
          padding: 20,
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 4 }}>
          Send bot to a meeting
        </div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 16 }}>
          Paste any Zoom, Google Meet, or Teams link. The bot joins 1 minute before the scheduled
          time (or immediately if no time is set).
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
            }}
            placeholder="https://zoom.us/j/123456789 or Google Meet link…"
            style={{
              height: 42,
              background: T.bgSub,
              border: `1px solid ${T.borderMd}`,
              borderRadius: R.md,
              padding: '0 14px',
              color: T.t1,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.t3, marginBottom: 4 }}>JOIN TIME (optional)</div>
              <input
                type="datetime-local"
                value={joinAt}
                onChange={(e) => {
                  setJoinAt(e.target.value);
                }}
                style={{
                  width: '100%',
                  height: 40,
                  background: T.bgSub,
                  border: `1px solid ${T.borderMd}`,
                  borderRadius: R.md,
                  padding: '0 12px',
                  color: T.t2,
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  void dispatch();
                }}
                disabled={!url.trim() || sending}
                style={{
                  height: 40,
                  padding: '0 24px',
                  background: url.trim() ? T.grad : T.bgElevate,
                  border: 'none',
                  borderRadius: R.md,
                  color: url.trim() ? '#fff' : T.t3,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: url.trim() ? 'pointer' : 'default',
                  transition: 'all 150ms',
                  whiteSpace: 'nowrap',
                }}
              >
                {sending ? 'Dispatching…' : 'Send bot →'}
              </button>
            </div>
          </div>
        </div>

        {dispatchErr && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: T.red,
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: R.md,
              padding: '8px 12px',
            }}
          >
            {dispatchErr}
          </div>
        )}
        {dispatchOk && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: T.green,
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: R.md,
              padding: '8px 12px',
            }}
          >
            Bot dispatched ✓ — it will join the meeting as scheduled.
          </div>
        )}
      </div>

      {/* Bot list */}
      <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 12 }}>
        Bot history
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ height: 60, borderRadius: R.xl }} />
          ))}
        </div>
      )}

      {!loading && (!bots || bots.length === 0) && (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: R.xl,
            color: T.t3,
            fontSize: 13,
          }}
        >
          No bots dispatched yet.
        </div>
      )}

      {!loading && bots && bots.length > 0 && (
        <div
          style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: R.xl,
            overflow: 'hidden',
          }}
        >
          {bots.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom: i < bots.length - 1 ? `1px solid ${T.border}` : 'none',
              }}
            >
              {/* Status dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: STATUS_COLOR[b.status] || T.t3,
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: T.t1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.meeting_title ?? b.conference_url}
                </div>
                <div style={{ fontSize: 11, color: T.t3 }}>
                  {b.prospect_name && `${b.prospect_name} · `}
                  {b.join_at
                    ? new Date(b.join_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : new Date(b.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                </div>
              </div>

              {b.duration_seconds && (
                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: T.t3 }}>
                  {fmtDuration(b.duration_seconds)}
                </div>
              )}

              <span
                style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: STATUS_COLOR[b.status] || T.t3,
                  background: `${STATUS_COLOR[b.status] || T.t3}18`,
                  padding: '2px 8px',
                  borderRadius: R.sm,
                  border: `1px solid ${STATUS_COLOR[b.status] || T.t3}33`,
                  flexShrink: 0,
                }}
              >
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
