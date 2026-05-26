import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { T, R } from '../design/tokens';
import { Button } from '../design/primitives/Button';

export default function Login() {
  const { login, refresh } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email, password);
      await refresh();
      nav('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Login failed');
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
      </form>
    </div>
  );
}
