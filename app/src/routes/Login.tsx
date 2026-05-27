import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { T, R } from '../design/tokens';
import { Button } from '../design/primitives/Button';

interface LogLine { ts: string; level: string; tag: string; message: string; }

export default function Login() {
  const { login, devLogin, refresh } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [backendTs, setBackendTs] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const pushLog = useCallback((level: string, tag: string, message: string) => {
    setLogs(prev => [...prev.slice(-49), { ts: new Date().toISOString(), level, tag, message }]);
  }, []);

  // Fetch backend logs and merge with local ones
  const fetchLogs = useCallback(async () => {
    try {
      const r = await fetch('/api/debug/logs?limit=20', { credentials: 'include' });
      if (r.ok) {
        const data = await r.json() as { entries?: LogLine[] };
        if (data.entries) setLogs(prev => {
          const existing = new Set(prev.map(e => e.ts + e.message));
          const newOnes = data.entries!.filter(e => !existing.has(e.ts + e.message));
          return [...prev, ...newOnes].slice(-50);
        });
      }
    } catch { /* no backend logs available */ }
  }, []);

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(() => {/* already authed — LoginGate will redirect */})
      .catch(() => {});
    // Show when the backend was last started
    fetch('/auth/health')
      .then(r => r.json())
      .then((d: { started_at?: string }) => {
        setBackendTs(d.started_at ?? null);
        pushLog('OK', 'backend', `started_at ${d.started_at ?? 'unknown'}`);
      })
      .catch(() => pushLog('ERR', 'backend', 'health check failed'));
    fetchLogs();
    const iv = setInterval(fetchLogs, 5000);
    return () => clearInterval(iv);
  }, [fetchLogs, pushLog]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    pushLog('INFO', 'login', `attempting sign-in for ${email}`);
    try {
      await login(email, password);
      pushLog('OK', 'login', 'sign-in succeeded');
      await refresh();
      nav('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      pushLog('ERR', 'login', msg);
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    setErr(null);
    setBusy(true);
    pushLog('INFO', 'dev', 'calling POST /auth/dev-login');
    try {
      await devLogin();
      pushLog('OK', 'dev', 'devLogin() resolved — calling /auth/me');
      await refresh();
      pushLog('OK', 'dev', 'refresh() done — navigating to /');
      nav('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Skip failed';
      pushLog('ERR', 'dev', msg);
      setErr(
        e instanceof Error
          ? `${e.message} — set ALLOW_DEV_LOGIN=true on the backend to enable skip.`
          : 'Skip failed'
      );
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    background: T.bgSub,
    border: `1px solid ${T.borderMd}`,
    borderRadius: R.md,
    padding: '0 14px',
    color: T.t1,
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div
      className="dot-grid"
      style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: R.xl,
          padding: 32,
        }}
      >
        <div
          style={{
            fontFamily: T.display,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: -0.6,
            marginBottom: 6,
          }}
        >
          Welcome back.
        </div>
        <div style={{ fontSize: 13, color: T.t2, marginBottom: 24 }}>
          One round before it counts.
        </div>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, letterSpacing: 0.4 }}>
            EMAIL
          </div>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, letterSpacing: 0.4 }}>
            PASSWORD
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </label>

        {err && (
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.35)',
              color: T.red,
              borderRadius: R.md,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}

        <Button variant="primary" size="lg" fullWidth type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <button
          type="button"
          onClick={skip}
          disabled={busy}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 12,
            padding: '10px 12px',
            background: 'transparent',
            border: `1px solid ${T.borderMd}`,
            borderRadius: R.md,
            color: T.t2,
            fontSize: 13,
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          Skip sign in (dev)
        </button>

        {/* Deploy timestamp — confirms Railway has the latest build */}
        <div style={{ marginTop: 14, fontFamily: T.mono, fontSize: 11, color: T.t4, textAlign: 'center' }}>
          {backendTs
            ? `backend started ${new Date(backendTs).toLocaleString()}`
            : 'checking backend…'}
        </div>
      </form>

      {/* Debug logs widget */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          marginTop: 16,
          background: '#0d0d0d',
          border: `1px solid ${T.borderMd}`,
          borderRadius: R.lg,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '6px 12px',
            background: T.bgSub,
            borderBottom: `1px solid ${T.borderMd}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, letterSpacing: 0.5 }}>
            LOGS
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t4 }}>
            {logs.length} entries · live
          </span>
        </div>
        <div
          style={{
            height: 180,
            overflowY: 'auto',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {logs.length === 0 && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.t4 }}>waiting…</span>
          )}
          {logs.map((e, i) => {
            const lvlColor = e.level === 'ERR' ? '#f87171' : e.level === 'WARN' ? '#fbbf24' : e.level === 'OK' ? '#4ade80' : '#94a3b8';
            const time = e.ts ? new Date(e.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '??:??:??';
            return (
              <div key={i} style={{ display: 'flex', gap: 8, fontFamily: T.mono, fontSize: 11, lineHeight: 1.5 }}>
                <span style={{ color: T.t4, flexShrink: 0 }}>{time}</span>
                <span style={{ color: lvlColor, flexShrink: 0, width: 28 }}>{e.level}</span>
                <span style={{ color: '#7dd3fc', flexShrink: 0 }}>[{e.tag}]</span>
                <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{e.message}</span>
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
