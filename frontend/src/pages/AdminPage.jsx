import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDash from '../components/dashboards/AdminDash';
import { Shield, LayoutGrid, Users, Trophy, Activity, Settings, LogOut, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

// Sidebar shown only on admin pages
function AdminSidebar({ user, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Overview',   icon: <LayoutGrid size={16} />, section: 'overview'   },
    { label: 'Users',      icon: <Users size={16} />,      section: 'users'      },
    { label: 'Hackathons', icon: <Trophy size={16} />,     section: 'hackathons' },
    { label: 'Audit Log',  icon: <Activity size={16} />,   section: 'audit'      },
    { label: 'Settings',   icon: <Settings size={16} />,   section: 'settings'   },
  ];

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'rgba(9,10,15,0.96)',
      backdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(167,139,250,0.15)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      padding: '20px 14px', boxSizing: 'border-box',
    }}>
      {/* Brand header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 4px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(167,139,250,0.4)', flexShrink: 0,
        }}>
          <Shield size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1 }}>CodeSprint</div>
          <div style={{ fontSize: '0.62rem', color: 'rgba(167,139,250,0.8)', fontWeight: 600, marginTop: 2 }}>
            Admin Control 🛡️
          </div>
        </div>
      </div>

      {/* Admin user card */}
      <div style={{
        background: 'rgba(167,139,250,0.06)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: 14, padding: '10px 12px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa', flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Admin'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(167,139,250,0.7)' }}>Super Admin</div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          padding: '0 8px', marginBottom: 6,
        }}>
          Management
        </div>
        {navItems.map(item => (
          <button
            key={item.section}
            onClick={() => {
              if (item.section === 'settings') {
                toast('Platform settings coming soon!', { icon: '⚙️' });
                return;
              }
              navigate('/admin');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              fontSize: '0.83rem', fontWeight: 600, textAlign: 'left',
              transition: 'all 0.15s ease', width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <Zap size={14} />
          Back to App
        </button>

        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 12px', borderRadius: 10,
            border: '1px solid rgba(248,113,113,0.2)',
            background: 'rgba(248,113,113,0.06)',
            color: 'rgba(248,113,113,0.8)', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.color = 'rgba(248,113,113,0.8)'; }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admin users away from this page
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied: Admin privileges required');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050507' }}>
      <AdminSidebar user={user} onLogout={handleLogout} />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <AdminDash />
      </main>
    </div>
  );
}
