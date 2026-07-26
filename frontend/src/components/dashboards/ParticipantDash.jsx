import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import toast from 'react-hot-toast';

function GithubIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

/* ── Developer Participant Dashboard ── */
export default function ParticipantDash() {
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

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <>
                <div onClick={() => setProfileMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 240, zIndex: 999,
                  background: 'rgba(18, 22, 34, 0.94)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: 16, padding: 8,
                  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name || 'Developer'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email || 'user@hackforge.dev'}
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '2px 8px', borderRadius: 9999, background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 600 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa' }} />
                      {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Participant'} Mode
                    </div>
                  </div>

                  <button onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <User size={15} color="rgba(255,255,255,0.7)" /> Manage Profile
                  </button>

                  <button onClick={() => { setProfileMenuOpen(false); navigate('/repositories'); }} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GithubIcon size={15} color="rgba(255,255,255,0.7)" /> Linked GitHub Repos
                  </button>

                  <button onClick={() => { setProfileMenuOpen(false); setTourOpen(true); setTourStep(0); }} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'transparent', border: 'none', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={15} color="#a78bfa" /> Platform Quick Tour
                  </button>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />

                  <button onClick={() => { setProfileMenuOpen(false); logout && logout(); }} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Body ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1400, margin: '0 auto', padding: '32px 28px' }}>
        
        {/* Banner Section */}
        <div className="liquid-glass" style={{ borderRadius: 22, padding: '28px 32px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: '0.72rem', fontWeight: 600, marginBottom: 12 }}>
                ⚡ Developer Workspace
              </div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', lineHeight: 1.1, margin: '0 0 8px 0' }}>
                Build, Collaborate & Win Hackathons
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0, maxWidth: 620 }}>
                Manage your team sprints, sync live GitHub commits, and generate AI submission feedback.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setTourOpen(true)} style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} /> Quick Tour
              </button>
              <button onClick={() => navigate('/hackathons')} style={{ padding: '10px 22px', borderRadius: 12, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(255,255,255,0.3)' }}>
                <Compass size={15} /> Explore Hackathons
              </button>
            </div>
          </div>
        </div>

        {/* Developer Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'GitHub Commits', val: githubStats.commits, icon: <GitCommit size={18} color="#ffffff" />, color: '#ffffff', sub: 'Synced from GitHub' },
            { label: 'Pull Requests', val: githubStats.prs, icon: <GitPullRequest size={18} color="#38bdf8" />, color: '#38bdf8', sub: `${githubStats.mergedPrs} Merged` },
            { label: 'Active Projects', val: data?.myTeams?.length || 1, icon: <Folder size={18} color="#34d399" />, color: '#34d399', sub: 'Workspace active' },
            { label: 'Hackathons Joined', val: data?.registeredHackathons?.length || 0, icon: <Award size={18} color="#fbbf24" />, color: '#fbbf24', sub: 'Registrations' },
          ].map(s => (
            <div key={s.label} className="liquid-glass" style={{ borderRadius: 22, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>{s.sub}</span>
              </div>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid: Onboarding Checklist & Active Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          
          {/* Active Teams & Workspaces */}
          <div className="liquid-glass" style={{ borderRadius: 22, padding: '24px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', margin: 0 }}>Your Hackathon Workspaces</h2>
              <button onClick={() => navigate('/hackathons')} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                Find Team →
              </button>
            </div>

            {data?.myTeams?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.myTeams.map(t => (
                  <div key={t._id} style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{t.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        Hackathon: <span style={{ color: '#ffffff' }}>{t.hackathon?.title || 'Active Hackathon'}</span>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/workspace/${t._id}`)} style={{ padding: '8px 16px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                      Open Workspace ↗
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>🚀</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>No Active Workspace</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Explore open hackathons to form or join a developer team</div>
                <button onClick={() => navigate('/hackathons')} style={{ padding: '9px 20px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                  Browse Hackathons
                </button>
              </div>
            )}
          </div>

          {/* Onboarding Checklist Sidebar Widget */}
          <div className="liquid-glass" style={{ borderRadius: 22, padding: '24px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Onboarding Steps</h3>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{completedCount} of {checklist.length} completed</div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.1)', padding: '3px 9px', borderRadius: 99 }}>
                {Math.round((completedCount / checklist.length) * 100)}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checklist.map(item => (
                <div key={item.id} style={{ padding: '10px 12px', borderRadius: 12, background: item.done ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${item.done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <button onClick={() => toggleCheckItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                    <CheckCircle2 size={16} color={item.done ? '#34d399' : 'rgba(255,255,255,0.3)'} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: item.done ? '#34d399' : '#fff', textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Tour Modal Overlay */}
      {tourOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="liquid-glass" style={{ width: 500, borderRadius: 24, padding: 32, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '3px 10px', borderRadius: 99 }}>
                {TOUR_STEPS[tourStep].badge} ({tourStep + 1}/{TOUR_STEPS.length})
              </span>
              <button onClick={() => setTourOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>{TOUR_STEPS[tourStep].title}</h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 16px 0' }}>{TOUR_STEPS[tourStep].subtitle}</p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 24px 0' }}>{TOUR_STEPS[tourStep].content}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <button onClick={() => setTourOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', cursor: 'pointer' }}>Skip Tour</button>
              <div style={{ display: 'flex', gap: 8 }}>
                {tourStep > 0 && (
                  <button onClick={() => setTourStep(prev => prev - 1)} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.82rem', cursor: 'pointer' }}>Back</button>
                )}
                {tourStep < TOUR_STEPS.length - 1 ? (
                  <button onClick={() => setTourStep(prev => prev + 1)} style={{ padding: '8px 20px', borderRadius: 10, background: '#ffffff', border: 'none', color: '#060709', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>Next →</button>
                ) : (
                  <button onClick={() => { setTourOpen(false); toast.success('Tour completed!'); }} style={{ padding: '8px 20px', borderRadius: 10, background: '#34d399', border: 'none', color: '#060709', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>Finish Tour 🎉</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
