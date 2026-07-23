import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Users,
  FolderGit2,
  Kanban,
  Plus,
  Sparkles,
  Zap,
  Bell,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [projectTab, setProjectTab] = useState('creations');
  const [githubConnected, setGithubConnected] = useState(false);

  const isActive = (to) => location.pathname === to;

  return (
    <aside style={{
      width: 250, flexShrink: 0, background: 'rgba(10, 12, 19, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255,255,255,0.12)',
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
      padding: '16px 14px', boxSizing: 'border-box', overflowY: 'auto'
    }}>
      
      {/* ── Brand Logo ── */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', marginBottom: 16, textDecoration: 'none' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: '#5e6ad2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px rgba(94,106,210,0.5)'
        }}>
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>
          HackForge
        </span>
      </Link>

      {/* ── User GitHub Connection Pill ── */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
        borderRadius: 14, padding: '10px 12px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #5e6ad2, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff'
        }}>
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {(githubConnected || user?.githubConnected || user?.authProvider === 'github' || user?.githubId) ? (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                <GithubIcon size={12} /> Connected
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                @{user?.githubUsername || user?.name?.toLowerCase().replace(/\s+/g, '') || 'developer'}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => { setGithubConnected(true); toast.success('GitHub account connected!'); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
                  color: '#fff', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <GithubIcon size={11} /> Connect GitHub
              </button>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>No GitHub Account</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Navigation List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
        <Link
          to="/dashboard"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
            fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
            background: isActive('/dashboard') ? '#5e6ad2' : 'transparent',
            color: isActive('/dashboard') ? '#fff' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.15s'
          }}
        >
          <LayoutGrid size={16} />
          <span>Dashboard</span>
        </Link>

        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px',
            borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={16} />
            <span>Community</span>
          </div>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 99 }}>
            Soon
          </span>
        </div>

        <Link
          to="/repositories"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
            fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
            background: isActive('/repositories') ? '#5e6ad2' : 'transparent',
            color: isActive('/repositories') ? '#fff' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.15s'
          }}
        >
          <FolderGit2 size={16} />
          <span>Repositories</span>
        </Link>

        <Link
          to="/kanban"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
            fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
            background: isActive('/kanban') ? '#5e6ad2' : 'transparent',
            color: isActive('/kanban') ? '#fff' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.15s'
          }}
        >
          <Kanban size={16} />
          <span>Kanban Board</span>
        </Link>
      </div>

      {/* ── My Projects Section ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          <span>── My Projects ──</span>
        </div>

        {/* Sub tabs: My Creations | Team Projects */}
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

        {/* Project List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>lali</span>
            </div>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#5e6ad2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: 700 }}>A</div>
          </div>

          <Link
            to="/my-teams"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.16)',
              borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none'
            }}
          >
            <Plus size={13} /> Create New
          </Link>
        </div>
      </div>

    </aside>
  );
}
