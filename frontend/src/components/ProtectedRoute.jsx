import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050507' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: 12, color: '#fff' }}>HackForge</div>
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
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
