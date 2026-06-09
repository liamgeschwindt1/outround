import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { readAuthError } from '../auth/authErrors';
import { T, R } from '../design/tokens';
import { Button } from '../design/primitives/Button';

export default function Login() {
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [emailSent, setEmailSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Read persisted auth error eagerly (survives page redirects via sessionStorage)
  const [err, setErr] = useState<string | null>(() => readAuthError());
  const [busy, setBusy] = useState(false);

  // Derive OAuth error from URL params during render (no setState in effect needed)
  const oauthError = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('error');
    if (!e) return null;
    const msgs: Record<string, string> = {
      oauth_failed: 'Google sign-in failed — please try again.',
      oauth_denied: 'Google sign-in was cancelled.',
      exchange_failed: 'Could not complete Google sign-in.',
      auth_not_configured: 'Auth is not configured yet.',
    };
    return msgs[e] ?? 'Sign-in failed.';
  }, []);

  // Clear OAuth params from URL after they've been read
  useEffect(() => {
    if (oauthError) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [oauthError]);

  // Display the first available error source
  const displayErr = err ?? oauthError;

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
        onSubmit={(e) => { void submit(e); }}
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
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: R.sm - 1,
                background: T.bgCard,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 12V4.5L7 2l5 2.5V12"
                  stroke={T.coral}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 12V8.5h4V12"
                  stroke={T.sky}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <span
            style={{
              fontFamily: T.display,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.03em',
              color: T.t1,
            }}
          >
            Outround
          </span>
        </div>

        {emailSent ? (
          <div>
            <div
              style={{
                fontFamily: T.display,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: -0.5,
                marginBottom: 10,
                color: T.t1,
              }}
            >
              Check your email.
            </div>
            <div style={{ fontSize: 13, color: T.t2, lineHeight: 1.6, marginBottom: 24 }}>
              We sent a confirmation link to <strong style={{ color: T.t1 }}>{email}</strong>. Click
              it to activate your account, then come back and sign in.
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setEmailSent(false);
                setErr(null);
              }}
              style={{
                width: '100%',
                padding: '11px 0',
                background: T.grad,
                border: 'none',
                borderRadius: R.md,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: T.display,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: -0.5,
                marginBottom: 6,
                color: T.t1,
              }}
            >
              {isSignUp ? 'Create your account.' : 'Welcome back.'}
            </div>
            <div style={{ fontSize: 13, color: T.t2, marginBottom: 24 }}>
              {isSignUp ? 'The round before it counts.' : 'Sign in to continue.'}
            </div>

            {isSignUp && (
              <label style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, letterSpacing: 0.4 }}>
                  NAME
                </div>
                <input
                  type="text"
                  required
                  autoFocus={isSignUp}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </label>
            )}

            <label style={{ display: 'block', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, letterSpacing: 0.4 }}>
                EMAIL
              </div>
              <input
                type="email"
                required
                autoFocus={!isSignUp}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="you@company.com"
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
                minLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                placeholder={isSignUp ? 'At least 8 characters' : ''}
                style={inputStyle}
              />
            </label>

            {displayErr && (
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
                {displayErr}
              </div>
            )}

            <Button variant="primary" size="lg" fullWidth type="submit" disabled={busy}>
              {busy
                ? isSignUp
                  ? 'Creating account…'
                  : 'Signing in…'
                : isSignUp
                  ? 'Create account →'
                  : 'Sign in →'}
            </Button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 11, color: T.t4, letterSpacing: 0.3 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => {
                window.location.href = '/auth/google';
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '11px 0',
                background: T.bgSub,
                border: `1px solid ${T.borderMd}`,
                borderRadius: R.md,
                color: T.t1,
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: T.t3 }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  setMode(isSignUp ? 'signin' : 'signup');
                  setErr(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: T.coral,
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
