import { useEffect, useRef, useState } from 'react';
import { Card, CardHead } from '../../../design/primitives/Card';
import { SkeletonLines } from '../../../design/primitives/Skeleton';
import { Button } from '../../../design/primitives/Button';
import { T, R } from '../../../design/tokens';
import { useApi } from '../../../api/hooks';

interface LogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error' | 'success';
  tag: string;
  message: string;
  meta: Record<string, unknown>;
}

interface LogsResponse {
  logs: LogEntry[];
  generated_at: string;
}

const LEVEL_COLOR: Record<string, string> = {
  info:    T.t3,
  warn:    T.amber,
  error:   T.red,
  success: T.green,
};

const LEVEL_BADGE: Record<string, string> = {
  info:    'INFO',
  warn:    'WARN',
  error:   'ERR ',
  success: 'OK  ',
};

const TAG_COLOR: Record<string, string> = {
  session: T.sky,
  meeting: '#a78bfa',
  backend: T.coral,
  server:  T.t2,
  db:      T.amber,
};

function fmtTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function LogsCard() {
  const { data, loading, error, refetch } = useApi<LogsResponse>('/api/debug/logs?limit=50');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-refresh every 5s when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refetch, 5000);
    return () => { clearInterval(id); };
  }, [autoRefresh, refetch]);

  const logs = data?.logs ?? [];
  const filtered = filter
    ? logs.filter(l =>
        l.message.toLowerCase().includes(filter.toLowerCase()) ||
        l.tag.toLowerCase().includes(filter.toLowerCase()) ||
        l.level.toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  return (
    <Card span={12} pad={20}>
      <CardHead
        kicker="DEBUG"
        title="Activity log"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="filter…"
              value={filter}
              onChange={e => { setFilter(e.target.value); }}
              style={{
                height: 28,
                padding: '0 10px',
                background: T.bgSub,
                border: `1px solid ${T.borderMd}`,
                borderRadius: R.md,
                color: T.t1,
                fontSize: 12,
                fontFamily: T.mono,
                outline: 'none',
                width: 140,
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setAutoRefresh(v => !v); }}
              style={{ color: autoRefresh ? T.green : T.t2 }}
            >
              {autoRefresh ? '● live' : '○ live'}
            </Button>
            <Button variant="ghost" size="sm" onClick={refetch}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* Terminal */}
      <div
        style={{
          background: T.bgSub,
          border: `1px solid ${T.border}`,
          borderRadius: R.lg,
          fontFamily: T.mono,
          fontSize: 11.5,
          lineHeight: 1.7,
          padding: '12px 14px',
          height: 340,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {loading && !data && <SkeletonLines count={8} />}
        {!loading && error && (
          <div style={{ color: T.red }}>
            ERR  [api] {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ color: T.t3 }}>— no entries —</div>
        )}
        {filtered.map((entry, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '2px 0',
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            {/* timestamp */}
            <span style={{ color: T.t4, flexShrink: 0, userSelect: 'none' }}>
              {fmtTs(entry.ts)}
            </span>

            {/* level badge */}
            <span
              style={{
                color: LEVEL_COLOR[entry.level] || T.t3,
                flexShrink: 0,
                fontWeight: 700,
                width: 36,
              }}
            >
              {LEVEL_BADGE[entry.level] || entry.level.toUpperCase().slice(0, 4)}
            </span>

            {/* tag */}
            <span
              style={{
                color: TAG_COLOR[entry.tag] || T.t2,
                flexShrink: 0,
                width: 60,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              [{entry.tag}]
            </span>

            {/* message */}
            <span style={{ color: T.t1, flex: 1, wordBreak: 'break-word' }}>
              {entry.message}
              {entry.meta && Object.keys(entry.meta).length > 0 && (
                <span style={{ color: T.t3, marginLeft: 8 }}>
                  {Object.entries(entry.meta)
                    .filter(([, v]) => v != null)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(' ')}
                </span>
              )}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {data && (
        <div style={{ marginTop: 8, fontSize: 11, color: T.t4, fontFamily: T.mono }}>
          {filtered.length} entries · last fetched {fmtTs(data.generated_at)}
        </div>
      )}
    </Card>
  );
}
