import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { RequireAuth, RequireOnboarded } from './auth/RequireAuth';
import { ToastProvider } from './design/primitives/Toast';
import { AppShell } from './shell/AppShell';

import Welcome from './routes/Welcome';
import Login from './routes/Login';
import Onboarding from './routes/Onboarding';
import Dashboard from './routes/dashboard/Dashboard';
import MeetingPrep from './routes/MeetingPrep';
import Stub from './routes/Stub';

function LoginGate() {
  // If user is already authed, send them past login.
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<LoginGate />} />
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <Onboarding />
                </RequireAuth>
              }
            />

            <Route
              path="/"
              element={
                <RequireOnboarded>
                  <Shell><Dashboard /></Shell>
                </RequireOnboarded>
              }
            />
            <Route
              path="/practice"
              element={
                <RequireOnboarded>
                  <Shell>
                    <Stub
                      title="Practice"
                      body="The live call experience is being ported into the new shell. Until then, the previous flow is still available — refresh the page won't kick you out anymore."
                    />
                  </Shell>
                </RequireOnboarded>
              }
            />
            <Route
              path="/sessions"
              element={
                <RequireOnboarded>
                  <Shell>
                    <Stub title="Sessions" body="Full history with filters and replays — coming next." />
                  </Shell>
                </RequireOnboarded>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <RequireOnboarded>
                  <Shell>
                    <Stub title="Leaderboard" body="Weekly board with team and global views — coming next." />
                  </Shell>
                </RequireOnboarded>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireOnboarded>
                  <Shell>
                    <Stub title="Settings" body="Profile, coach, integrations." />
                  </Shell>
                </RequireOnboarded>
              }
            />
            <Route
              path="/analysis/:id"
              element={
                <RequireOnboarded>
                  <Shell>
                    <Stub title="Round analysis" body="Detailed scoring and beats — being ported." />
                  </Shell>
                </RequireOnboarded>
              }
            />
            <Route
              path="/meeting/:id"
              element={
                <RequireOnboarded>
                  <Shell>
                    <MeetingPrep />
                  </Shell>
                </RequireOnboarded>
              }
            />

            {/* Default: send strangers to welcome, signed-in users to dashboard via RequireOnboarded */}
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
  if (!user) {
    const welcomed = localStorage.getItem('outround_welcomed') === '1';
    return <Navigate to={welcomed ? '/login' : '/welcome'} replace />;
  }
  return <Navigate to={user.onboarding_complete ? '/' : '/onboarding'} replace />;
}
