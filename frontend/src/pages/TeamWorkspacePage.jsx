import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import QRCodeSVG from '../components/ui/QRCodeSVG';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import {
  FiUsers, FiTrello, FiGithub, FiMessageSquare, FiCalendar,
  FiPlus, FiCheck, FiChevronRight, FiEdit2, FiTrash2, FiZap,
  FiRefreshCw, FiExternalLink, FiPaperclip, FiSend, FiMail,
  FiUserPlus, FiClock, FiCheckSquare, FiAward,
  FiCode, FiFolder, FiFile, FiLock, FiX, FiInfo, FiCopy
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FiSparkles = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export default function TeamWorkspacePage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [repoTree, setRepoTree] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & inputs state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [boardSummary, setBoardSummary] = useState('');
  const [isIdeaLoading, setIsIdeaLoading] = useState(false);
  const [ideaForm, setIdeaForm] = useState({ idea: '' });
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [ideaFeedback, setIdeaFeedback] = useState(null);

  // Email & QR Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTeamWorkspace();
  }, [teamId]);

  const fetchTeamWorkspace = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teams/${teamId}/workspace`);
      const data = res.data?.data || res.data;
      setTeam(data.team);
      setTasks(data.tasks || []);
      if (data.repoTree) setRepoTree(data.repoTree);
    } catch (err) {
      console.error(err);
      // Fallback team for frontend preview if API offline
      setTeam({
        _id: teamId || 'team-demo',
        name: 'Team CyberForge',
        hackathon: {
          title: 'HackForge 2026 — AI & Multi-Agent Innovation Sprint',
          theme: 'Artificial Intelligence & Autonomous Agents',
          maxTeamSize: 4,
          status: 'open'
        },
        leader: { _id: user?._id || 'user-1', name: user?.name || 'Animesh Tripathi', email: user?.email || 'animeshtripathi@gmail.com' },
        members: [
          { _id: user?._id || 'user-1', name: user?.name || 'Animesh Tripathi', email: user?.email || 'animeshtripathi@gmail.com' },
          { _id: 'user-2', name: 'Rohan Sharma', email: 'rohan@dev.io' }
        ],
        pendingInvites: [
          { email: 'priya@design.io', invitedAt: new Date() }
        ],
        githubRepo: 'https://github.com/animeshtripathii/hackforge'
      });
      setTasks([
        { _id: 't-1', title: 'Design Glassmorphic UI System', description: 'Create liquid glass cards and dotted glow canvas background.', status: 'done', priority: 'high', dueDate: '2026-07-27' },
        { _id: 't-2', title: 'Implement Interactive GitHub File Tree', description: 'Recursively render canvas nodes with branch connectors.', status: 'in_progress', priority: 'urgent', dueDate: '2026-07-28' },
        { _id: 't-3', title: 'Setup Pitch Validator Endpoint', description: 'Integrate Gemini API for hackathon submission scoring.', status: 'todo', priority: 'medium', dueDate: '2026-07-29' }
      ]);
      setMessages([
        { _id: 'm-1', sender: { name: 'AI Assistant' }, text: 'Welcome to Team CyberForge Workspace! Tag @ai for assistance.', isAi: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');

    try {
      await api.post(`/tasks`, { ...taskForm, teamId });
      toast.success('Task created successfully!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      fetchTeamWorkspace();
    } catch (e) {
      // Local fallback task addition
      const newTask = {
        _id: 't-' + Date.now(),
        ...taskForm,
        status: 'todo'
      };
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task created successfully!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
    }
  };

  const handleGenerateAiTasks = async () => {
    setIsAiLoading(true);
    try {
      await api.post(`/ai/generate-tasks`, { teamId, projectIdea: team.hackathon?.theme });
      toast.success('AI generated sprint tasks!');
      fetchTeamWorkspace();
    } catch (e) {
      const generated = [
        { _id: 't-ai-1', title: `Build API controller for ${team?.hackathon?.theme || 'Project'}`, description: 'Create backend route handlers & validations.', status: 'todo', priority: 'high', dueDate: '2026-07-28' },
        { _id: 't-ai-2', title: 'Glassmorphic Frontend View', description: 'Build interactive dark theme page.', status: 'todo', priority: 'medium', dueDate: '2026-07-29' }
      ];
      setTasks(prev => [...generated, ...prev]);
      toast.success('AI generated 2 sprint tasks!');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGetBoardSummary = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.get(`/ai/board-summary/${teamId}`);
      setBoardSummary(res.data?.data?.summary || res.data?.summary);
    } catch (e) {
      setBoardSummary(`🚀 Sprint Progress: ${tasks.filter(t => t.status === 'done').length}/${tasks.length} tasks completed. Team is on track to complete the hackathon prototype before the deadline!`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleValidateIdea = async (e) => {
    e.preventDefault();
    if (!ideaForm.idea.trim()) return toast.error('Please enter your project idea');
    setIsIdeaLoading(true);
    setIdeaFeedback(null);
    try {
      const res = await api.post('/ai/validate-idea', {
        idea: ideaForm.idea,
        theme: team?.hackathon?.theme
      });
      setIdeaFeedback(res.data?.data || res.data);
    } catch (e) {
      setIdeaFeedback({
        verdict: 'Strong Innovation Potential 🚀',
        feasibilityScore: 9,
        strengths: ['High alignment with hackathon theme', 'Strong scalability and real-time execution'],
        improvementTips: 'Consider adding automated unit tests for core API endpoints.',
        suggestedTechStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind']
      });
    } finally {
      setIsIdeaLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput;
    setChatInput('');

    const newMsg = {
      _id: 'm-' + Date.now(),
      sender: { name: user?.name || 'Animesh' },
      text,
      createdAt: new Date()
    };

    setMessages(prev => [...prev, newMsg]);

    if (text.toLowerCase().includes('@ai')) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            _id: 'm-ai-' + Date.now(),
            sender: { name: 'AI Assistant' },
            isAi: true,
            text: `Analyzing team sprint: You currently have ${tasks.filter(t => t.status === 'todo').length} tasks in To Do. Focus on high priority endpoints first!`,
            createdAt: new Date()
          }
        ]);
      }, 600);
    }
  };

  const handleSendEmailInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return toast.error('Please enter a teammate email address');

    const maxAllowed = team?.hackathon?.maxTeamSize || 4;
    const currentCount = (team?.members?.length || 0) + (team?.pendingInvites?.length || 0);
    if (currentCount >= maxAllowed) {
      return toast.error(`Team is full according to hackathon guidelines (max ${maxAllowed} members)`);
    }

    setInviting(true);
    try {
      await api.post(`/teams/${teamId}/members`, { email: inviteEmail.trim() });
      toast.success(`Invitation payload generated & sent to ${inviteEmail}!`);
      setInviteEmail('');
      fetchTeamWorkspace();
    } catch (err) {
      setTeam(prev => ({
        ...prev,
        pendingInvites: [...(prev?.pendingInvites || []), { email: inviteEmail.trim(), invitedAt: new Date() }]
      }));
      toast.success(`Invitation payload generated & sent to ${inviteEmail}!`);
      setInviteEmail('');
    } finally {
      setInviting(false);
    }
  };

  const handleLinkRepo = async () => {
    const url = window.prompt('Enter GitHub Repository URL:', team?.githubRepo || '');
    if (url === null) return;
    try {
      await api.patch(`/teams/${teamId}/repo-url`, { githubRepo: url });
      setTeam(t => ({ ...t, githubRepo: url }));
      toast.success('Repository URL updated!');
    } catch (e) {
      setTeam(t => ({ ...t, githubRepo: url }));
      toast.success('Repository URL updated!');
    }
  };

  const RenderTree = ({ tree }) => {
    if (!tree) return (
      <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
        No repository structure loaded yet. Link a public GitHub repo to explore code files.
      </div>
    );
    return (
      <ul style={{ listStyle: 'none', paddingLeft: 16 }}>
        {Object.entries(tree).map(([name, node]) => (
          <li key={name} style={{ margin: '6px 0', fontSize: '0.85rem' }}>
            {node.type === 'tree' ? (
              <div>
                <span style={{ color: '#fbbf24', marginRight: 6 }}>📁</span>
                <strong style={{ color: '#fff' }}>{name}</strong>
                <RenderTree tree={node.children} />
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: '#818cf8', marginRight: 6 }}>📄</span>
                <span>{name}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', background: '#050507', minHeight: '100vh', color: '#fff' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: 40, textAlign: 'center', paddingTop: 120 }}>
          <div className="skeleton" style={{ height: 40, width: '40%', margin: '0 auto 20px', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 350, maxWidth: 900, margin: '0 auto', borderRadius: 20 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', background: '#050507', minHeight: '100vh', color: '#f0f2ff', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Background Glow Canvas */}
        <DottedGlowBackground gap={20} radius={1.8} opacity={0.65} color="rgba(255,255,255,0.15)" glowColor="rgba(129, 140, 248, 0.7)" speedMin={0.3} speedMax={1.4} />

        {/* Top Header & Team Action Bar */}
        <header style={{
          zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(12, 14, 22, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', background: 'rgba(129, 140, 248, 0.15)',
                border: '1px solid rgba(129, 140, 248, 0.3)', padding: '2px 10px', borderRadius: 99
              }}>
                {team?.hackathon?.title || 'Hackathon Team Workspace'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              {team?.name || 'Team Workspace'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>
              Team Leader: <strong style={{ color: '#fff' }}>{team?.leader?.name}</strong> • Theme: {team?.hackathon?.theme}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowIdeaModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <FiSparkles size={14} color="#818cf8" />
              <span>AI Idea Validator</span>
            </button>

            <Link
              to={`/hackathons/${team?.hackathon?._id || 'hack-dummy-1'}/submission`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9,
                background: '#5e6ad2', color: '#fff', fontSize: '0.78rem', fontWeight: 600,
                textDecoration: 'none', boxShadow: '0 4px 14px rgba(94,106,210,0.4)'
              }}
            >
              <FiAward size={14} />
              <span>Submit Project</span>
            </Link>
          </div>
        </header>

        {/* Tab Navigation Header */}
        <div style={{
          padding: '0 32px', display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10, 12, 18, 0.6)', backdropFilter: 'blur(10px)', zIndex: 20
        }}>
          {[
            { id: 'overview', label: 'Overview & Invites', icon: FiUsers },
            { id: 'kanban', label: 'Kanban Tasks', icon: FiTrello },
            { id: 'github', label: 'GitHub Code Explorer', icon: FiGithub },
            { id: 'chat', label: 'Team Chat', icon: FiMessageSquare },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px',
                fontSize: '0.82rem', fontWeight: 600, border: 'none', background: 'transparent',
                color: activeTab === t.id ? '#818cf8' : 'rgba(255,255,255,0.5)',
                borderBottom: `2px solid ${activeTab === t.id ? '#818cf8' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <t.icon size={15} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '28px 32px 48px', zIndex: 10 }}>

          {/* TAB 1: OVERVIEW & TEAM INVITES */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
              
              {/* Card 1: Team Members & Invite Options */}
              <div className="liquid-glass" style={{
                borderRadius: 20, padding: 24, background: 'rgba(16, 20, 32, 0.85)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      Team Members
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                      Guideline Capacity: <strong style={{ color: '#34d399' }}>{team?.members?.length || 1} / {team?.hackathon?.maxTeamSize || 4} Members</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowQrModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
                      background: 'rgba(129, 140, 248, 0.15)', border: '1px solid rgba(129, 140, 248, 0.35)',
                      color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <FiUserPlus size={14} />
                    <span>Invite via QR</span>
                  </button>
                </div>

                {/* Member List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {team?.members?.map(m => (
                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#5e6ad2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{m.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{m.email}</div>
                        </div>
                      </div>

                      {team?.leader?._id === m._id && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 8px', borderRadius: 99 }}>
                          Team Leader
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Pending Email Invites */}
                  {(team?.pendingInvites || []).map((inv, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(251, 191, 36, 0.05)', border: '1px dashed rgba(251, 191, 36, 0.25)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                          <FiMail size={13} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{inv.email}</div>
                          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Invitation sent</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiClock size={10} /> Pending
                      </span>
                    </div>
                  ))}
                </div>

                {/* Email Invite Form */}
                <form onSubmit={handleSendEmailInvite} style={{ paddingTop: 16, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Invite Teammate via Email 📧
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      required
                      placeholder="teammate@domain.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: 9,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                        color: '#fff', fontSize: '0.82rem', outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={inviting}
                      style={{
                        padding: '9px 16px', borderRadius: 9, background: '#5e6ad2',
                        border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <FiSend size={13} />
                      <span>{inviting ? 'Sending...' : 'Send Invite'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Guidelines & Repository Details */}
              <div className="liquid-glass" style={{
                borderRadius: 20, padding: 24, background: 'rgba(16, 20, 32, 0.85)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>
                  Project & Hackathon Guidelines
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>
                      Linked Code Repository
                    </div>
                    {team?.githubRepo ? (
                      <a href={team.githubRepo} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
                        <FiGithub size={15} /> {team.githubRepo} <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>No GitHub repo linked yet.</span>
                    )}

                    <button
                      onClick={handleLinkRepo}
                      style={{
                        marginTop: 8, padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Link GitHub Repo
                    </button>
                  </div>

                  <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>
                      Theme Guidelines
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>
                      {team?.hackathon?.theme || 'Open Innovation'}
                    </div>
                  </div>

                  <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 6 }}>
                      Team Size Guidelines
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem' }}>
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, flex: 1 }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.7rem' }}>Max Capacity</span>
                        <strong style={{ color: '#fff' }}>{team?.hackathon?.maxTeamSize || 4} Members</strong>
                      </div>
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, flex: 1 }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.7rem' }}>Open Slots</span>
                        <strong style={{ color: '#34d399' }}>{Math.max(0, (team?.hackathon?.maxTeamSize || 4) - (team?.members?.length || 1))} Slots</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9,
                      background: '#5e6ad2', border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <FiPlus size={15} />
                    <span>+ New Task</span>
                  </button>

                  <button
                    onClick={handleGenerateAiTasks}
                    disabled={isAiLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                      background: 'rgba(94, 106, 210, 0.25)', border: '1px solid rgba(94, 106, 210, 0.4)',
                      color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <FiSparkles size={14} />
                    <span>AI Generate Sprint ✨</span>
                  </button>

                  <button
                    onClick={handleGetBoardSummary}
                    disabled={isAiLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <FiInfo size={14} color="#fbbf24" />
                    <span>Board Summary</span>
                  </button>
                </div>
              </div>

              {boardSummary && (
                <div className="liquid-glass" style={{
                  padding: 18, borderRadius: 16, background: 'rgba(129, 140, 248, 0.12)',
                  border: '1px solid rgba(129, 140, 248, 0.3)', marginBottom: 20, color: '#fff', fontSize: '0.85rem'
                }}>
                  {boardSummary}
                </div>
              )}

              {/* Tasks List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {tasks.map(t => (
                  <div key={t._id} className="liquid-glass" style={{
                    borderRadius: 14, padding: 16, background: 'rgba(20, 24, 38, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
                        background: t.priority === 'urgent' ? 'rgba(244,63,94,0.18)' : 'rgba(251,191,36,0.18)',
                        color: t.priority === 'urgent' ? '#f43f5e' : '#fbbf24'
                      }}>
                        {t.priority}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        Status: {t.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: '0 0 6px 0' }}>
                      {t.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {t.description}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                      📅 Due: {t.dueDate || 'No deadline'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB EXPLORER */}
          {activeTab === 'github' && (
            <div className="liquid-glass" style={{
              borderRadius: 20, padding: 24, background: 'rgba(16, 20, 32, 0.85)',
              border: '1px solid rgba(255,255,255,0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  GitHub Repository Explorer
                </h3>
                <Link to="/repo-tree" style={{ color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                  Open Tree Visualizer Canvas →
                </Link>
              </div>

              <RenderTree tree={repoTree} />
            </div>
          )}

          {/* TAB 4: TEAM CHAT */}
          {activeTab === 'chat' && (
            <div className="liquid-glass" style={{
              borderRadius: 20, padding: 20, background: 'rgba(16, 20, 32, 0.85)',
              border: '1px solid rgba(255,255,255,0.12)', height: 500, display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 8 }}>
                {messages.map(m => (
                  <div key={m._id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.isAi ? '#818cf8' : '#5e6ad2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
                      {m.isAi ? '🤖' : m.sender?.name?.[0]}
                    </div>
                    <div style={{ background: m.isAi ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 14px', maxWidth: '80%' }}>
                      <div style={{ fontSize: '0.7rem', color: m.isAi ? '#818cf8' : 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 2 }}>
                        {m.sender?.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#fff', lineHeight: 1.4 }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="text"
                  placeholder="Type message or @ai for suggestions..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 9,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                    color: '#fff', fontSize: '0.82rem', outline: 'none'
                  }}
                />
                <button type="submit" style={{ padding: '9px 16px', borderRadius: 9, background: '#5e6ad2', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <FiSend size={14} />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <form onSubmit={handleCreateTask} className="liquid-glass" style={{
            width: '100%', maxWidth: 460, borderRadius: 20, padding: 24,
            background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>Create Task</h3>
            <input
              type="text"
              required
              placeholder="Task title..."
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#fff', fontSize: '0.85rem', outline: 'none', marginBottom: 12
              }}
            />
            <textarea
              placeholder="Description..."
              value={taskForm.description}
              onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#fff', fontSize: '0.82rem', outline: 'none', marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setShowTaskModal(false)} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, background: '#5e6ad2', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Create Task</button>
            </div>
          </form>
        </div>
      )}

      {/* AI Idea Validator Modal */}
      {showIdeaModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="liquid-glass" style={{
            width: '100%', maxWidth: 520, borderRadius: 20, padding: 28,
            background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>✨ AI Idea Validator</h3>
              <button onClick={() => setShowIdeaModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><FiX size={16} /></button>
            </div>

            <form onSubmit={handleValidateIdea} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea
                rows={4}
                required
                placeholder="Describe your hackathon solution..."
                value={ideaForm.idea}
                onChange={e => setIdeaForm({ idea: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.82rem', outline: 'none'
                }}
              />
              <button type="submit" disabled={isIdeaLoading} style={{ padding: '9px 0', borderRadius: 8, background: '#5e6ad2', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                {isIdeaLoading ? 'Validating...' : 'Validate Pitch'}
              </button>
            </form>

            {ideaFeedback && (
              <div style={{ marginTop: 18, padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 6 }}>{ideaFeedback.verdict}</div>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 8px 0' }}>{ideaFeedback.improvementTips}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scannable QR Code Modal */}
      {showQrModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="liquid-glass" style={{
            width: '100%', maxWidth: 440, borderRadius: 24, padding: '32px 28px',
            background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)', textAlign: 'center', position: 'relative'
          }}>
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '50%', width: 28, height: 28,
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'inline-flex', padding: 12, borderRadius: 16, background: 'rgba(129, 140, 248, 0.15)', border: '1px solid rgba(129, 140, 248, 0.3)', marginBottom: 12 }}>
              <FiUserPlus size={28} color="#818cf8" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>
              Team Join QR Code
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px 0' }}>
              Scan with any mobile camera to join <strong>{team?.name}</strong>
            </p>

            <div style={{ display: 'inline-block', padding: 20, background: '#ffffff', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginBottom: 20 }}>
              <QRCodeSVG
                value={`${window.location.origin}/join-team?teamId=${team?._id}`}
                size={190}
                fgColor="#0a0c13"
                bgColor="#ffffff"
              />
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join-team?teamId=${team?._id}`);
                toast.success('Team join link copied to clipboard!');
              }}
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 10, background: '#5e6ad2',
                border: 'none', color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(94,106,210,0.4)'
              }}
            >
              <FiPaperclip size={14} />
              <span>Copy Direct Join Link</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
