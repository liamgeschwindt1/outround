import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { RequireAuth, RequireOnboarded } from './auth/RequireAuth';
import { ToastProvider } from './design/primitives/Toast';
import { AppShell } from './shell/AppShell';

import Welcome from './routes/Welcome';
import Login from './routes/Login';
import Onboarding from './routes/Onboarding';
import Dashboard from './routes/dashboard/Dashboard';
import Round from './routes/round/Round';
import Progress from './routes/progress/Progress';
import Team from './routes/team/Team';
import Leaderboard from './routes/leaderboard/Leaderboard';
import Settings from './routes/settings/Settings';
import MeetingPrep from './routes/MeetingPrep';
import Stub from './routes/Stub';

function LoginGate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={user.onboarding_complete ? '/' : '/onboarding'} replace />;
  }
  return <Login />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

function Guarded({ children }: { children: React.ReactNode }) {
  return (
    <RequireOnboarded>
      <Shell>{children}</Shell>
    </RequireOnboarded>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<LoginGate />} />
            <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

            <Route path="/"            element={<Guarded><Dashboard /></Guarded>} />
            <Route path="/round"       element={<Guarded><Round /></Guarded>} />
            <Route path="/progress"    element={<Guarded><Progress /></Guarded>} />
            <Route path="/team"        element={<Guarded><Team /></Guarded>} />
            <Route path="/leaderboard" element={<Guarded><Leaderboard /></Guarded>} />
            <Route path="/settings"    element={<Guarded><Settings /></Guarded>} />
            <Route path="/settings/billing" element={<Guarded><Settings /></Guarded>} />

            <Route path="/practice"    element={<Guarded><Round /></Guarded>} />
            <Route path="/sessions"    element={<Guarded><Progress /></Guarded>} />
            <Route path="/analytics"   element={<Guarded><Progress /></Guarded>} />

            <Route
              path="/analysis/:id"
              element={<Guarded><Stub title="Round analysis" body="Detailed scoring — full view coming next." /></Guarded>}
            />
            <Route
              path="/meeting/:id"
              element={<Guarded><MeetingPrep /></Guarded>}
            />
            <Route path="/meetings"    element={<Guarded><Stub title="Meetings" body="Meeting bot — Phase 2." /></Guarded>} />

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/" replace />;
}
