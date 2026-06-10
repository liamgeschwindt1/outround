import { Component, lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { RequireAuth, RequireOnboarded } from './auth/RequireAuth';
import { ToastProvider } from './design/primitives/Toast';
import { AppShell } from './shell/AppShell';
import { T } from './design/tokens';

class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: T.bg,
            padding: 32,
          }}
        >
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14,
                color: '#f05a32',
                marginBottom: 12,
              }}
            >
              Something went wrong
            </div>
            <pre
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#888',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.err.message}
            </pre>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                marginTop: 20,
                padding: '8px 20px',
                background: '#f05a32',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import Welcome from './routes/Welcome';
import Login from './routes/Login';
import Onboarding from './routes/Onboarding';

// Lazy-load all authenticated routes so the login/welcome bundle stays small
const Dashboard = lazy(() => import('./routes/dashboard/Dashboard'));
const Settings = lazy(() => import('./routes/settings/Settings'));
const MeetingPrep = lazy(() => import('./routes/MeetingPrep'));
const CalendarPage = lazy(() => import('./routes/Calendar'));
const CRMPage = lazy(() => import('./routes/CRM'));
const TranscriptsPage = lazy(() => import('./routes/Transcripts'));
const IntelligencePage = lazy(() => import('./routes/Intelligence'));
const TeamPage = lazy(() => import('./routes/Team'));
const MeetingBotPage = lazy(() => import('./routes/MeetingBot'));
const LogsPage = lazy(() => import('./routes/Logs'));

function AppLoader() {
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
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `2px solid ${T.borderMd}`,
          borderTopColor: T.coral,
          animation: 'spin 700ms linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function LoginGate() {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
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
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<AppLoader />}>
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
                  <Guarded>
                    <Dashboard />
                  </Guarded>
                }
              />
              <Route
                path="/meetings"
                element={
                  <Guarded>
                    <CalendarPage />
                  </Guarded>
                }
              />
              <Route
                path="/calendar"
                element={
                  <Guarded>
                    <CalendarPage />
                  </Guarded>
                }
              />
              <Route
                path="/crm"
                element={
                  <Guarded>
                    <CRMPage />
                  </Guarded>
                }
              />
              <Route
                path="/transcripts"
                element={
                  <Guarded>
                    <TranscriptsPage />
                  </Guarded>
                }
              />
              <Route
                path="/intelligence"
                element={
                  <Guarded>
                    <IntelligencePage />
                  </Guarded>
                }
              />
              <Route
                path="/team"
                element={
                  <Guarded>
                    <TeamPage />
                  </Guarded>
                }
              />
              <Route
                path="/bot"
                element={
                  <Guarded>
                    <MeetingBotPage />
                  </Guarded>
                }
              />
              <Route
                path="/logs"
                element={
                  <Guarded>
                    <LogsPage />
                  </Guarded>
                }
              />
              <Route
                path="/settings"
                element={
                  <Guarded>
                    <Settings />
                  </Guarded>
                }
              />

              <Route
                path="/meeting/:id"
                element={
                  <Guarded>
                    <MeetingPrep />
                  </Guarded>
                }
              />

              <Route path="*" element={<RootRedirect />} />
            </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/" replace />;
}
