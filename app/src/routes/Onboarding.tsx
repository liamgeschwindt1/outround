import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/client';
import { T, R } from '../design/tokens';
import { Button } from '../design/primitives/Button';
import { useToast } from '../design/primitives/Toast';

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const { user, refresh, loading } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);

  // Handle OAuth return: ?pipedrive=connected or ?gcal=connected
  useEffect(() => {
    const pd = params.get('pipedrive');
    const gc = params.get('gcal');
    if (pd === 'connected' || gc === 'connected') {
      toast.push(pd ? 'Pipedrive connected.' : 'Google Calendar connected.', 'success');
      void refresh();
      const next = new URLSearchParams(params);
      next.delete('pipedrive');
      next.delete('gcal');
      setParams(next, { replace: true });
    }
  }, [params, refresh, setParams, toast]);

  // Move past completed steps
  useEffect(() => {
    if (!user) return;
    if (user.integrations.pipedrive && step === 1) setStep(2);
    if (user.integrations.gcal && step === 2) setStep(3);
    if (user.integrations.slack && step === 3) void complete();
  }, [user, step]);

  // Bail out if already done
  useEffect(() => {
    if (!loading && user?.onboarding_complete) nav('/', { replace: true });
  }, [user, loading, nav]);

  const complete = async () => {
    setBusy(true);
    try {
      await api.post('/auth/onboarding/complete', {});
      await refresh();
      toast.push('Welcome to Outround.', 'success');
      nav('/', { replace: true });
    } catch (e) {
      toast.push(e instanceof Error ? e.message : 'Could not finish onboarding', 'error');
    } finally {
      setBusy(false);
    }
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
      <div style={{ width: '100%', maxWidth: 620 }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: 4,
                width: 48,
                borderRadius: R.pill,
                background: n <= step ? T.coral : T.borderMd,
                transition: 'background 200ms',
              }}
            />
          ))}
        </div>

        <div
          style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: R.xl,
            padding: 40,
          }}
        >
          {step === 1 && <StepPipedrive onSkip={() => { setStep(2); }} />}
          {step === 2 && <StepGCal onSkip={() => { setStep(3); }} />}
          {step === 3 && (
            <StepSlack
              onSkip={complete}
              busy={busy}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <header style={{ marginBottom: 28 }}>
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 11,
          letterSpacing: 0.6,
          color: T.t3,
          marginBottom: 8,
        }}
      >
        {kicker}
      </div>
      <h2
        style={{
          fontFamily: T.display,
          fontWeight: 700,
          fontSize: 28,
          margin: 0,
          letterSpacing: -0.6,
          marginBottom: 8,
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 14, color: T.t2, margin: 0, lineHeight: 1.5 }}>{body}</p>
    </header>
  );
}

function StepPipedrive({ onSkip }: { onSkip: () => void }) {
  return (
    <>
      <StepHeader
        kicker="STEP 01 — CRM"
        title="Connect your pipeline."
        body="We pull contacts so Hendrik isn't the only persona you ever face. Optional — skip if you're solo."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => { window.location.href = '/auth/pipedrive?return_to=/onboarding'; }}
        >
          Connect Pipedrive
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </>
  );
}

function StepGCal({ onSkip }: { onSkip: () => void }) {
  return (
    <>
      <StepHeader
        kicker="STEP 02 — CALENDAR"
        title="Sync your calendar."
        body="We'll show your next meeting and let you ready a round 30 minutes before the call."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => { window.location.href = '/auth/gcal?return_to=/onboarding'; }}
        >
          Connect Google Calendar
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </>
  );
}

function StepSlack({ onSkip, busy }: { onSkip: () => void; busy: boolean }) {
  return (
    <>
      <StepHeader
        kicker="STEP 03 — SLACK"
        title="Get briefed in Slack."
        body="We'll deliver your pre-meeting brief 15 minutes before every call. No dashboard. No searching. It arrives before you need it."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => { window.location.href = '/auth/slack?return_to=/onboarding'; }}
        >
          Connect Slack
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          disabled={busy}
          onClick={onSkip}
        >
          {busy ? 'Finishing…' : 'Skip for now — enter the round →'}
        </Button>
      </div>
    </>
  );
}
