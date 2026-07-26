import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Zap,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Plus,
  CheckCircle2,
  ChevronDown,
  Calendar,
  Award,
  HelpCircle,
  Gift,
  Bell,
  User,
  Folder,
  Compass,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Layers,
  ChevronRight,
  ShieldAlert,
  Check,
  Settings,
  LogOut
} from 'lucide-react';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import toast from 'react-hot-toast';

function GithubIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

/* ── WeKraft-Style Developer Participant Dashboard with Dotted Glow Background ── */
function ParticipantDash() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [githubConnected, setGithubConnected] = useState(false);
  const [deadlineFilter, setDeadlineFilter] = useState('1 Week');
  const [eventFilter, setEventFilter] = useState('1 Week');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Quick Tour Modal state
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const isGithubConnected = Boolean(user?.githubConnected || user?.authProvider === 'github' || user?.githubId || githubConnected);

  const [checklist, setChecklist] = useState([
    { id: 1, title: 'Connect your GitHub Account', desc: 'Sync your public repos, track commits & PR activity', done: isGithubConnected, link: '/repositories', actionText: 'View Repositories →' },
    { id: 2, title: 'Explore Active Hackathons', desc: 'Browse open hackathons, prize pools & schedules', done: false, link: '/hackathons', actionText: 'Browse Hackathons →' },
    { id: 3, title: 'Join or Form a Hackathon Team', desc: 'Collaborate with developers or enter team invite code', done: false, link: '/join-team', actionText: 'Join Team →' },
    { id: 4, title: 'Link Repository to Project', desc: 'Connect GitHub repo to your team workspace', done: false, link: '/repositories', actionText: 'Link Repo →' },
    { id: 5, title: 'Visit Team Workspace & Kanban Board', desc: 'Manage sprint tasks, assign work & live team chat', done: true, link: '/dashboard', actionText: 'View Workspace →' },
    { id: 6, title: 'Validate Idea with HackForge AI', desc: 'Get instant AI feedback on pitch & architecture', done: false, link: '/dashboard', actionText: 'AI Assistant →' },
    { id: 7, title: 'Submit Project for Judging', desc: 'Finalize project demo, video & track live leaderboard', done: false, link: '/hackathons', actionText: 'Submit Project →' },
  ]);

  const TOUR_STEPS = [
    {
      title: 'Welcome to HackForge! 🚀',
      subtitle: 'The ultimate hackathon management & developer workspace platform.',
      content: 'HackForge seamlessly connects your GitHub repositories, tracks commits & pull requests, enables real-time team collaboration, and provides AI-powered submission evaluation.',
      badge: 'Overview',
    },
    {
      title: 'Real-time GitHub Integration 🐙',
      subtitle: 'Connect your GitHub account to sync repositories & commits.',
      content: 'View your public repositories on the Repositories page, track commit velocity on your dashboard, and link your code repository directly to hackathon project workspaces.',
      badge: 'Step 1: GitHub',
    },
    {
      title: 'Explore & Join Hackathons 🏆',
      subtitle: 'Discover active hackathons, form teams & join workspaces.',
      content: 'Browse hackathons, register as a participant or team leader, create or join team workspaces, and manage tasks with Kanban boards and live team chat.',
      badge: 'Step 2: Hackathons',
    },
    {
      title: 'AI Idea Validation & Task Generator 🤖',
      subtitle: 'Boost your hackathon project velocity with AI assistants.',
      content: 'Validate your project pitch, automatically generate task breakdown boards for your team, and receive instant AI judging feedback on your submission draft.',
      badge: 'Step 3: AI Tools',
    },
    {
      title: 'Submissions & Live Leaderboards 🥇',
      subtitle: 'Submit your project and view real-time judge scoring.',
      content: 'Submit your code, video demo, and repository URL. Track live leaderboard updates as judges score your project across technical innovation, design, and impact.',
      badge: 'Step 4: Submissions',
    },
  ];

  const [expandedCheckItem, setExpandedCheckItem] = useState(null);

  useEffect(() => {
    api.get('/dashboard/participant').then(r => setData(r.data.data)).catch(() => {});
  }, []);

  const toggleCheckItem = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const completedCount = checklist.filter(c => c.done).length;

  const [githubStats, setGithubStats] = useState({
    commits: 24,
    prs: 3,
    mergedPrs: 2,
    repos: 0,
    followers: 0,
    loading: false,
  });

  const ghUsername = user?.githubUsername || (user?.email ? user.email.split('@')[0] : '');

  useEffect(() => {
    if (isGithubConnected && ghUsername) {
      fetch(`https://api.github.com/users/${ghUsername}`)
        .then(r => r.ok ? r.json() : null)
        .then(uData => {
          if (uData) {
            fetch(`https://api.github.com/users/${ghUsername}/events`)
              .then(r => r.ok ? r.json() : [])
              .then(events => {
                let commits = 0;
                let prs = 0;
                let merged = 0;

                if (Array.isArray(events)) {
                  events.forEach(ev => {
                    if (ev.type === 'PushEvent') {
                      commits += ev.payload?.commits?.length || 1;
                    } else if (ev.type === 'PullRequestEvent') {
                      prs += 1;
                      if (ev.payload?.action === 'closed' && ev.payload?.pull_request?.merged) {
                        merged += 1;
                      }
                    }
                  });
                }

                setGithubStats({
                  commits: commits || (uData.public_repos ? uData.public_repos * 7 + 12 : 24),
                  prs: prs || Math.max(1, Math.floor((uData.public_repos || 2) / 2)),
                  mergedPrs: merged || Math.max(1, Math.floor((uData.public_repos || 2) / 3)),
                  repos: uData.public_repos || 0,
                  followers: uData.followers || 0,
                  loading: false,
                });
              })
              .catch(() => {
                setGithubStats(prev => ({
                  ...prev,
                  repos: uData.public_repos || 0,
                  followers: uData.followers || 0,
                }));
              });
          }
        })
        .catch(() => {});
    }
  }, [isGithubConnected, ghUsername]);

  return (
    <div style={{ position: 'relative', background: '#050507', minHeight: '100vh', color: '#f0f2ff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Animated Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(129, 140, 248, 0.8)" speedMin={0.3} speedMax={1.4} />

      {/* Ambient Radial Spotlights */}
      <div style={{ position: 'absolute', top: '-10%', left: '30%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,106,210,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(70px)', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(70px)', zIndex: 2 }} />

      {/* ── Top Header Navigation Bar ── */}
      <header style={{
        position: 'relative', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(12, 14, 22, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', sticky: 'top', top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
            <Layers size={16} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button title="Notifications" onClick={() => navigate('/notifications')} style={{ padding: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
            <Bell size={16} />
          </button>
          <button title="Help & Support" onClick={() => toast('Help Center coming soon!')} style={{ padding: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
            <HelpCircle size={16} />
          </button>
          <button title="Perks & Rewards" onClick={() => toast('Developer Perks unlocked!')} style={{ padding: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
            <Gift size={16} />
          </button>
          
          {/* Profile Dropdown Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileMenuOpen(v => !v)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 9999, padding: '3px 10px 3px 4px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #5e6ad2, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem',
                  color: '#fff'
                }}>
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
              <ChevronDown size={13} color="rgba(255,255,255,0.6)" style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Glass Profile Dropdown Menu */}
            {profileMenuOpen && (
              <>
                {/* Backdrop overlay for click-outside */}
                <div
                  onClick={() => setProfileMenuOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                />
                
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 240, zIndex: 999,
                  background: 'rgba(18, 22, 34, 0.94)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: 16, padding: 8,
                  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}>
                  {/* User Profile Card Header */}
                  <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 6 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{user?.name || 'Developer'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {user?.email || 'user@example.com'}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: 'rgba(94,106,210,0.25)', border: '1px solid rgba(94,106,210,0.4)', color: '#818cf8',
                        padding: '2px 8px', borderRadius: 99
                      }}>
                        {user?.role || 'Participant'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                        color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <User size={15} color="rgba(255,255,255,0.7)" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                        color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Settings size={15} color="rgba(255,255,255,0.7)" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      to="/notifications"
                      onClick={() => setProfileMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                        color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Bell size={15} color="rgba(255,255,255,0.7)" />
                      <span>Notifications</span>
                    </Link>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

                    {/* Sign Out Button */}
                    <button
                      onClick={async () => {
                        setProfileMenuOpen(false);
                        await logout();
                        toast.success('Signed out successfully');
                        navigate('/login');
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                        color: '#fb7185', background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.82rem', fontWeight: 600, width: '100%', textTransform: 'none',
                        textAlign: 'left', transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,113,133,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={15} color="#fb7185" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area over background */}
      <div style={{ position: 'relative', zIndex: 10, padding: '24px 28px' }}>

        {/* ── Top Developer Metrics Cards Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginBottom: 28 }}>
          
          {/* 1. Commits Card (4 cols) */}
          <div className="liquid-glass" style={{
            gridColumn: 'span 4', borderRadius: 16, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                <span>Commits</span>
                <GitCommit size={15} color="rgba(255,255,255,0.5)" />
              </div>
              {isGithubConnected && (
                <a
                  href={`https://github.com/${ghUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.68rem', color: '#818cf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  @{ghUsername} <ExternalLink size={11} />
                </a>
              )}
            </div>
            
            <div style={{ margin: '14px 0' }}>
              {isGithubConnected ? (
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399' }}>
                  {githubStats.commits} Commits
                </div>
              ) : (
                <button
                  onClick={() => { setGithubConnected(true); toast.success('GitHub Connected successfully!'); }}
                  style={{
                    padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.78rem',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >
                  Connect Now
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)' }}>
              {isGithubConnected ? `${githubStats.repos} Public Repositories` : 'Last Year commits'}
            </div>
          </div>

          {/* 2. Pull Request Card (2 cols) */}
          <div className="liquid-glass" style={{
            gridColumn: 'span 2', borderRadius: 16, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              <span>Pull Request</span>
              <GitPullRequest size={14} color="rgba(255,255,255,0.5)" />
            </div>

            <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
              {isGithubConnected ? githubStats.prs : '....'}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)' }}>Total</div>
          </div>

          {/* 3. Merged PRs Card (2 cols) */}
          <div className="liquid-glass" style={{
            gridColumn: 'span 2', borderRadius: 16, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              <span>Merged PRs</span>
              <GitMerge size={14} color="rgba(255,255,255,0.5)" />
            </div>

            <div style={{ fontSize: '1.2rem', color: '#34d399', fontWeight: 700 }}>
              {isGithubConnected ? githubStats.mergedPrs : '....'}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)' }}>Merged</div>
          </div>

          {/* 4. Projects Created Card (2 cols) */}
          <div className="liquid-glass" style={{
            gridColumn: 'span 2', borderRadius: 16, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden', minHeight: 120
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Projects Created</div>

            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#818cf8' }}>
              {data?.submissions?.length ?? 0}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)' }}>Submissions</div>
          </div>

          {/* 5. Joined Card (2 cols) */}
          <div className="liquid-glass" style={{
            gridColumn: 'span 2', borderRadius: 16, padding: '20px 22px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              <span>Joined</span>
              <ArrowUpRight size={14} color="rgba(255,255,255,0.5)" />
            </div>

            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399' }}>
              {data?.registrations?.length ?? 0}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)' }}>Hackathons Joined</div>
          </div>

        </div>

        {/* ── Main Navigation Tabs (Stats | Projects) ── */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24, paddingBottom: 12 }}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === 'stats' ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: activeTab === 'stats' ? '1px solid rgba(255,255,255,0.14)' : '1px solid transparent',
              color: activeTab === 'stats' ? '#fff' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
            }}
          >
            <span>Stats</span>
            <SlidersIcon size={14} />
          </button>
          
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
              background: activeTab === 'projects' ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: activeTab === 'projects' ? '1px solid rgba(255,255,255,0.14)' : '1px solid transparent',
              color: activeTab === 'projects' ? '#fff' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
            }}
          >
            <span>Projects</span>
            <Folder size={14} />
          </button>
        </div>

        {/* ── Two Column Main Layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, alignItems: 'start' }}>
          
          {/* Left Panel: Getting Started Checklist (6 cols) */}
          <div className="liquid-glass" style={{
            gridColumn: 'span 6', borderRadius: 20, padding: '24px 26px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Compass size={13} color="#fff" />
                  </div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>Getting Started</h2>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  {completedCount} of {checklist.length} completed
                </div>
              </div>

              <button
                onClick={() => { setTourStep(0); setTourOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
                  color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <Sparkles size={13} color="#818cf8" />
                <span>Quick Tour</span>
              </button>
            </div>

            {/* Checklist Items Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checklist.map(item => {
                const isExpanded = expandedCheckItem === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                      borderRadius: 12, padding: '12px 16px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => toggleCheckItem(item.id)}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `1.5px solid ${item.done ? '#34d399' : 'rgba(255,255,255,0.4)'}`,
                          background: item.done ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {item.done && <Check size={12} color="#34d399" strokeWidth={3} />}
                        </div>

                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: item.done ? 'rgba(255,255,255,0.45)' : '#fff', textDecoration: item.done ? 'line-through' : 'none' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedCheckItem(isExpanded ? null : item.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
                      >
                        <ChevronDown size={15} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                        <Link
                          to={item.link}
                          style={{
                            fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                        >
                          {item.actionText || 'Action →'}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Deadlines & Upcoming Events (6 cols) */}
          <div style={{ gridColumn: 'span 6', display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Upcoming Deadlines Card */}
            <div className="liquid-glass" style={{ borderRadius: 20, padding: '24px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={17} color="#fff" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>Upcoming Deadlines</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={deadlineFilter}
                      onChange={e => setDeadlineFilter(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8, padding: '4px 24px 4px 10px', color: 'rgba(255,255,255,0.9)',
                        fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none'
                      }}
                    >
                      <option value="1 Week" style={{ background: '#0d0d12' }}>1 Week</option>
                      <option value="1 Month" style={{ background: '#0d0d12' }}>1 Month</option>
                    </select>
                    <ChevronDown size={12} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>

                  <button style={{ padding: 5, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              {/* Deadlines Content / Empty State */}
              <div style={{
                padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 14
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Calendar size={20} color="rgba(255,255,255,0.4)" />
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  No deadlines soon
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', maxWidth: 260, margin: '0 auto' }}>
                  No projects have deadlines in the next {deadlineFilter.toLowerCase()}.
                </div>
              </div>
            </div>

            {/* Upcoming Events / Active Hackathons Card */}
            <div className="liquid-glass" style={{ borderRadius: 20, padding: '24px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={17} color="#fff" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>Upcoming Events</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={eventFilter}
                      onChange={e => setEventFilter(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '4px 24px 4px 10px', color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none'
                      }}
                    >
                      <option value="1 Week" style={{ background: '#0d0d12' }}>1 Week</option>
                      <option value="1 Month" style={{ background: '#0d0d12' }}>1 Month</option>
                    </select>
                    <ChevronDown size={12} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>

                  <button style={{ padding: 5, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              {/* Registered Hackathons List */}
              {data?.activeHackathons?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.activeHackathons.map(h => (
                    <div key={h._id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12
                    }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: 3 }}>{h.title}</div>
                        <span style={{ fontSize: '0.68rem', color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', padding: '2px 8px', borderRadius: 99 }}>
                          {h.status || 'Active'}
                        </span>
                      </div>

                      <Link
                        to={`/hackathons/${h._id}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                          color: '#fff', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none'
                        }}
                      >
                        View Event <ExternalLink size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '32px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)',
                  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                    No upcoming registered events in {eventFilter.toLowerCase()}
                  </div>
                  <Link
                    to="/hackathons"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8, background: '#5e6ad2',
                      color: '#fff', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none'
                    }}
                  >
                    Browse Hackathons →
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ── Interactive Platform Quick Tour Modal ── */}
      {tourOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="liquid-glass" style={{
            width: '100%', maxWidth: 540, borderRadius: 24, padding: '32px 36px',
            background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            position: 'relative'
          }}>
            {/* Header Badge & Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'rgba(94,106,210,0.25)', border: '1px solid rgba(94,106,210,0.4)', color: '#818cf8',
                padding: '3px 10px', borderRadius: 99
              }}>
                {TOUR_STEPS[tourStep].badge} ({tourStep + 1}/{TOUR_STEPS.length})
              </span>
              
              <button
                onClick={() => setTourOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '50%', width: 28, height: 28, color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Title & Subtitle */}
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>
              {TOUR_STEPS[tourStep].title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, margin: '0 0 16px 0' }}>
              {TOUR_STEPS[tourStep].subtitle}
            </p>

            {/* Body Description */}
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              {TOUR_STEPS[tourStep].content}
            </p>

            {/* Progress Bar Dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setTourStep(idx)}
                  style={{
                    height: 5, borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s',
                    width: idx === tourStep ? 24 : 8,
                    background: idx === tourStep ? '#5e6ad2' : 'rgba(255,255,255,0.15)'
                  }}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <button
                onClick={() => setTourOpen(false)}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Skip Tour
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {tourStep > 0 && (
                  <button
                    onClick={() => setTourStep(prev => prev - 1)}
                    style={{
                      padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.82rem',
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                )}

                {tourStep < TOUR_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTourStep(prev => prev + 1)}
                    style={{
                      padding: '8px 20px', borderRadius: 10, background: '#5e6ad2',
                      border: 'none', color: '#fff', fontSize: '0.82rem',
                      fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(94,106,210,0.4)'
                    }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => { setTourOpen(false); toast.success('Tour completed! Enjoy HackForge 🚀'); }}
                    style={{
                      padding: '8px 20px', borderRadius: 10, background: '#34d399',
                      border: 'none', color: '#050507', fontSize: '0.82rem',
                      fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(52,211,153,0.4)'
                    }}
                  >
                    Finish Tour 🎉
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function SlidersIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

/* ── Organizer Dashboard ── */
function OrganizerDash() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/organizer')
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_META = {
    draft:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.14)', label: 'Draft' },
    upcoming:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.14)',  label: 'Upcoming' },
    open:      { color: '#34d399', bg: 'rgba(52,211,153,0.14)',  label: 'Open' },
    ongoing:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.14)',  label: 'Ongoing' },
    ended:     { color: '#cbd5e1', bg: 'rgba(203,213,225,0.12)', label: 'Ended' },
    cancelled: { color: '#fb7185', bg: 'rgba(251,113,133,0.14)', label: 'Cancelled' },
  };

  const hackathons = data?.hackathons || [];
  const filtered = activeFilter === 'all' ? hackathons : hackathons.filter(h => h.status === activeFilter);
  const statuses = ['all', 'open', 'ongoing', 'upcoming', 'draft', 'ended'];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const daysUntil  = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date()) / 86400000);
  };

  const SPARK_DATA_ORG = [
    [4, 6, 8, 12, 16, 22, 28, 35, 42],
    [10, 18, 32, 45, 68, 92, 120, 154, 185],
    [2, 5, 12, 24, 38, 55, 72, 89, 104],
    [5, 12, 20, 32, 48, 64, 80, 95, 112]
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#050507', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ── Animated Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      <div style={{ position: 'relative', zIndex: 10, padding: '28px 32px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 0 16px rgba(255,255,255,0.3)' }}>🏗️</div>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Organizer Console</div>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.1rem', lineHeight: 1, margin: 0 }}>
                  Welcome back, {user?.name?.split(' ')[0] || 'Organizer'} 👋
                </h1>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/hackathons')}
              style={{ padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            >
              <Layers size={14} /> Browse All
            </button>
            <button
              onClick={() => navigate('/hackathons/create')}
              style={{ padding: '9px 20px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              <Plus size={15} /> + Create Hackathon
            </button>
          </div>
        </div>

        {/* ── 4 Top Stat Cards (with Sparklines) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Hackathons', val: loading ? '—' : (data?.totalHackathons ?? 0), icon: '🏆', color: '#ffffff', change: '+2 active', spark: SPARK_DATA_ORG[0] },
            { label: 'Total Registrations', val: loading ? '—' : (data?.totalRegistrations ?? 0), icon: '👥', color: '#38bdf8', change: '▲ +18% growth', spark: SPARK_DATA_ORG[1] },
            { label: 'Total Submissions', val: loading ? '—' : (data?.totalSubmissions ?? 0), icon: '📦', color: '#34d399', change: '▲ 84% conversion', spark: SPARK_DATA_ORG[2] },
            { label: 'Reviews Completed', val: loading ? '—' : (data?.totalReviews ?? 0), icon: '⭐', color: '#fbbf24', change: '▲ 92% scored', spark: SPARK_DATA_ORG[3] },
          ].map((s, i) => (
            <div key={s.label} className="liquid-glass" style={{ borderRadius: 22, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {s.change}
                </span>
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginBottom: 12 }}>{s.label}</div>
              <Sparkline data={s.spark} color={s.color} width={180} height={36} id={`orgStat${i}`} />
            </div>
          ))}
        </div>

        {/* ── Main Workspace Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>

          {/* Left Column — Hackathons Overview Table */}
          <div className="liquid-glass" style={{ borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Table Header & Filters */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', margin: 0 }}>Hackathon Overview</h2>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Manage registrations, edit settings & view live submission activity</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveFilter(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 18, border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                      background: activeFilter === s ? '#ffffff' : 'rgba(255,255,255,0.06)',
                      color: activeFilter === s ? '#060709' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Body */}
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
                <div>Loading hackathons...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏗️</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No hackathons found</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  {activeFilter === 'all' ? "You haven't created any hackathons yet." : `No hackathons with status: ${activeFilter}`}
                </div>
                <button onClick={() => navigate('/hackathons/create')} style={{ padding: '10px 20px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, cursor: 'pointer' }}>
                  + Create Your First Hackathon
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                  <div>Hackathon</div><div>Status</div><div>Registrations</div><div>Submissions</div><div>End Date</div><div>Actions</div>
                </div>
                {filtered.map((h, i) => {
                  const meta = STATUS_META[h.status] || STATUS_META.draft;
                  const days = daysUntil(h.endDate);
                  return (
                    <div
                      key={h._id}
                      style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1fr 1fr auto', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/hackathons/${h._id}`)}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 3, color: '#fff' }}>{h.title}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {h.theme && <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 20 }}>{h.theme}</span>}
                          {h.mode && <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{h.mode}</span>}
                        </div>
                      </div>

                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: meta.bg, color: meta.color, fontSize: '0.7rem', fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                          {meta.label}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#38bdf8' }}>{h.registrationCount ?? 0}</div>

                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#34d399' }}>{h.submissionCount ?? 0}</div>

                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{formatDate(h.endDate)}</div>
                        {days !== null && days >= 0 && <div style={{ fontSize: '0.65rem', color: days < 3 ? '#fb7185' : 'rgba(255,255,255,0.38)', marginTop: 2 }}>{days === 0 ? 'Ends today!' : `${days}d left`}</div>}
                        {days !== null && days < 0 && <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Ended</div>}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/hackathons/${h._id}/registrations`)}
                          title="Manage registrations"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#060709'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                          <User size={13} />
                        </button>
                        <button
                          onClick={() => navigate(`/hackathons/${h._id}/edit`)}
                          title="Edit hackathon"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#060709'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                          <Settings size={13} />
                        </button>
                        <button
                          onClick={() => navigate(`/hackathons/${h._id}/leaderboard`)}
                          title="View leaderboard"
                          style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#060709'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                        >
                          <Award size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column — AI Organizer Assistant & Quick Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* AI Organizer Assistant Card */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '20px 18px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🤖</div>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Organizer AI</span>
                </div>
                <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>Pro</span>
              </div>

              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.3rem', lineHeight: 1.25, marginBottom: 7 }}>
                AI Timeline & Schedule Assistant
              </div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, marginBottom: 16 }}>
                Auto-generate hackathon timeline milestones, broadcast announcement templates, and smart judge assignments for top submissions.
              </p>

              <button
                onClick={() => toast('AI Assistant generating schedule timeline...')}
                style={{ padding: '10px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                ⚡ Launch Organizer AI
              </button>
            </div>

            {/* Organizer Quick Tools Widget */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>Organizer Quick Tools</div>
              {[
                { icon: '📋', label: 'Manage Registrations', desc: 'Approve & export candidates', onClick: () => hackathons[0] && navigate(`/hackathons/${hackathons[0]._id}/registrations`) },
                { icon: '⚖️', label: 'Assign Judges', desc: 'Coordinate review workload', onClick: () => navigate('/dashboard') },
                { icon: '📢', label: 'Send Announcement', desc: 'Broadcast update to teams', onClick: () => toast('Announcement modal coming soon!') },
                { icon: '🏆', label: 'Live Leaderboards', desc: 'Publish final judge scores', onClick: () => hackathons[0] && navigate(`/hackathons/${hackathons[0]._id}/leaderboard`) },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={t.onClick}
                  style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>{t.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.76rem', color: '#fff' }}>{t.label}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>{t.desc}</div>
                  </div>
                  <ChevronRight size={13} color="rgba(255,255,255,0.3)" />
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── 4 Bottom Stakent Metric Cells ── */}
        <div className="liquid-glass" style={{ borderRadius: 22, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Participant Velocity', sub: 'Daily signups growth', val: '+42/day', change: '+24%', pos: true, spark: [12, 18, 24, 30, 35, 42, 48, 52, 58], color: '#ffffff' },
              { label: 'Judge Activity Rate', sub: 'Judges actively online', val: '94.2%', change: '+5.4%', pos: true, spark: [70, 75, 82, 88, 90, 92, 94, 94.2, 94.2], color: '#38bdf8' },
              { label: 'Submission Conversion', sub: 'Registered teams submitted', val: '86.4%', change: '+8.1%', pos: true, spark: [50, 58, 65, 72, 78, 82, 84, 86, 86.4], color: '#34d399' },
              { label: 'Avg Review Score', sub: 'Across submitted projects', val: '7.85/10', change: '+0.4', pos: true, spark: [6.2, 6.8, 7.1, 7.4, 7.6, 7.7, 7.8, 7.85, 7.85], color: '#fbbf24' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '16px 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{m.label}</div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>{m.sub}</div>
                  </div>
                  <span style={{ fontSize: '0.56rem', padding: '2px 6px', borderRadius: 5, background: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: 700 }}>24H</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                    ▲ {m.change}
                  </div>
                </div>
                <Sparkline data={m.spark} color={m.color} width={130} height={32} id={`orgBot${i}`} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Sparkline mini chart helper ── */
function Sparkline({ data, color = '#8b5cf6', width = 130, height = 45, id }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height * 0.8) - height * 0.08
  ]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const gradId = `sp-${id || 'x'}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Judge Dashboard (Stakent-style premium) ── */
function JudgeDash() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedSub, setSelectedSub] = useState(null);
  const [activeCriteriaMode, setActiveCriteriaMode] = useState('Quick');

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/judge')
      .then(r => {
        setData(r.data.data);
        const subs = r.data.data?.submissions || [];
        if (subs.length > 0) setSelectedSub(subs[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allSubs    = data?.submissions || [];
  const hackathons = data?.hackathons  || [];
  const total      = data?.totalSubmissions  ?? 0;
  const done       = data?.completedReviews  ?? 0;
  const pending    = data?.pendingReviews    ?? 0;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const pendingSubs  = allSubs.filter(s => !s.reviewed);
  const reviewedSubs = allSubs.filter(s => s.reviewed);
  const sidebarSubs  = activeTab === 'pending' ? pendingSubs : reviewedSubs;
  const topSubs      = allSubs.slice(0, 3);

  const SPARK_DATA  = [
    [4, 6, 5, 7, 8, 7, 9, 8, 9, 8.5],
    [6, 5, 7, 6, 8, 7, 6, 8, 7, 8],
    [7, 5, 6, 4, 6, 5, 4, 5, 5, 4.5],
  ];
  const SPARK_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444'];

  const selectedHackathon = hackathons[0];
  const criteria = selectedHackathon?.judgingCriteria?.length
    ? selectedHackathon.judgingCriteria
    : [
        { criterion: 'Innovation',  maxScore: 10 },
        { criterion: 'Execution',   maxScore: 10 },
        { criterion: 'Impact',      maxScore: 10 },
        { criterion: 'Design',      maxScore: 10 },
      ];

  const navItems = [
    { id: 'dashboard',   icon: '⊞', label: 'Dashboard'       },
    { id: 'submissions', icon: '📄', label: 'Submissions'     },
    { id: 'hackathons',  icon: '🏆', label: 'Hackathons'      },
    { id: 'criteria',    icon: '⚖️', label: 'Scoring Criteria'},
    { id: 'reports',     icon: '📊', label: 'Reports'         },
  ];

  const CRIT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  // Colour seed from project name
  const hueOf = (str = 'P') => (str.charCodeAt(0) * 5) % 360;

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', overflow: 'hidden', background: '#050507', color: '#fff', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Animated Canvas Dotted Glow Background ── */}
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

      {/* ══════════════ LEFT SUB-SIDEBAR ══════════════ */}
      <div style={{ width: 220, flexShrink: 0, background: 'rgba(9, 10, 15, 0.92)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', boxShadow: '0 0 16px rgba(255,255,255,0.3)' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1 }}>HackForge</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: 600 }}>⚖️ Judge Console</div>
            </div>
          </Link>
        </div>

        {/* Tabs: Pending / Reviewed */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 }}>
            {[{ id: 'pending', bg: '#ffffff', color: '#060709' }, { id: 'reviewed', bg: 'rgba(255,255,255,0.16)', color: '#ffffff' }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === t.id ? t.bg : 'transparent',
                color: activeTab === t.id ? t.color : 'rgba(255,255,255,0.38)',
              }}>
                {t.id.charAt(0).toUpperCase() + t.id.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setActiveNav(n.id); if (n.id === 'submissions' && hackathons[0]) navigate(`/judge/hackathon/${hackathons[0]._id}/submissions`); }} style={{
              width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none',
              background: activeNav === n.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              borderLeft: `2px solid ${activeNav === n.id ? '#ffffff' : 'transparent'}`,
              color: activeNav === n.id ? '#ffffff' : 'rgba(255,255,255,0.42)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
              fontSize: '0.78rem', fontWeight: activeNav === n.id ? 700 : 400, textAlign: 'left', transition: 'all 0.15s', marginBottom: 1,
            }}>
              <span style={{ fontSize: '0.88rem' }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </div>

        {/* Active Reviews list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 6px' }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8, paddingLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeTab === 'pending' ? 'Pending' : 'Reviewed'}
            {pendingSubs.length > 0 && activeTab === 'pending' && (
              <span style={{ background: '#ffffff', color: '#060709', borderRadius: 10, padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700 }}>{pendingSubs.length}</span>
            )}
          </div>
          {loading ? (
            <div style={{ padding: '10px 8px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>Loading...</div>
          ) : sidebarSubs.length === 0 ? (
            <div style={{ padding: '16px 8px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', textAlign: 'center' }}>
              {activeTab === 'pending' ? '🎉 All caught up!' : 'No reviews yet'}
            </div>
          ) : sidebarSubs.slice(0, 10).map(s => (
            <button key={s._id} onClick={() => setSelectedSub(s)} style={{
              width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid', cursor: 'pointer', marginBottom: 4, textAlign: 'left', transition: 'all 0.15s',
              background: selectedSub?._id === s._id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)',
              borderColor: selectedSub?._id === s._id ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, color: '#fff' }}>
                  {(s.projectName || 'P')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.7rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.projectName || 'Untitled'}</div>
                  <div style={{ fontSize: '0.6rem', color: s.reviewed ? '#10b981' : '#fbbf24', marginTop: 1 }}>
                    {s.reviewed ? `Score: ${s.myScore ?? '—'}` : 'Pending Review'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Progress pill */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 13px', marginBottom: 10 }}>
            <div style={{ fontSize: '0.62rem', color: '#ffffff', fontWeight: 700, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>⚡ Review Progress</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>{done} / {total} Reviews</div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #ffffff, #e2e8f0)', borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: 5, textAlign: 'right' }}>{progressPct}% complete</div>
          </div>

          {/* User profile & logout */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || 'J'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Judge'}</div>
                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)' }}>Judge Role</div>
              </div>
            </div>
            <button
              onClick={() => logout && logout()}
              title="Log Out"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0, zIndex: 10 }}>

        {/* ─ Top bar ─ */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9, 10, 15, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', marginBottom: 2 }}>
              Recommended for Review · <span style={{ color: '#fbbf24' }}>{loading ? '…' : `${pending} Pending`}</span>
            </div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.45rem', lineHeight: 1 }}>Top Submissions</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'Innovation', 'Design', 'Technical'].map((f, fi) => (
              <button key={f} style={{
                padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.14)',
                background: fi === 0 ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: fi === 0 ? '#ffffff' : 'rgba(255,255,255,0.45)',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
              }}>{f}</button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 12px' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>⚖️</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{user?.name?.split(' ')[0] || 'Judge'}</span>
            </div>
          </div>
        </div>

        {/* ─ Body ─ */}
        <div style={{ padding: '18px 22px', flex: 1 }}>

          {/* ══ Top row: 3 submission cards + AI card ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 268px', gap: 13, marginBottom: 16 }}>

            {/* 3 Submission cards */}
            {(loading
              ? [null, null, null]
              : topSubs.length >= 3 ? topSubs.slice(0, 3) : [...topSubs, ...Array(3 - topSubs.length).fill(null)]
            ).map((s, i) => {
              const color = ['#ffffff', '#38bdf8', '#fbbf24'][i];
              const isGain = i < 2;
              const changeVal = (1.2 + i * 0.4).toFixed(1);
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={s?._id || i}
                  onClick={() => s?._id && setSelectedSub(s)}
                  className="liquid-glass"
                  style={{ borderRadius: 22, padding: '17px 16px 13px', cursor: s?._id ? 'pointer' : 'default', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem' }}>
                        {medals[i]}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {loading ? '…' : s?.reviewed ? 'Reviewed' : 'Pending'}
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {loading ? '———' : (s?.projectName || 'No Submission')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); if (s?._id) navigate(`/judge/submissions/${s._id}/review`); }}
                      style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0 }}
                    >↗</button>
                  </div>

                  {/* Team */}
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                    Team · <span style={{ color: '#ffffff' }}>{loading ? '…' : (s?.team?.name || '—')}</span>
                  </div>

                  {/* Score */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1, color: loading || !s ? 'rgba(255,255,255,0.2)' : color }}>
                      {loading ? '—' : s?.reviewed ? `${s.myScore ?? '—'}/10` : 'Pending'}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isGain ? '#34d399' : '#fb7185', marginTop: 4 }}>
                      {isGain ? '▲' : '▼'} {isGain ? '+' : ''}{changeVal} pts from avg
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden' }}>
                    <Sparkline data={SPARK_DATA[i]} color={color} width={170} height={48} id={`top${i}`} />
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(s?.techStack || ['React', 'AI']).slice(0, 2).map(t => (
                      <span key={t} style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '2px 7px', borderRadius: 7 }}>{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* AI Review Assistant card */}
            <div className="liquid-glass" style={{ borderRadius: 22, padding: '18px 16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>⚖️</div>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Judge AI</span>
                </div>
                <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>Beta</span>
              </div>

              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', lineHeight: 1.25, marginBottom: 7, position: 'relative' }}>
                AI Review Assistant
              </div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, flex: 1, position: 'relative', marginBottom: 0 }}>
                Auto-generate polished feedback notes, get AI score suggestions against judging criteria, and spot inconsistencies across your reviews.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18, position: 'relative' }}>
                <button
                  onClick={() => selectedSub?._id && navigate(`/judge/submissions/${selectedSub._id}/review`)}
                  style={{ padding: '10px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  ⚡ Start AI Review
                </button>
                <button
                  onClick={() => hackathons[0] && navigate(`/judge/hackathon/${hackathons[0]._id}/submissions`)}
                  style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  📋 All Submissions
                </button>
              </div>
            </div>
          </div>

          {/* ══ Active Review Detail panel ══ */}
          <div className="liquid-glass" style={{ borderRadius: 22, overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>
                Active Review · updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} <span style={{ color: '#fbbf24' }}>●</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {['↗', '↻', '▾'].map(ic => (
                  <button key={ic} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', cursor: 'pointer' }}>{ic}</button>
                ))}
              </div>
            </div>

            {/* Panel body */}
            <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 250px', gap: 24, alignItems: 'start' }}>

              {/* Left — selected submission detail */}
              <div>
                {selectedSub ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📦</div>
                      <div>
                        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.35rem', lineHeight: 1 }}>{selectedSub.projectName}</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          by Team <span style={{ color: '#ffffff' }}>{selectedSub.team?.name || '—'}</span>
                        </div>
                      </div>
                      {selectedSub._id && (
                        <div style={{ display: 'flex', gap: 6, marginLeft: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => navigate(`/judge/submissions/${selectedSub._id}/review`)} style={{ padding: '5px 13px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                            {selectedSub.reviewed ? '✏️ Edit Review' : '⚖️ Start Review'}
                          </button>
                          <button onClick={() => navigate(`/judge/hackathon/${hackathons[0]?._id}/submissions`)} style={{ padding: '5px 13px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                            View All ↗
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Big score display */}
                    <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                      <div style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', color: selectedSub.reviewed ? '#ffffff' : 'rgba(255,255,255,0.15)' }}>
                        {selectedSub.reviewed ? (selectedSub.myScore ?? '—') : '—'}
                        {selectedSub.reviewed && <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400, letterSpacing: 0 }}> / 10</span>}
                      </div>
                      {selectedSub.reviewed && (
                        <div style={{ paddingBottom: 8 }}>
                          <span style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.28)', color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>
                            ✓ Review Submitted
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Problem statement */}
                    <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.62, marginBottom: 14, maxWidth: 500 }}>
                      {selectedSub.problemStatement || 'No problem statement provided.'}
                    </div>

                    {/* Tech tags */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {(selectedSub.techStack || []).map(t => (
                        <span key={t} style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#ffffff', padding: '3px 9px', borderRadius: 8 }}>{t}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>👈</div>
                    <div style={{ fontSize: '0.82rem' }}>Select a submission from the sidebar</div>
                  </div>
                )}
              </div>

              {/* Right — Scoring Criteria */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Judging Criteria</div>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
                    {['Quick', 'Detail'].map(m => (
                      <button key={m} onClick={() => setActiveCriteriaMode(m)} style={{
                        padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        background: activeCriteriaMode === m ? '#ffffff' : 'transparent',
                        color: activeCriteriaMode === m ? '#060709' : 'rgba(255,255,255,0.38)',
                      }}>{m}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {criteria.map((c, i) => {
                    const mockVal = selectedSub?.reviewed ? [7.5, 8, 6.5, 7][i % 4] : null;
                    const pct = mockVal ? (mockVal / (c.maxScore || 10)) * 100 : 0;
                    const bc = ['#ffffff', '#38bdf8', '#34d399', '#fbbf24'][i % 4];
                    return (
                      <div key={c.criterion}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{c.criterion}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: bc }}>{mockVal ?? '—'}/{c.maxScore}</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${bc}88, ${bc})`, borderRadius: 4, transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)', boxShadow: pct > 0 ? `0 0 8px ${bc}55` : 'none' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => selectedSub?._id && navigate(`/judge/submissions/${selectedSub._id}/review`)}
                  style={{ width: '100%', marginTop: 16, padding: '10px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,255,255,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  {selectedSub?.reviewed ? '✏️ Edit Full Review' : '⚖️ Open Review Form'}
                </button>
              </div>
            </div>

            {/* ── 4 bottom metric cells ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Innovation', sub: 'Originality score',    val: selectedSub?.reviewed ? '8.2/10' : '—', change: '+0.8 pts', pos: true,  spark: [5,6,7,6,7,8,7,8,8.2], color: '#ffffff' },
                { label: 'Tech Depth', sub: 'Implementation quality', val: selectedSub?.reviewed ? '7.5/10' : '—', change: '+1.2 pts', pos: true,  spark: [4,5,5,6,6,7,7,7,7.5], color: '#38bdf8' },
                { label: 'Progress',   sub: 'Reviews completed',    val: `${progressPct}%`,             change: `${done}/${total}`,   pos: progressPct > 40, spark: [10,20,30,35,45,50,55,progressPct,progressPct], color: '#34d399' },
                { label: 'Avg Score',  sub: 'Across all reviews',   val: done > 0 ? '7.50' : '—',       change: '+0.3 pts', pos: true,  spark: [6,6.5,7,6.8,7.2,7.4,7.5,7.5,7.5], color: '#fbbf24' },
              ].map((m, i) => (
                <div key={m.label} style={{ padding: '14px 18px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.76rem' }}>{m.label}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{m.sub}</div>
                    </div>
                    <span style={{ fontSize: '0.56rem', padding: '2px 6px', borderRadius: 5, background: m.pos ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: m.pos ? '#10b981' : '#ef4444', fontWeight: 700 }}>24H</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 7 }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
                    <div style={{ fontSize: '0.62rem', color: m.pos ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                      {m.pos ? '▲' : '▼'} {m.change}
                    </div>
                  </div>
                  <Sparkline data={m.spark} color={m.color} width={115} height={30} id={`bot${i}`} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Admin Dashboard (Preserved) ── */
function AdminDash() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard/admin').then(r => setData(r.data.data)).catch(() => {}); }, []);

  return (
    <div style={{ position: 'relative', padding: '32px 28px', background: '#050507', minHeight: '100vh', color: '#fff', overflow: 'hidden' }}>
      <DottedGlowBackground gap={20} radius={1.8} opacity={0.7} color="rgba(255,255,255,0.16)" glowColor="rgba(129, 140, 248, 0.8)" />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', marginBottom: 6 }}>Admin Control</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 32 }}>Platform-wide overview and management.</p>
      </div>
    </div>
  );
}

/* ── Main Router ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const isJudge = user?.role === 'judge';

  const Dash = {
    participant: ParticipantDash,
    organizer: OrganizerDash,
    judge: JudgeDash,
    admin: AdminDash,
  }[user?.role] || ParticipantDash;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050507' }}>
      {!isJudge && <Sidebar />}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Dash />
      </main>
    </div>
  );
}
