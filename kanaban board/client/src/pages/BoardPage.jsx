import { useState, useMemo, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Sparkles, FileText, Users, Activity, Search, ChevronLeft,
  ShieldAlert, MessageSquare, Trash2, Tag,
} from "lucide-react";
import { useBoard } from "../hooks/useBoard";
import { useAuth } from "../context/AuthContext";
import { useLayout } from "../components/layout/AppLayout";
import { aiApi, boardApi } from "../lib/api";
import { PRIORITIES } from "../lib/utils";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";

import Topbar from "../components/layout/Topbar";
import Button from "../components/ui/Button";
import { FilterSelect } from "../components/ui/Input";
import { AvatarStack } from "../components/ui/Avatar";
import { ColumnSkeleton } from "../components/ui/Skeleton";
import PromptDialog from "../components/ui/PromptDialog";
import ShortcutsHint from "../components/ui/ShortcutsHint";
import KanbanBoard from "../components/board/KanbanBoard";
import TaskModal from "../components/board/TaskModal";
import MembersModal from "../components/board/MembersModal";
import AIGenerateModal from "../components/ai/AIGenerateModal";
import AISummaryModal from "../components/ai/AISummaryModal";
import WorkloadModal from "../components/ai/WorkloadModal";
import BoardChatPanel from "../components/board/BoardChatPanel";
import ActivityFeed from "../components/ActivityFeed";

const BoardPage = () => {
  const { boardId } = useParams();
  const { openCreateBoard } = useLayout();
  const b = useBoard(boardId);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Board-level labels — start from board object, stay in sync via socket
  const [boardLabels, setBoardLabels] = useState([]);

  // Sync labels from the loaded board
  useMemo(() => {
    if (b.board?.labels) {
      setBoardLabels(b.board.labels);
    }
  }, [b.board]);

  const handleDeleteBoard = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this board and all associated tasks, columns, comments, chats, and notifications? This cannot be undone."
      )
    ) return;
    try {
      await boardApi.remove(boardId);
      toast.success("Board and all associated data deleted");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to delete board");
    }
  };

  const [taskModal, setTaskModal] = useState({ open: false, task: null, columnId: null });
  const [aiGen, setAiGen] = useState({ open: false, columnId: null });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [workloadOpen, setWorkloadOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [shortcutsVisible, setShortcutsVisible] = useState(false);

  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [search, setSearch] = useState("");

  const searchRef = useRef(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onNewTask: useCallback(() => {
      if (!taskModal.open) {
        setTaskModal({ open: true, task: null, columnId: b.columns[0]?.id });
      }
    }, [taskModal.open, b.columns]),
    onSearch: useCallback(() => {
      searchRef.current?.focus();
    }, []),
    onToggleHelp: useCallback(() => setShortcutsVisible((v) => !v), []),
    onEscape: useCallback(() => {
      if (taskModal.open) setTaskModal({ open: false, task: null, columnId: null });
      else if (summaryOpen) setSummaryOpen(false);
      else if (workloadOpen) setWorkloadOpen(false);
      else if (chatOpen) setChatOpen(false);
      else if (membersOpen) setMembersOpen(false);
      else if (activityOpen) setActivityOpen(false);
      else if (shortcutsVisible) setShortcutsVisible(false);
    }, [taskModal.open, summaryOpen, workloadOpen, chatOpen, membersOpen, activityOpen, shortcutsVisible]),
  });

  const filteredTasks = useMemo(() => {
    return b.tasks.filter((t) => {
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterAssignee && t.assignee_id !== filterAssignee) return false;
      if (filterLabel) {
        const ids = (t.label_ids || t.labelIds || []).map(String);
        if (!ids.includes(filterLabel)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.description || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [b.tasks, filterPriority, filterAssignee, filterLabel, search]);

  const handleBreakdown = async (task) => {
    try {
      const result = await aiApi.breakdown(boardId, { taskId: task.id });
      const newSubtasks = result?.subtasks ?? [];
      if (!newSubtasks.length) return toast.error("AI couldn't generate subtasks for this task");
      const existing = task.subtasks || [];
      const merged = [...existing, ...newSubtasks];
      await b.updateTask(task.id, { subtasks: merged });
      toast.success(`Added ${newSubtasks.length} subtask${newSubtasks.length !== 1 ? "s" : ""} to checklist`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const canManage = b.role === "owner" || b.role === "admin" || b.role === "editor";

  if (b.error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold">Couldn't load this board</p>
        <p className="text-muted">{b.error}</p>
        <Link to="/dashboard"><Button variant="outline">Back to dashboard</Button></Link>
      </div>
    );
  }

  // Build the presence list — always include the current user at minimum
  const viewerList = useMemo(() => {
    const live = b.presence || [];
    if (!user) return live;
    const currentId = user.id || user._id;
    const alreadyIn = live.some((u) => (u.id || u._id) === currentId);
    if (alreadyIn) return live;
    return [{ id: currentId, name: user.name, avatar_url: user.avatar_url }, ...live];
  }, [b.presence, user]);

  const hasActiveFilter = filterPriority || filterAssignee || filterLabel || search;

  const actions = (
    <div className="flex items-center gap-2">
      {/* Live presence */}
      <div className="mr-1 hidden items-center gap-2 sm:flex">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-faint">
            {viewerList.length > 1 ? `${viewerList.length} viewing` : "Viewing"}
          </span>
        </div>
        <AvatarStack users={viewerList} size="xs" max={4} />
      </div>

      <Button size="sm" variant="ghost" onClick={() => setChatOpen(true)} title="Board Chat & AI">
        <MessageSquare className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setActivityOpen(true)} title="Activity">
        <Activity className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setMembersOpen(true)} title="Members">
        <Users className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => setSummaryOpen(true)}>
        <FileText className="h-4 w-4" /> <span className="hidden lg:inline">Summary</span>
      </Button>
      {b.board && (b.role === "owner" || b.role === "admin") && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setWorkloadOpen(true)}
          className="border-brand-500/20 text-brand-600 hover:bg-brand-50"
        >
          <ShieldAlert className="h-4 w-4" /> <span className="hidden lg:inline">Analyze Workload</span>
        </Button>
      )}
      {b.board && b.role === "owner" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDeleteBoard}
          title="Delete Board"
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Button size="sm" onClick={() => setAiGen({ open: true, columnId: b.columns[0]?.id })}>
        <Sparkles className="h-4 w-4" /> <span className="hidden lg:inline">AI tasks</span>
      </Button>
    </div>
  );

  return (
    <>
      <Topbar
        title={
          <span className="flex items-center gap-2">
            <Link to="/dashboard" className="text-faint hover:text-ink md:hidden">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            {b.board ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.board.color }} />
                {b.board.title}
              </>
            ) : (
              "Loading…"
            )}
          </span>
        }
        subtitle={b.board?.description}
        actions={actions}
        onCreateBoard={openCreateBoard}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 px-6 py-3.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks  (/)"
            className="h-9 w-52 rounded-full border border-line bg-surface pl-9 pr-4 text-xs shadow-[var(--shadow-card)] outline-none transition-all duration-200 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>

        <FilterSelect value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </FilterSelect>

        <FilterSelect value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="">All assignees</option>
          {b.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </FilterSelect>

        {/* Label filter */}
        {boardLabels.length > 0 && (
          <FilterSelect
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
          >
            <option value="">All labels</option>
            {boardLabels.map((l) => (
              <option key={l.id || l._id} value={l.id || l._id}>
                {l.name}
              </option>
            ))}
          </FilterSelect>
        )}

        {hasActiveFilter && (
          <button
            onClick={() => { setFilterPriority(""); setFilterAssignee(""); setFilterLabel(""); setSearch(""); }}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-faint transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Clear
          </button>
        )}

        <span className="ml-auto rounded-full bg-surface-2 px-3 py-1 text-xs font-medium tabular text-muted">
          {filteredTasks.length} tasks
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden pt-4">
        {b.loading ? (
          <div className="flex gap-4 px-6">
            {[0, 1, 2, 3].map((i) => <ColumnSkeleton key={i} />)}
          </div>
        ) : (
          <KanbanBoard
            columns={b.columns}
            tasks={filteredTasks}
            actions={b}
            onTaskClick={(task) => setTaskModal({ open: true, task, columnId: task.column_id })}
            onAddTask={(columnId) => setTaskModal({ open: true, task: null, columnId })}
            onAiGenerate={(columnId) => setAiGen({ open: true, columnId })}
            onAddColumn={() => setAddColumnOpen(true)}
            boardLabels={boardLabels}
          />
        )}
      </div>

      {/* Modals */}
      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, columnId: null })}
        task={taskModal.task}
        defaultColumnId={taskModal.columnId}
        columns={b.columns}
        members={b.members}
        actions={b}
        onBreakdown={handleBreakdown}
        boardId={boardId}
        boardLabels={boardLabels}
        currentUser={user}
        onLabelsChange={setBoardLabels}
      />
      <AIGenerateModal
        open={aiGen.open}
        onClose={() => setAiGen({ open: false, columnId: null })}
        boardId={boardId}
        columns={b.columns}
        defaultColumnId={aiGen.columnId}
        onCreated={(tasks) => tasks.forEach(b.upsertTask)}
      />
      <AISummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} boardId={boardId} />
      <WorkloadModal open={workloadOpen} onClose={() => setWorkloadOpen(false)} boardId={boardId} />
      <MembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        boardId={boardId}
        members={b.members}
        setMembers={b.setMembers}
        canManage={canManage}
        ownerId={b.board?.owner_id}
      />
      <ActivityFeed open={activityOpen} onClose={() => setActivityOpen(false)} boardId={boardId} />
      <BoardChatPanel open={chatOpen} onClose={() => setChatOpen(false)} boardId={boardId} />
      <PromptDialog
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
        title="Add column"
        description="Give your new column a name."
        label="Column name"
        placeholder="e.g. Backlog"
        submitLabel="Add column"
        onSubmit={(name) => { b.addColumn(name); setAddColumnOpen(false); }}
      />

      {/* Keyboard shortcuts hint */}
      <ShortcutsHint visible={shortcutsVisible} onClose={() => setShortcutsVisible(false)} />
    </>
  );
};

export default BoardPage;
