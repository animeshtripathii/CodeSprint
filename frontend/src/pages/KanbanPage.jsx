import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Kanban,
  Plus,
  Search,
  Filter,
  Sparkles,
  Calendar,
  User,
  CheckSquare,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Activity,
  Users,
  PieChart,
  Bot,
  Send,
  X,
  PlusCircle,
  Brain,
  Scale
} from 'lucide-react';
import { DottedGlowBackground } from '../components/ui/dotted-glow-background';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import getSocket from '../services/socket';

const INITIAL_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#ffffff', bg: 'rgba(255, 255, 255, 0.1)' },
  { id: 'in_progress', title: 'In Progress', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
  { id: 'review', title: 'Under Review', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
  { id: 'done', title: 'Done', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' }
];

const INITIAL_MEMBERS = [
  { id: 'mem-1', name: 'Animesh Tripathi', email: 'animeshtripathi@gmail.com', role: 'Owner' },
  { id: 'mem-2', name: 'Rohan Sharma', email: 'rohan@dev.io', role: 'Developer' },
  { id: 'mem-3', name: 'Priya Verma', email: 'priya@design.io', role: 'UI Designer' }
];

const INITIAL_TASKS = [
  {
    id: 'task-1',
    title: 'Setup Frontend Architecture & Routing',
    description: 'Initialize Vite React project with glassmorphic UI system and router structure.',
    status: 'done',
    priority: 'high',
    assignee: 'Animesh Tripathi',
    dueDate: '2026-07-26',
    subtasks: [
      { id: 'st-1', title: 'Install Lucide React & Tailwind', done: true },
      { id: 'st-2', title: 'Configure Dotted Background', done: true }
    ]
  },
  {
    id: 'task-2',
    title: 'Multi-Role Custom Dashboards (Organizer, Participant, Judge)',
    description: 'Build high performance role dashboards with live evaluation metrics.',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Rohan Sharma',
    dueDate: '2026-07-27',
    subtasks: [
      { id: 'st-3', title: 'Organizer Hackathon Manager', done: true },
      { id: 'st-4', title: 'Judge Evaluation Console & Sparklines', done: true }
    ]
  },
  {
    id: 'task-3',
    title: 'AI Code Review & Pitch Evaluator Integration',
    description: 'Connect Gemini API endpoint for automated project code summary and pitch analysis.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Animesh Tripathi',
    dueDate: '2026-07-28',
    subtasks: [
      { id: 'st-5', title: 'Create backend route /api/ai/pitch-check', done: false }
    ]
  },
  {
    id: 'task-4',
    title: 'Judge Evaluation Scoring Form',
    description: 'Build scoring sliders for Innovation, Technical Execution, and Presentation.',
    status: 'review',
    priority: 'high',
    assignee: 'Priya Verma',
    dueDate: '2026-07-29',
    subtasks: [
      { id: 'st-6', title: 'Criteria rating component', done: true },
      { id: 'st-7', title: 'Feedback comments box', done: false }
    ]
  }
];

export default function KanbanPage() {
  const { user } = useAuth();

  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('codesprint_kanban_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [activities, setActivities] = useState([
    { id: 1, text: 'Animesh Tripathi moved Setup Frontend Architecture to Done', time: '10m ago' },
    { id: 2, text: 'Priya Verma created Judge Evaluation Scoring Form task', time: '1h ago' }
  ]);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'AI Assistant', isAi: true, text: 'Welcome to CodeSprint Sprint Kanban! Tag @ai to ask for suggestions or code reviews.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: 'Animesh Tripathi',
    dueDate: '',
    subtasks: []
  });

  // Feature Panels & Modals
  const [chatOpen, setChatOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [workloadOpen, setWorkloadOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');

  // AI Generator Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('codesprint_kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Real-time Socket.io synchronization across team members
  useEffect(() => {
    const socket = getSocket();
    const teamId = 'demo-team-room';
    socket.emit('joinTeam', teamId);

    const handleTaskCreated = (newTask) => {
      setTasks(prev => {
        if (prev.some(t => t.id === newTask.id || t.id === newTask._id)) return prev;
        return [newTask, ...prev];
      });
      logActivity(`Teammate added new task: "${newTask.title}"`);
      toast.success(`⚡ New task added: ${newTask.title}`, { style: { background: '#090a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' } });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks(prev => prev.map(t => (t.id === updatedTask.id || t.id === updatedTask._id) ? { ...t, ...updatedTask } : t));
      const colName = INITIAL_COLUMNS.find(c => c.id === updatedTask.status)?.title || updatedTask.status;
      logActivity(`Teammate moved task to ${colName}`);
      toast(`⚡ Task status updated to "${colName}"`, { icon: '🔄', style: { background: '#090a0f', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' } });
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t.id !== taskId && t._id !== taskId));
      logActivity(`Teammate deleted a task`);
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.emit('leaveTeam', teamId);
    };
  }, []);

  const logActivity = (actionText) => {
    setActivities(prev => [{ id: Date.now(), text: actionText, time: 'Just now' }, ...prev]);
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter;
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, priorityFilter, assigneeFilter]);

  // HTML5 Drag and Drop with Framer Motion Animation
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const taskObj = tasks.find(t => t.id === taskId);
    if (taskObj && taskObj.status !== targetStatus) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
      const colTitle = columns.find(c => c.id === targetStatus)?.title || targetStatus;
      toast.success(`Task moved to ${colTitle}`);
      logActivity(`${user?.name || 'User'} moved "${taskObj.title}" to ${colTitle}`);
    }
    setDraggedTaskId(null);
  };

  // Task Operations
  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskForm } : t));
      toast.success('Task updated successfully!');
      logActivity(`${user?.name || 'User'} updated task "${taskForm.title}"`);
    } else {
      const newTask = {
        id: 'task-' + Date.now(),
        ...taskForm,
        subtasks: taskForm.subtasks || []
      };
      setTasks(prev => [newTask, ...prev]);
      toast.success('New task created!');
      logActivity(`${user?.name || 'User'} created task "${taskForm.title}"`);
    }

    setTaskModalOpen(false);
    setEditingTask(null);
    setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', assignee: 'Animesh Tripathi', dueDate: '', subtasks: [] });
  };

  const handleDeleteTask = (taskId) => {
    const target = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Task deleted');
    if (target) logActivity(`${user?.name || 'User'} deleted task "${target.title}"`);
  };

  // AI Subtask Breakdown
  const handleAiSubtaskBreakdown = () => {
    if (!taskForm.title.trim()) return toast.error('Enter a task title first');
    
    const generatedSubtasks = [
      { id: 'st-gen-1', title: `Define specifications for ${taskForm.title}`, done: false },
      { id: 'st-gen-2', title: `Implement core logic for ${taskForm.title}`, done: false },
      { id: 'st-gen-3', title: `Test and handle edge cases`, done: false }
    ];

    setTaskForm(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), ...generatedSubtasks]
    }));
    toast.success('AI generated 3 subtasks!');
  };

  const handleAddSubtaskItem = () => {
    if (!newSubtaskInput.trim()) return;
    setTaskForm(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), { id: 'st-' + Date.now(), title: newSubtaskInput.trim(), done: false }]
    }));
    setNewSubtaskInput('');
  };

  const toggleSubtaskInModal = (subId) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s)
    }));
  };

  const toggleSubtaskOnCard = (taskId, subId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updatedSubtasks = (t.subtasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s);
      return { ...t, subtasks: updatedSubtasks };
    }));
  };

  // Column Add
  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    const newCol = {
      id: 'col-' + Date.now(),
      title: newColTitle.trim(),
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.12)'
    };
    setColumns(prev => [...prev, newCol]);
    setNewColTitle('');
    setAddColumnOpen(false);
    toast.success(`Column "${newCol.title}" created!`);
  };

  // AI Task Generation Assistant
  const handleGenerateAiTasks = async () => {
    if (!aiPrompt.trim()) return toast.error('Please enter a project prompt or feature goal');
    setAiLoading(true);
    try {
      const generated = [
        {
          id: 'task-ai-' + Date.now(),
          title: `Build API endpoint for ${aiPrompt.slice(0, 25)}`,
          description: `Create backend endpoints and controllers for ${aiPrompt}. Include validation & unit tests.`,
          status: 'todo',
          priority: 'high',
          assignee: 'Animesh Tripathi',
          dueDate: '2026-07-28',
          subtasks: [
            { id: 'st-ai-1', title: 'Design database schema', done: false },
            { id: 'st-ai-2', title: 'Write controller handler', done: false }
          ]
        },
        {
          id: 'task-ai-' + (Date.now() + 1),
          title: `Glassmorphic UI View for ${aiPrompt.slice(0, 25)}`,
          description: `Design interactive React UI component with glowing cards for ${aiPrompt}.`,
          status: 'todo',
          priority: 'medium',
          assignee: 'Priya Verma',
          dueDate: '2026-07-29',
          subtasks: [
            { id: 'st-ai-3', title: 'Create frontend component', done: false }
          ]
        }
      ];

      setTasks(prev => [...generated, ...prev]);
      toast.success('AI generated 2 new sprint tasks!');
      logActivity(`AI generated 2 sprint tasks for "${aiPrompt}"`);
      setAiModalOpen(false);
      setAiPrompt('');
    } catch (err) {
      toast.error('AI task generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  // Chat Send
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), sender: user?.name || 'Animesh', isAi: false, text: chatInput.trim() };
    const textLower = chatInput.toLowerCase();
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    if (textLower.includes('@ai')) {
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          sender: 'AI Assistant',
          isAi: true,
          text: `Analyzing team sprint board: You currently have ${tasks.filter(t => t.status === 'todo').length} pending tasks in To Do, and ${tasks.filter(t => t.status === 'done').length} completed tasks. Recommend focusing on high priority items!`
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }, 700);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return { bg: 'rgba(244, 63, 94, 0.18)', border: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e', label: '⚡ Urgent' };
      case 'high': return { bg: 'rgba(249, 115, 22, 0.18)', border: 'rgba(249, 115, 22, 0.4)', color: '#f97316', label: '🔥 High' };
      case 'medium': return { bg: 'rgba(251, 191, 36, 0.18)', border: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24', label: '🟡 Medium' };
      default: return { bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', label: '🔵 Low' };
    }
  };

  return (
    <div style={{ display: 'flex', background: '#050507', minHeight: '100vh', color: '#f0f2ff', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Background Glow */}
        <DottedGlowBackground gap={20} radius={1.8} opacity={0.65} color="rgba(255,255,255,0.15)" glowColor="rgba(255, 255, 255, 0.4)" speedMin={0.3} speedMax={1.4} />

        {/* Top Header & AI Power Bar */}
        <header style={{
          zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(12, 14, 22, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)' }}>
                <Kanban size={20} color="#ffffff" />
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Sprint Kanban Board
              </h1>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>
              Real-time team task management, AI sprint breakdown, and workload balancing.
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSummaryOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <PieChart size={14} color="#ffffff" />
              <span>AI Summary</span>
            </button>

            <button
              onClick={() => setWorkloadOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Scale size={14} color="#fbbf24" />
              <span>Workload</span>
            </button>

            <button
              onClick={() => setMembersOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Users size={14} color="#34d399" />
              <span>Members ({members.length})</span>
            </button>

            <button
              onClick={() => setActivityOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Activity size={14} color="#38bdf8" />
              <span>Activity</span>
            </button>

            <button
              onClick={() => setChatOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <MessageSquare size={14} />
              <span>Board Chat</span>
            </button>

            <button
              onClick={() => setAiModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9,
                background: '#ffffff', border: 'none', color: '#060709', fontSize: '0.78rem',
                fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)'
              }}
            >
              <Sparkles size={14} color="#060709" />
              <span>AI Task Generator</span>
            </button>
          </div>
        </header>

        {/* Toolbar: Search, Filters & Add Column */}
        <div style={{
          padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 14, zIndex: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, maxWidth: 320, display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12 }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '7px 12px 7px 34px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '0.8rem', outline: 'none'
                }}
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 9,
                background: 'rgba(16, 20, 32, 0.9)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">⚡ Urgent</option>
              <option value="high">🔥 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🔵 Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 9,
                background: 'rgba(16, 20, 32, 0.9)', border: '1px solid rgba(255,255,255,0.14)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="all">All Assignees</option>
              {members.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setAddColumnOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <PlusCircle size={14} color="#ffffff" />
              <span>+ Add Column</span>
            </button>

            <button
              onClick={() => {
                setEditingTask(null);
                setTaskForm({ title: '', description: '', status: columns[0]?.id || 'todo', priority: 'medium', assignee: 'Animesh Tripathi', dueDate: '', subtasks: [] });
                setTaskModalOpen(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9,
                background: '#ffffff', border: 'none', color: '#060709', fontSize: '0.78rem',
                fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,255,255,0.3)'
              }}
            >
              <Plus size={15} color="#060709" />
              <span>+ New Task</span>
            </button>
          </div>
        </div>

        {/* Kanban Board Columns Grid with Framer Motion Animations */}
        <div style={{
          flex: 1, padding: '24px 32px 32px', display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))`, gap: 20, zIndex: 10, overflowX: 'auto'
        }}>
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, col.id)}
                className="liquid-glass"
                style={{
                  borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column',
                  background: 'rgba(14, 18, 28, 0.65)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  minHeight: 520
                }}
              >
                {/* Column Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      {col.title}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, color: col.color,
                    background: col.bg, border: `1px solid ${col.color}40`,
                    padding: '2px 9px', borderRadius: 99
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Animated Tasks List Container */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                  <AnimatePresence>
                    {colTasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          padding: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)',
                          borderRadius: 12, color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem'
                        }}
                      >
                        Drop tasks here
                      </motion.div>
                    ) : (
                      colTasks.map(task => {
                        const pStyle = getPriorityStyle(task.priority);
                        const completedSub = (task.subtasks || []).filter(s => s.done).length;
                        const totalSub = (task.subtasks || []).length;

                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 15, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                            draggable
                            onDragStart={e => handleDragStart(e, task.id)}
                            style={{
                              background: 'rgba(20, 24, 38, 0.92)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
                              borderRadius: 14, padding: 14, cursor: 'grab', userSelect: 'none'
                            }}
                            whileHover={{ scale: 1.02, translateY: -2, borderColor: 'rgba(129, 140, 248, 0.5)' }}
                            whileTap={{ scale: 0.98, cursor: 'grabbing' }}
                          >
                            {/* Priority Tag & Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{
                                fontSize: '0.65rem', fontWeight: 700, color: pStyle.color,
                                background: pStyle.bg, border: `1px solid ${pStyle.border}`,
                                padding: '2px 8px', borderRadius: 99
                              }}>
                                {pStyle.label}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setTaskForm(task);
                                    setTaskModalOpen(true);
                                  }}
                                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 3 }}
                                  title="Edit Task"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 3 }}
                                  title="Delete Task"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Title */}
                            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                              {task.title}
                            </h4>

                            {/* Description */}
                            {task.description && (
                              <p style={{
                                fontSize: '0.76rem', color: 'rgba(255,255,255,0.55)', margin: '0 0 12px 0',
                                lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                              }}>
                                {task.description}
                              </p>
                            )}

                            {/* Subtasks Progress */}
                            {totalSub > 0 && (
                              <div style={{ marginBottom: 12, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                                  <span>Checklist</span>
                                  <span>{completedSub}/{totalSub}</span>
                                </div>
                                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${(completedSub / totalSub) * 100}%`, background: '#34d399', transition: 'width 0.2s' }} />
                                </div>

                                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {task.subtasks.map(st => (
                                    <div
                                      key={st.id}
                                      onClick={() => toggleSubtaskOnCard(task.id, st.id)}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem',
                                        color: st.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)',
                                        textDecoration: st.done ? 'line-through' : 'none', cursor: 'pointer'
                                      }}
                                    >
                                      <CheckSquare size={12} color={st.done ? '#34d399' : 'rgba(255,255,255,0.3)'} />
                                      <span>{st.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Footer: Due Date & Assignee */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              {task.dueDate ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                                  <Calendar size={12} color="rgba(255,255,255,0.5)" />
                                  <span>{task.dueDate}</span>
                                </div>
                              ) : <span />}

                              <div style={{
                                width: 22, height: 22, borderRadius: '50%', background: '#5e6ad2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 700, color: '#fff'
                              }} title={task.assignee}>
                                {task.assignee?.[0]?.toUpperCase() || 'A'}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* Task Create / Edit Modal */}
        {taskModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <form onSubmit={handleSaveTask} className="liquid-glass" style={{
              width: '100%', maxWidth: 520, borderRadius: 20, padding: 28,
              background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {editingTask ? 'Edit Task Details' : 'Create Sprint Task'}
                </h2>
                <button
                  onClick={() => handleAiSubtaskBreakdown()}
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(94, 106, 210, 0.2)', border: '1px solid rgba(94, 106, 210, 0.4)',
                    color: '#818cf8', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Brain size={13} />
                  <span>AI Breakdown</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement OAuth logic"
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                      color: '#fff', fontSize: '0.85rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add task details or requirements..."
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                      color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Assignee
                    </label>
                    <select
                      value={taskForm.assignee}
                      onChange={e => setTaskForm({ ...taskForm, assignee: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        background: 'rgba(16, 20, 32, 0.9)', border: '1px solid rgba(255,255,255,0.14)',
                        color: '#fff', fontSize: '0.8rem', outline: 'none'
                      }}
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        background: 'rgba(16, 20, 32, 0.9)', border: '1px solid rgba(255,255,255,0.14)',
                        color: '#fff', fontSize: '0.8rem', outline: 'none'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Subtask Checklist Manager */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Checklist Subtasks ({ (taskForm.subtasks || []).length })
                  </label>
                  
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Add subtask item..."
                      value={newSubtaskInput}
                      onChange={e => setNewSubtaskInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtaskItem(); } }}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: '0.78rem', outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtaskItem}
                      style={{ padding: '7px 12px', borderRadius: 6, background: '#5e6ad2', border: 'none', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                    {(taskForm.subtasks || []).map(st => (
                      <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => toggleSubtaskInModal(st.id)}>
                          <CheckSquare size={13} color={st.done ? '#34d399' : 'rgba(255,255,255,0.3)'} />
                          <span style={{ fontSize: '0.76rem', color: st.done ? 'rgba(255,255,255,0.4)' : '#fff', textDecoration: st.done ? 'line-through' : 'none' }}>
                            {st.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTaskForm(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== st.id) }))}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px', borderRadius: 8, background: '#5e6ad2',
                    border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Sprint Generator Modal */}
        {aiModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div className="liquid-glass" style={{
              width: '100%', maxWidth: 460, borderRadius: 20, padding: 28,
              background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={20} color="#818cf8" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  AI Task Assistant
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0' }}>
                Enter a feature goal or project prompt, and AI will generate structured Kanban tasks for your team.
              </p>

              <textarea
                rows={4}
                placeholder="e.g. Build an AI powered pitch deck validator for hackathons..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.82rem', outline: 'none', resize: 'vertical', marginBottom: 20
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleGenerateAiTasks}
                  disabled={aiLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 20px', borderRadius: 8, background: '#5e6ad2',
                    border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {aiLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
                  <span>{aiLoading ? 'Generating...' : 'Generate Tasks'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Board Summary Drawer / Modal */}
        {summaryOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div className="liquid-glass" style={{
              width: '100%', maxWidth: 500, borderRadius: 20, padding: 28,
              background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChart size={20} color="#818cf8" />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    AI Sprint Summary
                  </h2>
                </div>
                <button onClick={() => setSummaryOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20 }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  🚀 <strong>Sprint Progress:</strong> You have completed <strong>{tasks.filter(t => t.status === 'done').length}</strong> out of {tasks.length} tasks.
                </p>
                <p style={{ margin: '0 0 10px 0' }}>
                  ⚡ <strong>Bottlenecks:</strong> 1 task in <em>Under Review</em> requires code review.
                </p>
                <p style={{ margin: 0 }}>
                  💡 <strong>Recommendation:</strong> Allocate 1 team member to assist with the GitHub File Tree Canvas feature to meet tomorrow's deadline.
                </p>
              </div>

              <button
                onClick={() => setSummaryOpen(false)}
                style={{ width: '100%', padding: '9px 0', borderRadius: 8, background: '#5e6ad2', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Close Summary
              </button>
            </div>
          </div>
        )}

        {/* AI Workload Modal */}
        {workloadOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div className="liquid-glass" style={{
              width: '100%', maxWidth: 480, borderRadius: 20, padding: 28,
              background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Scale size={20} color="#fbbf24" />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Workload Balance
                  </h2>
                </div>
                <button onClick={() => setWorkloadOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {members.map(m => {
                  const count = tasks.filter(t => t.assignee === m.name).length;
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{m.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{m.role}</div>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: count > 2 ? '#f43f5e' : '#34d399' }}>
                        {count} Task{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setWorkloadOpen(false)}
                style={{ width: '100%', padding: '9px 0', borderRadius: 8, background: '#5e6ad2', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Close Workload
              </button>
            </div>
          </div>
        )}

        {/* Board Chat Slide-over Drawer */}
        {chatOpen && (
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, zIndex: 999,
            background: 'rgba(12, 14, 22, 0.96)', backdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '-20px 0 50px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                <MessageSquare size={16} color="#818cf8" />
                <span>Team Board Chat</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: msg.isAi ? '#818cf8' : '#5e6ad2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {msg.isAi ? <Bot size={13} /> : msg.sender[0]}
                  </div>
                  <div style={{
                    background: msg.isAi ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${msg.isAi ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '8px 12px', maxWidth: '85%'
                  }}>
                    <div style={{ fontSize: '0.68rem', color: msg.isAi ? '#ffffff' : 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 2 }}>
                      {msg.sender}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#fff', lineHeight: 1.4 }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Message team or @ai..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.8rem', outline: 'none'
                }}
              />
              <button type="submit" style={{ padding: '8px 14px', borderRadius: 8, background: '#5e6ad2', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Activity Feed Slide-over Drawer */}
        {activityOpen && (
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, zIndex: 999,
            background: 'rgba(12, 14, 22, 0.96)', backdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '-20px 0 50px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                <Activity size={16} color="#38bdf8" />
                <span>Sprint Activity Feed</span>
              </div>
              <button onClick={() => setActivityOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activities.map(act => (
                <div key={act.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                    {act.text}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                    {act.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Column Modal */}
        {addColumnOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <form onSubmit={handleAddColumn} className="liquid-glass" style={{
              width: '100%', maxWidth: 400, borderRadius: 20, padding: 24,
              background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 14px 0' }}>
                Add Custom Workflow Column
              </h2>
              <input
                type="text"
                required
                placeholder="e.g. QA Testing"
                value={newColTitle}
                onChange={e => setNewColTitle(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
                  color: '#fff', fontSize: '0.85rem', outline: 'none', marginBottom: 18
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setAddColumnOpen(false)} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: 8, background: '#5e6ad2', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                  Add Column
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members Modal */}
        {membersOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div className="liquid-glass" style={{
              width: '100%', maxWidth: 460, borderRadius: 20, padding: 24,
              background: 'rgba(16, 20, 32, 0.96)', border: '1px solid rgba(255,255,255,0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Sprint Team Members
                </h2>
                <button onClick={() => setMembersOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#5e6ad2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                        {m.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{m.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>{m.email}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#ffffff', background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: 99 }}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={() => setMembersOpen(false)} style={{ width: '100%', padding: '9px 0', borderRadius: 8, background: '#5e6ad2', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
