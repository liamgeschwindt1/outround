import { useEffect, useRef, useState } from 'react';
import { T, R } from '../design/tokens';
import { type ErrorEntry, captureError, errorSubscribers } from '../utils/errorCapture';

export { captureError } from '../utils/errorCapture';
export type { ErrorEntry } from '../utils/errorCapture';

// ─── Component ───────────────────────────────────────────────────────────────

export function ErrorLog() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Subscribe to the global error stream + window events
  useEffect(() => {
    const cb = (e: ErrorEntry) => { setErrors(prev => [e, ...prev].slice(0, 100)); };
    errorSubscribers.push(cb);

    const onRejection = (ev: PromiseRejectionEvent) => {
      const msg = ev.reason instanceof Error ? ev.reason.message : String(ev.reason ?? 'Unhandled rejection');
      const detail = ev.reason instanceof Error ? ev.reason.stack : undefined;
      captureError(msg, detail);
    };
    const onError = (ev: ErrorEvent) => {
      if (!ev.message) return;
      captureError(ev.message, ev.filename ? `${ev.filename}:${ev.lineno}:${ev.colno}` : undefined);
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

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => { document.removeEventListener('mousedown', handler); };
  }, [open]);

  const unseen = errors.length - seenCount;
  if (errors.length === 0) return null;

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
      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 0,
            width: 420,
            maxHeight: 380,
            background: T.bgElevate,
            border: `1px solid rgba(220,38,38,0.4)`,
            borderRadius: R.xl,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: `1px solid ${T.border}`,
              background: 'rgba(220,38,38,0.06)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 700, color: T.red, letterSpacing: 0.3, fontSize: 11 }}>
              FRONTEND ERRORS ({errors.length})
            </span>
            <button
              onClick={() => {
                setErrors([]);
                setSeenCount(0);
                setOpen(false);
              }}
              style={{ background: 'none', border: 'none', color: T.t3, cursor: 'pointer', fontSize: 11, padding: 0 }}
            >
              Clear all
            </button>
          </div>

          {/* List */}
          <div style={{ overflow: 'auto', flex: 1 }}>
            {errors.map(e => (
              <div key={e.id}>
                <button
                  onClick={() => { setExpanded(expanded === e.id ? null : e.id); }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${T.border}`,
                    cursor: e.detail ? 'pointer' : 'default',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ color: T.red, flexShrink: 0, marginTop: 1 }}>✕</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: T.t2, fontSize: 11, marginBottom: 2 }}>{e.ts}</div>
                    <div style={{ color: T.t1, fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word' }}>{e.msg}</div>
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
                      padding: '8px 14px 10px',
                      borderBottom: `1px solid ${T.border}`,
                      background: 'rgba(0,0,0,0.3)',
                      color: T.t3,
                      fontSize: 11,
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

      {/* Floating pill trigger */}
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!open) setSeenCount(errors.length);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px 6px 10px',
          background: T.bgElevate,
          border: `1px solid rgba(220,38,38,${unseen > 0 ? '0.6' : '0.3'})`,
          borderRadius: R.pill,
          cursor: 'pointer',
          color: unseen > 0 ? T.red : T.t3,
          fontSize: 11,
          fontWeight: 600,
          transition: 'all 150ms',
          boxShadow: unseen > 0 ? `0 0 12px rgba(220,38,38,0.25)` : 'none',
        }}
      >
        <span style={{ fontSize: 10 }}>✕</span>
        {unseen > 0 ? `${unseen} error${unseen > 1 ? 's' : ''}` : `${errors.length} errors (seen)`}
      </button>
    </div>
  );
}
