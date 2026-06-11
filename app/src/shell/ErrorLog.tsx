import { useEffect, useRef, useState } from 'react';
import { T, R } from '../design/tokens';
import { type ErrorEntry, type LogLevel, captureError, errorSubscribers } from '../utils/errorCapture';

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: T.sky,
  success: T.green,
  warn: '#d97706',
  error: T.red,
};

const LEVEL_ICON: Record<LogLevel, string> = {
  info: '·',
  success: '✓',
  warn: '!',
  error: '✕',
};

export function ErrorLog() {
  const [entries, setEntries] = useState<ErrorEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cb = (e: ErrorEntry) => {
      setEntries((prev) => [e, ...prev].slice(0, 200));
    };
    errorSubscribers.push(cb);

    const onRejection = (ev: PromiseRejectionEvent) => {
      const msg =
        ev.reason instanceof Error ? ev.reason.message : String(ev.reason ?? 'Unhandled rejection');
      const detail = ev.reason instanceof Error ? ev.reason.stack : undefined;
      captureError(msg, detail);
    };
    const onError = (ev: ErrorEvent) => {
      if (!ev.message) return;
      captureError(
        ev.message,
        ev.filename ? `${ev.filename}:${String(ev.lineno)}:${String(ev.colno)}` : undefined
      );
    };

    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    return () => {
      const i = errorSubscribers.indexOf(cb);
      if (i !== -1) errorSubscribers.splice(i, 1);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unseen = entries.length - seenCount;
  const hasErrors = entries.some((e) => e.level === 'error' || e.level === 'warn');

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
      }}
    >
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            right: 0,
            width: 460,
            maxHeight: 420,
            background: T.bgElevate,
            border: `1px solid ${T.borderMd}`,
            borderRadius: R.xl,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: `1px solid ${T.border}`,
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 700, color: T.t2, letterSpacing: 0.5, fontSize: 10 }}>
              DEBUG LOG — {entries.length} entries
            </span>
            <button
              onClick={() => { setEntries([]); setSeenCount(0); setOpen(false); }}
              style={{ background: 'none', border: 'none', color: T.t3, cursor: 'pointer', fontSize: 11, padding: 0 }}
            >
              Clear
            </button>
          </div>

          <div style={{ overflow: 'auto', flex: 1 }}>
            {entries.length === 0 && (
              <div style={{ padding: '20px 14px', color: T.t4, fontSize: 11, textAlign: 'center' }}>
                No events yet
              </div>
            )}
            {entries.map((e) => (
              <div key={e.id}>
                <button
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    width: '100%',
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${T.border}`,
                    cursor: e.detail ? 'pointer' : 'default',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ color: LEVEL_COLOR[e.level], flexShrink: 0, marginTop: 1, fontWeight: 700, fontSize: 11 }}>
                    {LEVEL_ICON[e.level]}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ color: T.t3, fontSize: 10, marginRight: 8 }}>{e.ts}</span>
                    <span style={{ color: e.level === 'error' ? T.red : e.level === 'warn' ? '#d97706' : T.t1, fontSize: 11, lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {e.msg}
                    </span>
                  </div>
                  {e.detail && (
                    <span style={{ color: T.t3, flexShrink: 0, marginTop: 2, fontSize: 10 }}>
                      {expanded === e.id ? '▲' : '▼'}
                    </span>
                  )}
                </button>
                {expanded === e.id && e.detail && (
                  <div
                    style={{
                      padding: '8px 14px 10px 32px',
                      borderBottom: `1px solid ${T.border}`,
                      background: 'rgba(0,0,0,0.3)',
                      color: T.t3,
                      fontSize: 10,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {e.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => { setOpen((o) => !o); if (!open) setSeenCount(entries.length); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          background: T.bgElevate,
          border: `1px solid ${hasErrors && unseen > 0 ? 'rgba(220,38,38,0.6)' : T.borderMd}`,
          borderRadius: R.pill,
          cursor: 'pointer',
          color: hasErrors && unseen > 0 ? T.red : T.t3,
          fontSize: 10,
          fontWeight: 600,
          transition: 'all 150ms',
          boxShadow: hasErrors && unseen > 0 ? '0 0 10px rgba(220,38,38,0.2)' : 'none',
        }}
      >
        <span style={{ fontSize: 9 }}>◉</span>
        {entries.length === 0
          ? 'LOG'
          : unseen > 0
            ? `${String(unseen)} new`
            : `${String(entries.length)} logged`}
      </button>
    </div>
  );
}


