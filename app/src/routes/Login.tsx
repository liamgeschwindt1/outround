import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { T, R } from '../design/tokens';
import { Button } from '../design/primitives/Button';

export default function Login() {
  const { login, signup, refresh } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [emailSent, setEmailSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shellAvailable, setShellAvailable] = useState(false);
  const [shellBusy, setShellBusy] = useState(false);

  // Check if shell login is available
  useEffect(() => {
    fetch('/auth/shell-config', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.shell_available) setShellAvailable(true); })
      .catch(() => {});
  }, []);

  const shellLogin = async () => {
    setShellBusy(true);
    setErr(null);
    try {
      const r = await fetch('/auth/dev-login', { method: 'POST', credentials: 'include' });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Shell unavailable (${r.status}) — set ALLOW_DEV_LOGIN=true or SHELL_MODE=true on backend`);
      }
      await refresh();
      nav('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Shell login failed');
    } finally {
      setShellBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const result = await signup(email, password, name);
        if (result.email_confirmation) {
          setEmailSent(true);
        } else {
          nav('/onboarding');
        }
      } else {
        await login(email, password);
        nav('/');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
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
    boxSizing: 'border-box',
  };

  const isSignUp = mode === 'signup';

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
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ padding: 1.5, background: T.grad, borderRadius: R.sm }}>
            <div style={{ width: 28, height: 28, borderRadius: R.sm - 1, background: T.bgCard, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 12V4.5L7 2l5 2.5V12" stroke={T.coral} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 12V8.5h4V12" stroke={T.sky} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em', color: T.t1 }}>Outround</span>
        </div>

        {emailSent ? (
          <div>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, letterSpacing: -0.5, marginBottom: 10, color: T.t1 }}>Check your email.</div>
            <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.6, marginBottom: 24 }}>
              We sent a confirmation link to <strong style={{ color: T.t1 }}>{email}</strong>. Click it to activate your account, then come back and sign in.
            </div>
            <button
              type="button"
              onClick={() => { setMode('signin'); setEmailSent(false); setErr(null); }}
              style={{ width: '100%', padding: '11px 0', background: T.grad, border: 'none', borderRadius: R.md, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, letterSpacing: -0.5, marginBottom: 6, color: T.t1 }}>
              {isSignUp ? 'Create your account.' : 'Welcome back.'}
            </div>
            <div style={{ fontSize: 13, color: T.t2, marginBottom: 24 }}>
              {isSignUp ? 'The round before it counts.' : 'Sign in to continue.'}
            </div>

            {isSignUp && (
              <label style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, letterSpacing: 0.4 }}>NAME</div>
                <input
                  type="text"
                  required
                  autoFocus={isSignUp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </label>
            )}

            <label style={{ display: 'block', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, letterSpacing: 0.4 }}>EMAIL</div>
              <input
                type="email"
                required
                autoFocus={!isSignUp}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, letterSpacing: 0.4 }}>PASSWORD</div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? 'At least 8 characters' : ''}
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
              {busy ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create account →' : 'Sign in →')}
            </Button>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: T.t3 }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setErr(null); }}
                style={{ background: 'none', border: 'none', color: T.coral, fontSize: 13, cursor: 'pointer', padding: 0 }}
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </div>

            {/* Shell access — visible when ALLOW_DEV_LOGIN or SHELL_MODE is enabled on backend */}
            {shellAvailable && (
              <div style={{ marginTop: 24, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: T.t4, textAlign: 'center', marginBottom: 10, letterSpacing: 0.3 }}>
                  SHELL ACCESS
                </div>
                <button
                  type="button"
                  onClick={shellLogin}
                  disabled={shellBusy}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: 'transparent',
                    border: `1px solid ${T.borderMd}`,
                    borderRadius: R.md,
                    color: T.t2,
                    fontSize: 13,
                    fontFamily: T.mono,
                    cursor: shellBusy ? 'not-allowed' : 'pointer',
                    letterSpacing: 0.3,
                  }}
                >
                  {shellBusy ? 'entering shell…' : '$ enter shell — no auth'}
                </button>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}
