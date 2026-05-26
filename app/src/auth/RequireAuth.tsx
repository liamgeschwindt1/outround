import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { T } from '../design/tokens';

function FullScreenSpinner() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
      }}
    >
      <div className="skel" style={{ width: 120, height: 4, borderRadius: 2 }} />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
