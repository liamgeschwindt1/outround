import { useState, useEffect, useRef } from 'react';
import { T, R } from '../design/tokens';

interface LogEntry {
  id: string;
  ts: string;
  level: 'info' | 'warn' | 'error' | 'success';
  tag: string;
  message: string;
  meta?: Record<string, unknown>;
}

interface LogsResponse {
  events?: LogEntry[];
  logs?: LogEntry[];
}

const LEVEL_COLOR: Record<string, string> = {
  info: T.sky,
  success: T.green,
  warn: T.amber,
  error: T.red,
};

const LEVEL_BG: Record<string, string> = {
  info: 'rgba(61,159,212,0.08)',
  success: 'rgba(22,163,74,0.08)',
  warn: 'rgba(217,119,6,0.08)',
  error: 'rgba(220,38,38,0.08)',
};

function LogRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasMeta = entry.meta && Object.keys(entry.meta).length > 0;
  const time = new Date(entry.ts);
  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div
      onClick={hasMeta ? onToggle : undefined}
      style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${T.border}`,
        cursor: hasMeta ? 'pointer' : 'default',
        background: expanded ? LEVEL_BG[entry.level] : 'transparent',
        transition: 'background 100ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Time */}
        <div style={{ flexShrink: 0, width: 130 }}>
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t4 }}>
            {dateStr}{' '}
          </span>
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.t3 }}>
            {timeStr}
          </span>
        </div>

        {/* Level badge */}
        <span
          style={{
            flexShrink: 0,
            fontSize: 9,
            fontFamily: "'JetBrains Mono', monospace",
            color: LEVEL_COLOR[entry.level] || T.t3,
            background: LEVEL_BG[entry.level] || T.bgElevate,
            padding: '1px 6px',
            borderRadius: R.xs,
            border: `1px solid ${LEVEL_COLOR[entry.level] || T.t3}33`,
            minWidth: 48,
            textAlign: 'center',
            letterSpacing: 0.3,
          }}
        >
          {entry.level.toUpperCase()}
        </span>

        {/* Tag */}
        <span
          style={{
            flexShrink: 0,
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            color: T.sky,
            minWidth: 60,
          }}
        >
          [{entry.tag}]
        </span>

        {/* Message */}
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: entry.level === 'error' ? T.red : T.t1,
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.4,
          }}
        >
          {entry.message}
        </span>

        {hasMeta && (
          <span style={{ flexShrink: 0, fontSize: 10, color: T.t4 }}>{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {expanded && hasMeta && (
        <pre
          style={{
            margin: '8px 0 0 140px',
            padding: '8px 12px',
            background: T.bgSub,
            border: `1px solid ${T.borderMd}`,
            borderRadius: R.md,
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: T.t2,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {JSON.stringify(entry.meta, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = async () => {
    try {
      const r = await fetch('/api/debug/logs', { credentials: 'include' });
      if (!r.ok) return;
      const d = (await r.json()) as LogsResponse;
      // Backend returns { events: [...] }
      setLogs((d.events ?? d.logs ?? []).reverse());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch('/api/debug/logs', { credentials: 'include' });
        if (!r.ok) return;
        const d = (await r.json()) as LogsResponse;
        if (!cancelled) setLogs((d.events ?? d.logs ?? []).reverse());
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        void fetchLogs();
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const visible = logs.filter((e) => {
    if (filter !== 'all' && e.level !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.message.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = logs.reduce<Partial<Record<string, number>>>((acc, e) => {
    acc[e.level] = (acc[e.level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: 0.8,
          color: T.t3,
        }}
      >
        LOGS
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontFamily: T.display,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: -0.5,
            margin: 0,
            color: T.t1,
          }}
        >
          Activity log
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              void fetchLogs();
            }}
            style={{
              padding: '6px 12px',
              background: T.bgElevate,
              border: `1px solid ${T.borderMd}`,
              borderRadius: R.md,
              color: T.t2,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
          <button
            onClick={() => {
              setAutoRefresh((a) => !a);
            }}
            style={{
              padding: '6px 12px',
              background: autoRefresh ? 'rgba(22,163,74,0.12)' : T.bgElevate,
              border: `1px solid ${autoRefresh ? 'rgba(22,163,74,0.3)' : T.borderMd}`,
              borderRadius: R.md,
              color: autoRefresh ? T.green : T.t2,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['all', 'info', 'success', 'warn', 'error'] as const).map((l) => (
          <button
            key={l}
            onClick={() => {
              setFilter(l);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: R.md,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              background: filter === l ? LEVEL_BG[l] || T.bgHover : 'transparent',
              border: `1px solid ${filter === l ? LEVEL_COLOR[l] || T.borderMd : T.border}`,
              color: filter === l ? LEVEL_COLOR[l] || T.t1 : T.t3,
              cursor: 'pointer',
            }}
          >
            {l.toUpperCase()}
            {l !== 'all' && counts[l] != null ? ` (${String(counts[l])})` : ''}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          placeholder="Search logs…"
          style={{
            marginLeft: 'auto',
            height: 28,
            background: T.bgSub,
            border: `1px solid ${T.borderMd}`,
            borderRadius: R.md,
            padding: '0 10px',
            color: T.t1,
            fontSize: 12,
            outline: 'none',
            width: 160,
          }}
        />
      </div>

      {/* Log table */}
      <div
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: R.xl,
          overflow: 'hidden',
        }}
      >
        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: T.t3, fontSize: 13 }}>
            Loading logs…
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: T.t3, fontSize: 13 }}>
            No log entries match your filter.
          </div>
        )}
        {!loading &&
          visible.map((e) => (
            <LogRow
              key={e.id}
              entry={e}
              expanded={expandedId === e.id}
              onToggle={() => {
                setExpandedId(expandedId === e.id ? null : e.id);
              }}
            />
          ))}
      </div>

      {!loading && visible.length > 0 && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: T.t4,
            fontFamily: "'JetBrains Mono', monospace",
            textAlign: 'right',
          }}
        >
          {String(visible.length)} entries{' '}
          {logs.length !== visible.length ? `(${String(logs.length)} total)` : ''} · updates every
          3s when live
        </div>
      )}
    </div>
  );
}
