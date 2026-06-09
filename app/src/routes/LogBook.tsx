import { useCallback, useEffect, useRef, useState } from 'react';
import { T, R } from '../design/tokens';
import { Button } from '../design/primitives/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id?: string;
  ts: string;
  level: 'info' | 'warn' | 'error' | 'success';
  tag: string;
  message: string;
  meta?: Record<string, unknown>;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  generated_at: string;
}

interface SystemStatus {
  ts: string;
  uptime_human: string;
  env: string;
  node_version: string;
  pid: number;
  db: { status: string; response_ms: number | null };
  auth: {
    supabase_url_set: boolean;
    supabase_service_key_set: boolean;
    supabase_anon_key_set: boolean;
    allow_dev_login: boolean;
  };
  integrations: Record<string, boolean>;
  memory: { rss_mb: number; heap_used_mb: number; heap_total_mb: number };
  ring_buffer: { size: number; capacity: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAbs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function fmtRel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

const LEVEL_DOT: Record<string, string> = {
  error:   T.red,
  warn:    T.amber,
  info:    T.t3,
  success: T.green,
};

const LEVEL_BG: Record<string, string> = {
  error:   'rgba(220,38,38,0.08)',
  warn:    'rgba(217,119,6,0.06)',
  info:    'transparent',
  success: 'rgba(22,163,74,0.06)',
};

const LEVEL_LABEL: Record<string, string> = {
  error:   'ERR',
  warn:    'WARN',
  info:    'INFO',
  success: 'OK',
};

const TAG_COLOR: Record<string, string> = {
  session:  T.sky,
  meeting:  '#a78bfa',
  auth:     T.coral,
  http:     '#34d399',
  backend:  T.amber,
  server:   T.t2,
  db:       '#f59e0b',
};

const LEVELS = ['all', 'error', 'warn', 'info', 'success'] as const;
type LevelFilter = typeof LEVELS[number];

const TAGS = ['all', 'http', 'auth', 'session', 'meeting', 'db', 'backend', 'server'] as const;
type TagFilter = typeof TAGS[number];

// ─── Status bar ───────────────────────────────────────────────────────────────

function StatusBar({ status }: { status: SystemStatus | null }) {
  if (!status) return null;

  const dbOk = status.db.status === 'ok';
  const sbOk = status.auth.supabase_url_set && status.auth.supabase_service_key_set;

  const pill = (label: string, ok: boolean, detail?: string) => (
    <div
      key={label}
      title={detail}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: R.pill,
        background: ok ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
        border: `1px solid ${ok ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
        fontSize: 11,
        color: ok ? T.green : T.red,
        fontFamily: T.mono,
        cursor: detail ? 'help' : 'default',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: ok ? T.green : T.red, flexShrink: 0 }} />
      {label}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '12px 0',
        borderBottom: `1px solid ${T.border}`,
        marginBottom: 16,
        alignItems: 'center',
      }}
    >
      {pill('DB', dbOk, status.db.response_ms != null ? `${status.db.response_ms}ms` : status.db.status)}
      {pill('Supabase', sbOk, sbOk ? 'URL + service key configured' : 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')}
      {pill('dev-login', status.auth.allow_dev_login, 'ALLOW_DEV_LOGIN env var')}
      {pill('ElevenLabs', status.integrations.elevenlabs)}
      {pill('Vapi', status.integrations.vapi)}
      {pill('Claude', status.integrations.claude)}
      {pill('AssemblyAI', status.integrations.assemblyai)}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 11, color: T.t4, fontFamily: T.mono }}>
        <span>⬆ {status.uptime_human}</span>
        <span>RAM {status.memory.heap_used_mb}/{status.memory.heap_total_mb}MB</span>
        <span>ring {status.ring_buffer.size}/{status.ring_buffer.capacity}</span>
        <span>pid {status.pid}</span>
      </div>
    </div>
  );
}

// ─── Single log row ───────────────────────────────────────────────────────────

function LogRow({ entry, expanded, onToggle }: {
  entry: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasMeta = entry.meta && Object.keys(entry.meta).filter(k => entry.meta![k] != null).length > 0;

  return (
    <div
      onClick={hasMeta ? onToggle : undefined}
      style={{
        background: expanded ? T.bgElevate : (LEVEL_BG[entry.level] || 'transparent'),
        borderBottom: `1px solid ${T.border}`,
        padding: '5px 12px',
        cursor: hasMeta ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
    >
      {/* Main line */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        {/* Dot */}
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: LEVEL_DOT[entry.level] || T.t3,
          flexShrink: 0, marginTop: 5,
        }} />

        {/* Timestamp */}
        <span
          title={new Date(entry.ts).toISOString()}
          style={{ color: T.t4, flexShrink: 0, fontFamily: T.mono, fontSize: 11, minWidth: 60 }}
        >
          {fmtAbs(entry.ts)}
        </span>

        {/* Level badge */}
        <span style={{
          fontFamily: T.mono,
          fontSize: 10,
          fontWeight: 700,
          color: LEVEL_DOT[entry.level] || T.t3,
          flexShrink: 0,
          width: 34,
          letterSpacing: 0.5,
        }}>
          {LEVEL_LABEL[entry.level] || entry.level.toUpperCase().slice(0, 4)}
        </span>

        {/* Tag */}
        <span style={{
          fontFamily: T.mono,
          fontSize: 11,
          color: TAG_COLOR[entry.tag] || T.t2,
          flexShrink: 0,
          minWidth: 56,
        }}>
          [{entry.tag}]
        </span>

        {/* Message */}
        <span style={{ color: T.t1, fontSize: 12, flex: 1, wordBreak: 'break-word', fontFamily: T.mono }}>
          {entry.message}
        </span>

        {/* Rel time + expand hint */}
        <span style={{ color: T.t4, fontSize: 10, flexShrink: 0, fontFamily: T.mono }}>
          {fmtRel(entry.ts)}
          {hasMeta && (
            <span style={{ marginLeft: 6, color: T.t3 }}>{expanded ? '▲' : '▼'}</span>
          )}
        </span>
      </div>

      {/* Expanded meta */}
      {expanded && hasMeta && (
        <div style={{
          marginTop: 6,
          marginLeft: 16,
          padding: '8px 12px',
          background: T.bgSub,
          borderRadius: R.md,
          border: `1px solid ${T.borderMd}`,
          fontFamily: T.mono,
          fontSize: 11,
          color: T.t2,
          lineHeight: 1.8,
        }}>
          {Object.entries(entry.meta!)
            .filter(([, v]) => v != null)
            .map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: T.t4, minWidth: 120 }}>{k}</span>
                <span style={{ color: T.t1, wordBreak: 'break-all' }}>
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LogBook() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(200);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const [logsRes, statusRes] = await Promise.all([
        fetch(`/api/debug/logs?limit=${limit}`, { credentials: 'include' }),
        fetch('/api/debug/status', { credentials: 'include' }),
      ]);
      if (logsRes.ok) setData(await logsRes.json());
      if (statusRes.ok) setStatus(await statusRes.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchLogs, 4000);
    return () => { clearInterval(id); };
  }, [autoRefresh, fetchLogs]);

  const toggleRow = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const logs = data?.logs ?? [];
  const filtered = logs.filter(l => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (tagFilter !== 'all' && l.tag !== tagFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.tag.toLowerCase().includes(q) ||
        JSON.stringify(l.meta || {}).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyAll = () => {
    const text = filtered.map(l =>
      `${l.ts} [${l.level.toUpperCase()}] [${l.tag}] ${l.message}`
    ).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const errorCount  = logs.filter(l => l.level === 'error').length;
  const warnCount   = logs.filter(l => l.level === 'warn').length;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.t1, padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, letterSpacing: -0.5 }}>
              LogBook
            </div>
            {errorCount > 0 && (
              <div style={{
                padding: '2px 8px', background: 'rgba(220,38,38,0.12)', border: `1px solid rgba(220,38,38,0.3)`,
                borderRadius: R.pill, fontSize: 11, color: T.red, fontFamily: T.mono, fontWeight: 700,
              }}>
                {errorCount} errors
              </div>
            )}
            {warnCount > 0 && (
              <div style={{
                padding: '2px 8px', background: 'rgba(217,119,6,0.1)', border: `1px solid rgba(217,119,6,0.25)`,
                borderRadius: R.pill, fontSize: 11, color: T.amber, fontFamily: T.mono,
              }}>
                {warnCount} warnings
              </div>
            )}
          </div>
          <div style={{ fontSize: 13, color: T.t3, marginTop: 4 }}>
            {data?.total ?? 0} entries · last updated{' '}
            {data ? fmtRel(data.generated_at) : '—'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={copyAll}
            style={{
              padding: '7px 14px', background: 'transparent', border: `1px solid ${T.borderMd}`,
              borderRadius: R.md, color: T.t2, fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
            }}
          >
            Copy
          </button>
          <button
            onClick={() => { setAutoRefresh(v => !v); }}
            style={{
              padding: '7px 14px', background: 'transparent',
              border: `1px solid ${autoRefresh ? 'rgba(22,163,74,0.4)' : T.borderMd}`,
              borderRadius: R.md, color: autoRefresh ? T.green : T.t2,
              fontSize: 12, fontFamily: T.mono, cursor: 'pointer',
            }}
          >
            {autoRefresh ? '● live' : '○ live'}
          </button>
          <Button variant="ghost" size="sm" onClick={fetchLogs}>
            Refresh
          </Button>
        </div>
      </div>

      {/* System status */}
      <StatusBar status={status} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Level filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => { setLevelFilter(l); }}
              style={{
                padding: '4px 10px',
                background: levelFilter === l ? T.bgElevate : 'transparent',
                border: `1px solid ${levelFilter === l ? T.borderStr : T.border}`,
                borderRadius: R.pill,
                color: l === 'all' ? T.t2 : (LEVEL_DOT[l] || T.t2),
                fontSize: 11,
                fontFamily: T.mono,
                cursor: 'pointer',
                fontWeight: levelFilter === l ? 700 : 400,
              }}
            >
              {l === 'all' ? 'all' : LEVEL_LABEL[l] || l}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: T.border }} />

        {/* Tag filter */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TAGS.map(t => (
            <button
              key={t}
              onClick={() => { setTagFilter(t); }}
              style={{
                padding: '4px 10px',
                background: tagFilter === t ? T.bgElevate : 'transparent',
                border: `1px solid ${tagFilter === t ? T.borderStr : T.border}`,
                borderRadius: R.pill,
                color: t === 'all' ? T.t2 : (TAG_COLOR[t] || T.t2),
                fontSize: 11,
                fontFamily: T.mono,
                cursor: 'pointer',
                fontWeight: tagFilter === t ? 700 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="search logs…"
          value={search}
          onChange={e => { setSearch(e.target.value); }}
          style={{
            marginLeft: 'auto',
            height: 30,
            padding: '0 12px',
            background: T.bgSub,
            border: `1px solid ${T.borderMd}`,
            borderRadius: R.md,
            color: T.t1,
            fontSize: 12,
            fontFamily: T.mono,
            outline: 'none',
            width: 200,
          }}
        />
      </div>

      {/* Log table */}
      <div style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: R.xl,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '8px 12px',
          borderBottom: `1px solid ${T.borderMd}`,
          background: T.bgSub,
          fontSize: 10,
          color: T.t4,
          fontFamily: T.mono,
          letterSpacing: 0.8,
        }}>
          <span style={{ width: 16 }} />
          <span style={{ minWidth: 60 }}>TIME</span>
          <span style={{ width: 34 }}>LVL</span>
          <span style={{ minWidth: 56 }}>TAG</span>
          <span style={{ flex: 1 }}>MESSAGE</span>
          <span style={{ flexShrink: 0 }}>AGO</span>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
          {loading && !data && (
            <div style={{ padding: 32, textAlign: 'center', color: T.t4, fontFamily: T.mono, fontSize: 12 }}>
              loading…
            </div>
          )}
          {!loading && error && (
            <div style={{ padding: 32, textAlign: 'center', color: T.red, fontFamily: T.mono, fontSize: 12 }}>
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: T.t4, fontFamily: T.mono, fontSize: 12 }}>
              — no entries match the current filter —
            </div>
          )}
          {filtered.map((entry, i) => {
            const id = entry.id || `${entry.ts}-${i}`;
            return (
              <LogRow
                key={id}
                entry={entry}
                expanded={expanded.has(id)}
                onToggle={() => { toggleRow(id); }}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 14px',
          borderTop: `1px solid ${T.border}`,
          background: T.bgSub,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: T.t4,
          fontFamily: T.mono,
        }}>
          <span>{filtered.length} shown of {logs.length} total</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {limit < 500 && (
              <button
                onClick={() => { setLimit(l => Math.min(l + 100, 500)); }}
                style={{ background: 'none', border: 'none', color: T.t3, fontSize: 11, cursor: 'pointer', fontFamily: T.mono }}
              >
                load more ↓
              </button>
            )}
            {data && <span>fetched {fmtAbs(data.generated_at)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
