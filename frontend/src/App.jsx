import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HackathonsPage from './pages/HackathonsPage';
import DashboardPage from './pages/DashboardPage';

// Lazy pages (loaded on demand)
import { lazy, Suspense, useState, useEffect } from 'react';
const HackathonDetailPage = lazy(() => import('./pages/HackathonDetailPage'));
const JoinTeamPage = lazy(() => import('./pages/JoinTeamPage'));
const CreateHackathonPage = lazy(() => import('./pages/CreateHackathonPage'));
const ManageRegistrationsPage = lazy(() => import('./pages/ManageRegistrationsPage'));
const TeamWorkspacePage = lazy(() => import('./pages/TeamWorkspacePage'));
const SubmissionPage = lazy(() => import('./pages/SubmissionPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ReviewFormPage = lazy(() => import('./pages/ReviewFormPage'));
const JudgeSubmissionsPage = lazy(() => import('./pages/JudgeSubmissionsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const RepositoriesPage = lazy(() => import('./pages/RepositoriesPage'));
const RepoTreePage = lazy(() => import('./pages/RepoTreePage'));
const KanbanPage = lazy(() => import('./pages/KanbanPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08090d' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: 12, color: '#fff' }}>CodeSprint</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#1b68ff', animation: `pulse 1s ${i * 0.15}s ease-in-out infinite alternate` }} />
        ))}
      </div>
    </div>
    <style>{`@keyframes pulse{0%{opacity:0.3;transform:scale(0.8)}100%{opacity:1;transform:scale(1.1)}}`}</style>
  </div>
);

function SSOCallback() {
  const [redirectUrl] = useState(() => localStorage.getItem('auth_redirect') || '/dashboard');
  useEffect(() => {
    return () => {
      localStorage.removeItem('auth_redirect');
    };
  }, []);

  return (
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl={redirectUrl}
      signUpForceRedirectUrl={redirectUrl}
    />
  );
}

function AppRoutes() {
  const { user, initializing } = useAuth();

  if (initializing) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/sso-callback" element={<SSOCallback />} />

        {/* Auth — redirect if already logged in */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

        {/* Protected — All authenticated roles */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/repositories" element={<ProtectedRoute><RepositoriesPage /></ProtectedRoute>} />
        <Route path="/repositories/:owner/:repo" element={<ProtectedRoute><RepoTreePage /></ProtectedRoute>} />
        <Route path="/kanban" element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
        <Route path="/hackathons" element={<ProtectedRoute><HackathonsPage /></ProtectedRoute>} />
        <Route path="/hackathons/create" element={<ProtectedRoute><CreateHackathonPage /></ProtectedRoute>} />
        <Route path="/hackathons/:id" element={<ProtectedRoute><HackathonDetailPage /></ProtectedRoute>} />
        <Route path="/hackathons/:id/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/hackathons/:id/submit" element={<ProtectedRoute><SubmissionPage /></ProtectedRoute>} />
        <Route path="/hackathons/:id/submission" element={<ProtectedRoute><SubmissionPage /></ProtectedRoute>} />
        <Route path="/hackathons/:id/edit" element={<ProtectedRoute><CreateHackathonPage /></ProtectedRoute>} />
        <Route path="/hackathons/:id/registrations" element={<ProtectedRoute><ManageRegistrationsPage /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><TeamWorkspacePage /></ProtectedRoute>} />
        <Route path="/workspace/:teamId" element={<ProtectedRoute><TeamWorkspacePage /></ProtectedRoute>} />
        <Route path="/my-teams" element={<ProtectedRoute><JoinTeamPage /></ProtectedRoute>} />
        <Route path="/join-team" element={<ProtectedRoute><JoinTeamPage /></ProtectedRoute>} />
        <Route path="/teams/:teamId/workspace" element={<ProtectedRoute><TeamWorkspacePage /></ProtectedRoute>} />
        <Route path="/judge/hackathon/:hackathonId/submissions" element={<ProtectedRoute><JudgeSubmissionsPage /></ProtectedRoute>} />
        <Route path="/judge/submissions/:submissionId/review" element={<ProtectedRoute><ReviewFormPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
            success: { iconTheme: { primary: '#3ECF8E', secondary: '#fff' } },
            error: { iconTheme: { primary: '#FF4D6D', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
