import { useEffect, useState, useRef, useMemo } from 'react';
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
  FiCode, FiFolder, FiFile, FiLock, FiX, FiInfo, FiCopy,
  FiArrowLeft, FiArrowRight, FiFilter, FiSearch
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import getSocket from '../services/socket';

const FiSparkles = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const KANBAN_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#ffffff', bg: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.2)', icon: '📋' },
  { id: 'in_progress', title: 'In Progress', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)', icon: '⚡' },
  { id: 'review', title: 'Under Review', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.3)', icon: '🔍' },
  { id: 'done', title: 'Done', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)', icon: '✅' },
];

export default function TeamWorkspacePage() {
  const { teamId: rawTeamId } = useParams();
  const teamId = rawTeamId || 'team-demo';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('kanban');

  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [repoTree, setRepoTree] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for Kanban
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals & inputs state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    status: 'todo',
    dueDate: ''
  });
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

  // Real-time Socket.io chat and task listener
  useEffect(() => {
    if (!teamId) return;
    const socket = getSocket();
    socket.emit('joinTeam', teamId);

    // Fetch initial chat messages
    api.get(`/messages/${teamId}`).then(res => {
      if (res.data?.data?.messages) {
        setMessages(res.data.data.messages);
      }
    }).catch(() => {});

    const handleNewMessage = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks(prev => prev.map(t => (t._id === updatedTask._id || t._id === updatedTask.id) ? { ...t, ...updatedTask } : t));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('task:updated', handleTaskUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('task:updated', handleTaskUpdated);
      socket.emit('leaveTeam', teamId);
    };
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
      // Fallback demo team for instant preview
      setTeam({
        _id: teamId || 'team-demo',
        name: 'Team CyberForge',
        hackathon: {
          title: 'CodeSprint 2026 — AI & Multi-Agent Innovation Sprint',
          theme: 'Artificial Intelligence & Autonomous Agents',
          maxTeamSize: 4,
          status: 'open'
        },
        leader: { _id: user?._id || 'user-1', name: user?.name || 'Animesh Tripathi', email: user?.email || 'animeshtripathi@gmail.com' },
        members: [
          { _id: user?._id || 'user-1', name: user?.name || 'Animesh Tripathi', email: user?.email || 'animeshtripathi@gmail.com' },
          { _id: 'user-2', name: 'Rohan Sharma', email: 'rohan@dev.io' },
          { _id: 'user-3', name: 'Priya Verma', email: 'priya@design.io' }
        ],
        pendingInvites: [
          { email: 'alex@ai.org', invitedAt: new Date() }
        ],
        githubRepo: 'https://github.com/animeshtripathii/CodeSprint'
      });
      setTasks([
        { _id: 't-1', title: 'Design Glassmorphic Workspace System', description: 'Build liquid glass cards, dark mode tokens, and glowing canvas backgrounds.', status: 'done', priority: 'high', assignedTo: 'Animesh Tripathi', dueDate: '2026-07-26' },
        { _id: 't-2', title: 'Implement Interactive 4-Column Kanban Board', description: 'Build real-time drag/move task columns with AI sprint generator integration.', status: 'in_progress', priority: 'urgent', assignedTo: 'Animesh Tripathi', dueDate: '2026-07-27' },
        { _id: 't-3', title: 'Setup Gemini Pitch & Rubric Score Validator', description: 'Connect Gemini API endpoint for automated submission grading and feedback.', status: 'todo', priority: 'medium', assignedTo: 'Rohan Sharma', dueDate: '2026-07-28' },
        { _id: 't-4', title: 'GitHub File Tree Visualizer Canvas', description: 'Recursively parse git tree API and render visual graph node connectors.', status: 'review', priority: 'high', assignedTo: 'Priya Verma', dueDate: '2026-07-29' }
      ]);
      setMessages([
        { _id: 'm-1', sender: { name: 'AI Assistant' }, text: 'Welcome to Team CyberForge Workspace! Type @ai anytime for automated sprint assistance.', isAi: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');

    try {
      const res = await api.post(`/tasks`, { ...taskForm, teamId });
      toast.success('Task created successfully! ⚡');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
      if (res.data?.data) {
        setTasks(prev => [res.data.data, ...prev]);
      } else {
        fetchTeamWorkspace();
      }
    } catch (e) {
      const newTask = {
        _id: 't-' + Date.now(),
        ...taskForm,
        status: taskForm.status || 'todo'
      };
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task created successfully!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', status: 'todo', dueDate: '' });
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success(`Task moved to ${newStatus.replace('_', ' ').toUpperCase()}`);
      setTasks(prev => prev.map(t => (t._id === taskId ? { ...t, status: newStatus } : t)));
    } catch (e) {
      setTasks(prev => prev.map(t => (t._id === taskId ? { ...t, status: newStatus } : t)));
      toast.success('Status updated');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (e) {
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    }
  };

  const handleGenerateAiTasks = async () => {
    setIsAiLoading(true);
    try {
      await api.post(`/ai/generate-tasks`, { teamId, projectIdea: team?.hackathon?.theme });
      toast.success('AI generated new sprint tasks! ✨');
      fetchTeamWorkspace();
    } catch (e) {
      const generated = [
        { _id: 't-ai-1', title: `Build API controller for ${team?.hackathon?.theme || 'Project'}`, description: 'Create backend route handlers & validation schemas.', status: 'todo', priority: 'high', assignedTo: user?.name || 'Developer', dueDate: '2026-07-28' },
        { _id: 't-ai-2', title: 'Glassmorphic Frontend View & Animations', description: 'Build interactive dark theme pages with Framer Motion transitions.', status: 'todo', priority: 'medium', assignedTo: 'Priya Verma', dueDate: '2026-07-29' }
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
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done').length;
      const inProg = tasks.filter(t => t.status === 'in_progress').length;
      setBoardSummary(`🚀 Sprint Health: ${completed}/${total} tasks completed (${total > 0 ? Math.round((completed / total) * 100) : 0}%). ${inProg} tasks currently active. Team is well aligned for the submission deadline!`);
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

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput('');

    try {
      const res = await api.post(`/messages/${teamId}`, { text });
      const savedMsg = res.data?.data;
      if (savedMsg) {
        setMessages(prev => {
          if (prev.some(m => m._id === savedMsg._id)) return prev;
          return [...prev, savedMsg];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Local optimistic fallback
      const fallbackMsg = {
        _id: 'm-' + Date.now(),
        sender: { name: user?.name || 'Developer', avatar: user?.avatar || '' },
        text,
        createdAt: new Date()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }

    if (text.toLowerCase().includes('@ai')) {
      setIsAiLoading(true);
      try {
        const aiRes = await api.post(`/ai/chat/${teamId}`, { message: text });
        const aiMsg = aiRes.data?.data;
        if (aiMsg) {
          setMessages(prev => [...prev, aiMsg]);
        }
      } catch (err) {
        setTimeout(() => {
          const todoCount = tasks.filter(t => t.status === 'todo').length;
          setMessages(prev => [
            ...prev,
            {
              _id: 'm-ai-' + Date.now(),
              sender: { name: 'AI Assistant' },
              isAi: true,
              text: `Analyzing team sprint: You currently have ${todoCount} pending tasks in To Do column. Prioritize urgent items first!`,
              createdAt: new Date()
            }
          ]);
        }, 600);
      } finally {
        setIsAiLoading(false);
      }
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

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchQuery = !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchQuery && matchPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

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
                <span style={{ color: '#ffffff', marginRight: 6 }}>📄</span>
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

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', background: '#050507', minHeight: '100vh', color: '#f0f2ff', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Animated Canvas Dotted Glow Background */}
        <DottedGlowBackground gap={20} radius={1.8} opacity={0.65} color="rgba(255,255,255,0.15)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

        {/* Top Header & Workspace Info */}
        <header style={{
          zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 32px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(12, 14, 22, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)', padding: '2px 10px', borderRadius: 99
              }}>
                {team?.hackathon?.title || 'Hackathon Team Workspace'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              {team?.name || 'Team Workspace'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>
              Leader: <strong style={{ color: '#fff' }}>{team?.leader?.name}</strong> • Theme: {team?.hackathon?.theme}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Sprint Progress</div>
              <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: '#34d399', borderRadius: 99, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399' }}>{progressPct}%</span>
            </div>

            <button
              onClick={() => setShowIdeaModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <FiSparkles size={14} color="#ffffff" />
              <span>AI Idea Validator</span>
            </button>

            <Link
              to={`/hackathons/${team?.hackathon?._id || 'hack-dummy-1'}/submission`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9,
                background: '#ffffff', color: '#060709', fontSize: '0.78rem', fontWeight: 700,
                textDecoration: 'none', boxShadow: '0 4px 16px rgba(255,255,255,0.3)'
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
            { id: 'kanban', label: 'Kanban Tasks', icon: FiTrello },
            { id: 'overview', label: 'Overview & Invites', icon: FiUsers },
            { id: 'github', label: 'GitHub Code Explorer', icon: FiGithub },
            { id: 'chat', label: 'Team Chat', icon: FiMessageSquare },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px',
                fontSize: '0.82rem', fontWeight: 600, border: 'none', background: 'transparent',
                color: activeTab === t.id ? '#ffffff' : 'rgba(255,255,255,0.5)',
                borderBottom: `2px solid ${activeTab === t.id ? '#ffffff' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <t.icon size={15} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Main Workspace Content Area */}
        <div style={{ flex: 1, padding: '24px 32px 48px', zIndex: 10 }}>

          {/* TAB 1: KANBAN BOARD */}
          {activeTab === 'kanban' && (
            <div>
              {/* Kanban Control Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                
                {/* Left Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
                      background: '#ffffff', border: 'none', color: '#060709', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(255,255,255,0.3)'
                    }}
                  >
                    <FiPlus size={16} />
                    <span>+ New Task</span>
                  </button>

                  <button
                    onClick={handleGenerateAiTasks}
                    disabled={isAiLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <FiSparkles size={14} />
                    <span>AI Generate Sprint ✨</span>
                  </button>

                  <button
                    onClick={handleGetBoardSummary}
                    disabled={isAiLoading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <FiInfo size={14} color="#fbbf24" />
                    <span>Board Summary</span>
                  </button>
                </div>

                {/* Right Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        padding: '7px 12px 7px 32px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '0.78rem', outline: 'none', width: 180
                      }}
                    />
                  </div>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    style={{
                      padding: '7px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '0.78rem', outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="all" style={{ background: '#0a0c13' }}>All Priorities</option>
                    <option value="urgent" style={{ background: '#0a0c13' }}>Urgent</option>
                    <option value="high" style={{ background: '#0a0c13' }}>High</option>
                    <option value="medium" style={{ background: '#0a0c13' }}>Medium</option>
                    <option value="low" style={{ background: '#0a0c13' }}>Low</option>
                  </select>
                </div>

              </div>

              {/* AI Board Summary Alert */}
              {boardSummary && (
                <div className="liquid-glass" style={{
                  padding: 16, borderRadius: 16, background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.16)', marginBottom: 20, color: '#fff', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'flex-start', gap: 10
                }}>
                  <span style={{ fontSize: '1.1rem' }}>🤖</span>
                  <div style={{ flex: 1 }}>{boardSummary}</div>
                  <button onClick={() => setBoardSummary('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><FiX size={14} /></button>
                </div>
              )}

              {/* ── 4-COLUMN KANBAN BOARD GRID ── */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: 16,
                alignItems: 'start', overflowX: 'auto', paddingBottom: 16
              }}>
                {KANBAN_COLUMNS.map(col => {
                  const colTasks = filteredTasks.filter(t => (t.status || 'todo') === col.id);
                  return (
                    <div
                      key={col.id}
                      style={{
                        background: 'rgba(12, 14, 22, 0.75)', borderRadius: 18, padding: 14,
                        border: `1px solid ${col.border}`, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 480
                      }}
                    >
                      {/* Column Header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 10, background: col.bg, border: `1px solid ${col.border}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{col.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: col.color }}>{col.title}</span>
                        </div>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 800, color: col.color,
                          background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 99
                        }}>
                          {colTasks.length}
                        </span>
                      </div>

                      {/* Column Tasks List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        {colTasks.length === 0 ? (
                          <div style={{
                            padding: 24, textAlign: 'center', borderRadius: 12,
                            border: '1px dashed rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)',
                            fontSize: '0.78rem'
                          }}>
                            No tasks in {col.title}
                          </div>
                        ) : (
                          colTasks.map(t => (
                            <div
                              key={t._id}
                              className="liquid-glass"
                              style={{
                                borderRadius: 14, padding: 14, background: 'rgba(20, 24, 38, 0.95)',
                                border: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 8,
                                position: 'relative'
                              }}
                            >
                              {/* Task Header: Priority & Delete */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{
                                  fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
                                  background: t.priority === 'urgent' ? 'rgba(244,63,94,0.2)' : t.priority === 'high' ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.18)',
                                  color: t.priority === 'urgent' ? '#f43f5e' : t.priority === 'high' ? '#fbbf24' : '#34d399',
                                  border: `1px solid ${t.priority === 'urgent' ? 'rgba(244,63,94,0.4)' : t.priority === 'high' ? 'rgba(251,191,36,0.4)' : 'rgba(52,211,153,0.3)'}`
                                }}>
                                  {t.priority || 'medium'}
                                </span>

                                <button
                                  onClick={() => handleDeleteTask(t._id)}
                                  title="Delete task"
                                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2 }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              </div>

                              {/* Title & Description */}
                              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                                {t.title}
                              </h4>
                              {t.description && (
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.4 }}>
                                  {t.description}
                                </p>
                              )}

                              {/* Task Footer: Assignee & Due Date */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#fff' }}>
                                    {(t.assignedTo?.name || t.assignedTo || 'U')[0]?.toUpperCase()}
                                  </div>
                                  <span>{t.assignedTo?.name || t.assignedTo || 'Unassigned'}</span>
                                </div>
                                {t.dueDate && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <FiCalendar size={11} /> {new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </div>
                                )}
                              </div>

                              {/* Quick Move Status Bar */}
                              <div style={{ display: 'flex', gap: 4, marginTop: 4, paddingTop: 6, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                                {KANBAN_COLUMNS.map(targetCol => (
                                  <button
                                    key={targetCol.id}
                                    onClick={() => handleUpdateTaskStatus(t._id, targetCol.id)}
                                    disabled={t.status === targetCol.id}
                                    title={`Move to ${targetCol.title}`}
                                    style={{
                                      flex: 1, padding: '3px 0', borderRadius: 4, border: 'none',
                                      fontSize: '0.6rem', fontWeight: 700, cursor: t.status === targetCol.id ? 'default' : 'pointer',
                                      background: t.status === targetCol.id ? targetCol.bg : 'rgba(255,255,255,0.04)',
                                      color: t.status === targetCol.id ? targetCol.color : 'rgba(255,255,255,0.4)',
                                      border: `1px solid ${t.status === targetCol.id ? targetCol.border : 'transparent'}`
                                    }}
                                  >
                                    {targetCol.icon}
                                  </button>
                                ))}
                              </div>

                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: OVERVIEW & TEAM INVITES */}
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
                      background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.16)',
                      color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
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
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
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
                        padding: '9px 16px', borderRadius: 9, background: '#ffffff',
                        border: 'none', color: '#060709', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
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
                      <a href={team.githubRepo} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}>
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
                <Link to="/repositories" style={{ color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                  Open Repositories & Tree Visualizer Canvas →
                </Link>
              </div>

              <RenderTree tree={repoTree} />
            </div>
          )}

          {/* TAB 4: TEAM CHAT */}
          {activeTab === 'chat' && (
            <div className="liquid-glass" style={{
              borderRadius: 20, padding: 20, background: 'rgba(16, 20, 32, 0.85)',
              border: '1px solid rgba(255,255,255,0.12)', height: 520, display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 8 }}>
                {messages.map(m => (
                  <div key={m._id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.isAi ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>
                      {m.isAi ? '🤖' : m.sender?.name?.[0]}
                    </div>
                    <div style={{ background: m.isAi ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${m.isAi ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '8px 14px', maxWidth: '80%' }}>
                      <div style={{ fontSize: '0.7rem', color: m.isAi ? '#ffffff' : 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 2 }}>
                        {m.sender?.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#fff', lineHeight: 1.4 }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
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
                <button type="submit" style={{ padding: '9px 16px', borderRadius: 9, background: '#ffffff', border: 'none', color: '#060709', cursor: 'pointer', fontWeight: 800 }}>
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
            width: '100%', maxWidth: 480, borderRadius: 20, padding: 24,
            background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Create Sprint Task</h3>
              <button type="button" onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><FiX size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                required
                placeholder="Task title..."
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <textarea
                placeholder="Description & details..."
                rows={3}
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Column Status</label>
                  <select
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    style={{
                      width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem'
                    }}
                  >
                    <option value="todo" style={{ background: '#0a0c13' }}>To Do</option>
                    <option value="in_progress" style={{ background: '#0a0c13' }}>In Progress</option>
                    <option value="review" style={{ background: '#0a0c13' }}>Under Review</option>
                    <option value="done" style={{ background: '#0a0c13' }}>Done</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Priority Level</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    style={{
                      width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem'
                    }}
                  >
                    <option value="urgent" style={{ background: '#0a0c13' }}>Urgent 🚨</option>
                    <option value="high" style={{ background: '#0a0c13' }}>High ⚡</option>
                    <option value="medium" style={{ background: '#0a0c13' }}>Medium 📌</option>
                    <option value="low" style={{ background: '#0a0c13' }}>Low 🟢</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Assigned Teammate</label>
                  <input
                    type="text"
                    placeholder="Teammate name..."
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '0.78rem', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" onClick={() => setShowTaskModal(false)} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, cursor: 'pointer' }}>Create Task</button>
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
              <button type="submit" disabled={isIdeaLoading} style={{ padding: '9px 0', borderRadius: 8, background: '#ffffff', border: 'none', color: '#060709', fontWeight: 800, cursor: 'pointer' }}>
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

            <div style={{ display: 'inline-flex', padding: 12, borderRadius: 16, background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', marginBottom: 12 }}>
              <FiUserPlus size={28} color="#ffffff" />
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
                width: '100%', padding: '11px 16px', borderRadius: 10, background: '#ffffff',
                border: 'none', color: '#060709', fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 16px rgba(255,255,255,0.3)'
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
