import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Trophy,
  Plus,
  Sparkles,
  Zap,
  Users,
  FolderGit2,
  Kanban,
  Award,
  FileText,
  CheckSquare,
  Bot,
  Megaphone,
  Search,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sliders,
  User,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

function GithubIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projectTab, setProjectTab] = useState('creations');
  const [githubConnected, setGithubConnected] = useState(false);
  const [userHackathons, setUserHackathons] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const role = user?.role || 'participant';
  const isActive = (to) => location.pathname === to;

  useEffect(() => {
    if (role === 'organizer') {
      api.get('/dashboard/organizer').then(r => setUserHackathons(r.data.data?.hackathons || [])).catch(() => {});
    }
  }, [role]);

  // ── Role Specific Main Nav Items ──
  const navItems = {
    organizer: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} /> },
      { to: '/profile', label: 'My Profile', icon: <User size={16} /> },
      { to: '/calendar', label: 'Calendar', icon: <Calendar size={16} /> },
      { to: '/hackathons', label: 'My Hackathons', icon: <Trophy size={16} /> },
      { to: '/hackathons/create', label: 'Create Hackathon', icon: <Plus size={16} /> },
      { to: '/dashboard?action=registrations', label: 'Registrations', icon: <Users size={16} /> },
      { to: '/dashboard?action=judges', label: 'Judge Assignments', icon: <CheckSquare size={16} /> },
    ],
    judge: [
      { to: '/dashboard', label: 'Judge Console', icon: <LayoutGrid size={16} /> },
      { to: '/profile', label: 'My Profile', icon: <User size={16} /> },
      { to: '/calendar', label: 'Calendar', icon: <Calendar size={16} /> },
      { to: '/dashboard', label: 'Submissions', icon: <FileText size={16} /> },
      { to: '/hackathons', label: 'Hackathons', icon: <Trophy size={16} /> },
      { to: '/dashboard', label: 'Scoring Criteria', icon: <Sliders size={16} /> },
    ],
    participant: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} /> },
      { to: '/profile', label: 'My Profile', icon: <User size={16} /> },
      { to: '/calendar', label: 'Calendar', icon: <Calendar size={16} /> },
      { to: '/hackathons', label: 'Explore Hackathons', icon: <Trophy size={16} /> },
      { to: '/repositories', label: 'Repositories', icon: <FolderGit2 size={16} /> },
      { to: '/kanban', label: 'Kanban Board', icon: <Kanban size={16} /> },
    ],
  }[role] || [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} /> },
    { to: '/profile', label: 'My Profile', icon: <User size={16} /> },
    { to: '/hackathons', label: 'Hackathons', icon: <Trophy size={16} /> },
  ];

  // ── Role Specific AI Tools ──
  const aiTools = {
    organizer: [
      { label: 'AI Timeline Generator', desc: 'Auto-generate schedule milestones', action: () => toast('AI Timeline Assistant: Generating hackathon schedule... 🤖') },
      { label: 'AI Broadcast Assistant', desc: 'Draft announcement updates', action: () => toast('AI Broadcast Assistant: Announcement draft created! 📢') },
      { label: 'AI Judge Matcher', desc: 'Recommend judges for categories', action: () => toast('AI Judge Matcher: Matching judges to submissions... ⚖️') },
    ],
    judge: [
      { label: 'AI Review Assistant', desc: 'Auto-suggest scores & feedback', action: () => toast('AI Review Assistant: Scoring notes generated! ⚡') },
      { label: 'AI Plagiarism Audit', desc: 'Detect code similarity & metrics', action: () => toast('AI Code Audit: Scanning repository commits... 🔍') },
      { label: 'AI Criteria Alignment', desc: 'Verify submission rubric fit', action: () => toast('AI Criteria Alignment: Rubric analysis complete! 🎯') },
    ],
    participant: [
      { label: 'AI Pitch Validator', desc: 'Get instant pitch feedback', action: () => toast('AI Pitch Assistant: Pitch feedback generated! 💡') },
      { label: 'AI Task Board Generator', desc: 'Create sprint Kanban tasks', action: () => toast('AI Task Generator: Sprint tasks created! ⚡') },
    ],
  }[role] || [];

  const roleLabel = {
    organizer: 'Organizer Console 🏗️',
    judge: 'Judge Console ⚖️',
    participant: 'Developer Space ⚡',
    admin: 'Admin Control 🛡️',
  }[role] || 'CodeSprint';

  return (
    <aside style={{
      width: isCollapsed ? 76 : 250, flexShrink: 0,
      background: 'rgba(9, 10, 15, 0.94)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
      padding: isCollapsed ? '16px 8px' : '16px 14px', boxSizing: 'border-box', overflowY: 'auto',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s ease'
    }}>
      
      {/* ── Brand Header & Toggle Button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: '6px 4px', marginBottom: 14 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', overflow: 'hidden' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 0 16px rgba(255,255,255,0.3)'
          }}>
            <Zap size={16} color="#060709" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
                CodeSprint
              </span>
              <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2, display: 'block' }}>
                {roleLabel}
              </span>
            </div>
          )}
        </Link>

        {/* Sidebar Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            marginLeft: isCollapsed ? 0 : 6
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ── User Profile Card (Clickable to /profile) ── */}
      <Link
        to="/profile"
        title={isCollapsed ? `${user?.name || 'User'} (${role})` : ''}
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
          borderRadius: 16, padding: isCollapsed ? '10px 6px' : '10px 12px', marginBottom: 18,
          display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 10,
          textDecoration: 'none', transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0
        }}>
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </div>

        {!isCollapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>
              {role} Role · View Profile ↗
            </div>
          </div>
        )}
      </Link>

      {/* ── Main Role-based Navigation List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
        {navItems.map(item => (
          <Link
            key={item.to + item.label}
            to={item.to}
            title={isCollapsed ? item.label : ''}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 10,
              padding: isCollapsed ? '10px 0' : '9px 12px', borderRadius: 12,
              fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none',
              background: isActive(item.to) ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: isActive(item.to) ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              color: isActive(item.to) ? '#fff' : 'rgba(255,255,255,0.65)',
              transition: 'all 0.15s'
            }}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* ── Role-Specific AI Tools Section ── */}
      <div style={{ marginBottom: 20, padding: isCollapsed ? '10px 6px' : '12px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: 6, fontSize: '0.65rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          <Sparkles size={13} />
          {!isCollapsed && <span>{role.toUpperCase()} AI ASSISTANTS</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {aiTools.map(t => (
            <button
              key={t.label}
              onClick={t.action}
              title={isCollapsed ? `${t.label} - ${t.desc}` : ''}
              style={{
                width: '100%', padding: isCollapsed ? '8px 0' : '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', textAlign: isCollapsed ? 'center' : 'left',
                transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: isCollapsed ? 'center' : 'flex-start'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              {isCollapsed ? (
                <Sparkles size={14} color="#a78bfa" />
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: '0.74rem', color: '#fff' }}>{t.label}</div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{t.desc}</div>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Role Projects / Quick Access Section ── */}
      {role === 'organizer' && !isCollapsed && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
            ── MANAGED HACKATHONS ──
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {userHackathons.slice(0, 3).map(h => (
              <button
                key={h._id}
                onClick={() => navigate(`/hackathons/${h._id}`)}
                style={{
                  padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
                <ChevronRight size={13} color="rgba(255,255,255,0.4)" />
              </button>
            ))}
            <Link
              to="/hackathons/create"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', background: '#ffffff', border: 'none',
                borderRadius: 10, color: '#060709', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(255,255,255,0.3)'
              }}
            >
              <Plus size={13} /> Create Hackathon
            </Link>
          </div>
        </div>
      )}

      {role === 'judge' && !isCollapsed && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
            ── JUDGE ACTION HUB ──
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, background: '#ffffff', border: 'none',
              color: '#060709', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,255,255,0.3)'
            }}
          >
            ⚖️ Start Submissions Review
          </button>
        </div>
      )}

      {role === 'participant' && !isCollapsed && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            <span>── MY PROJECTS ──</span>
          </div>

          <div style={{ display: 'flex', padding: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, marginBottom: 12 }}>
            <button
              onClick={() => setProjectTab('creations')}
              style={{
                flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                background: projectTab === 'creations' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: projectTab === 'creations' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer'
              }}
            >
              My Creations
            </button>
            <button
              onClick={() => setProjectTab('team')}
              style={{
                flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                background: projectTab === 'team' ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: projectTab === 'team' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer'
              }}
            >
              Team Projects
            </button>
          </div>

          <Link
            to="/my-teams"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', background: '#ffffff', border: 'none',
              borderRadius: 10, color: '#060709', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(255,255,255,0.3)'
            }}
          >
            <Plus size={13} /> Create New
          </Link>
        </div>
      )}

    </aside>
  );
}
