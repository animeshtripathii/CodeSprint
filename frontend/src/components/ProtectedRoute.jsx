import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050507' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: 12, color: '#fff' }}>CodeSprint</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#5e6ad2', animation: `pulse 1s ${i * 0.15}s ease-in-out infinite alternate` }} />
        ))}
      </div>
    </div>
    <style>{`@keyframes pulse{0%{opacity:0.3;transform:scale(0.8)}100%{opacity:1;transform:scale(1.1)}}`}</style>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, initializing, logout } = useAuth();
  const location = useLocation();
  // null = validating, true = valid, false = invalid (force logout)
  const [sessionValid, setSessionValid] = useState(null);

  useEffect(() => {
    // Only validate when we think there IS a user (prevents unnecessary calls on public pages)
    if (!initializing && user) {
      const token = localStorage.getItem('hf_token');
      if (!token) {
        // No JWT at all (Clerk-only session) — skip backend check; AuthContext handles it
        setSessionValid(true);
        return;
      }
      // Validate the JWT against the backend — catches deleted/blocked users
      api.get('/auth/me')
        .then(() => setSessionValid(true))
        .catch((err) => {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            // Account deleted or blocked — force logout
            logout().catch(() => {});
            setSessionValid(false);
          } else {
            // Network/server error — don't block access
            setSessionValid(true);
          }
        });
    } else if (!initializing && !user) {
      setSessionValid(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing, user === null]);   // only re-run when user presence changes, not on every render

  if (initializing || sessionValid === null) return <PageLoader />;
  if (!user || sessionValid === false) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
