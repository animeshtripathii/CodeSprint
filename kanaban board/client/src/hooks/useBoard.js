import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { boardApi, taskApi, columnApi, mapKeys, toSnakeCase } from "../lib/api";
import { connectSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

/**
 * Loads a board and keeps it in sync via Socket.IO. Returns board state plus
 * mutation helpers that update optimistically and persist to the API.
 */
export const useBoard = (boardId) => {
  const { user: currentUser } = useAuth();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [presence, setPresence] = useState([]);

  const upsertTask = useCallback((task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx === -1) return [...prev, task];
      const next = [...prev];
      next[idx] = task;
      return next;
    });
  }, []);

  const removeTaskLocal = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Reload the full board from the server (used after bulk operations)
  const reloadBoard = useCallback(() => {
    boardApi.get(boardId).then((data) => {
      setBoard(data.board);
      setColumns(data.columns);
      setTasks(data.tasks);
      setMembers(data.members);
      setRole(data.role);
    }).catch(() => {/* silent reload failure */});
  }, [boardId]);

  // Initial load
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    boardApi
      .get(boardId)
      .then((data) => {
        if (!alive) return;
        setBoard(data.board);
        setColumns(data.columns);
        setTasks(data.tasks);
        setMembers(data.members);
        setRole(data.role);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [boardId]);

  // Real-time sync via Socket.IO
  useEffect(() => {
    const socket = connectSocket();

    // Join the board room and announce presence with the authenticated user
    const presenceUser = currentUser
      ? { id: currentUser.id || currentUser._id, name: currentUser.name, avatar_url: currentUser.avatar_url }
      : null;

    socket.emit("board:join", { boardId, user: presenceUser });

    const mapSocketData = (obj) => mapKeys(obj, toSnakeCase);

    // ── Task events ──────────────────────────────────────────────────────────
    const onTaskCreated = (t) => upsertTask(mapSocketData(t));
    const onTaskUpdated = (t) => upsertTask(mapSocketData(t));
    const onTaskMoved   = (t) => upsertTask(mapSocketData(t));
    const onTaskDeleted = ({ taskId }) => removeTaskLocal(taskId);

    // ── Column events ────────────────────────────────────────────────────────
    const onColCreated = (c) =>
      setColumns((p) => [...p, mapSocketData(c)].sort((a, b) => a.position - b.position));

    const onColUpdated = (c) => {
      const mapped = mapSocketData(c);
      setColumns((p) =>
        p.map((x) => (x.id === mapped.id ? mapped : x)).sort((a, b) => a.position - b.position)
      );
    };

    // Backend emits { columnId, id } — support both field names
    const onColDeleted = ({ columnId, id }) => {
      const deletedId = columnId || id;
      setColumns((p) => p.filter((x) => x.id !== deletedId));
      setTasks((p) => p.filter((t) => t.column_id !== deletedId));
    };

    // ── Board events ─────────────────────────────────────────────────────────
    const onBoardUpdated = (b) => setBoard(mapSocketData(b));

    // board:renamed — emitted when title/description changes
    const onBoardRenamed = ({ boardId: bid, title }) => {
      if (bid === boardId) {
        setBoard((prev) => prev ? { ...prev, title } : prev);
      }
    };

    // board:reloaded — emitted after bulk-import operations
    const onBoardReloaded = ({ boardId: bid }) => {
      if (bid === boardId) reloadBoard();
    };

    // board:deleted — emitted when the board is deleted by the owner
    const onBoardDeleted = ({ boardId: bid }) => {
      if (bid === boardId) {
        setError("This board has been deleted by the owner.");
        toast.error("This board has been deleted by the owner.");
      }
    };

    // ── Presence events ──────────────────────────────────────────────────────
    // Backend emits presence:sync with { users: [...] }
    const onPresenceSync = ({ users }) => setPresence(users || []);

    socket.on("task:created",   onTaskCreated);
    socket.on("task:updated",   onTaskUpdated);
    socket.on("task:moved",     onTaskMoved);
    socket.on("task:deleted",   onTaskDeleted);
    socket.on("column:created", onColCreated);
    socket.on("column:updated", onColUpdated);
    socket.on("column:renamed", onColUpdated); // backend also emits column:renamed
    socket.on("column:reordered", onColUpdated);
    socket.on("column:deleted", onColDeleted);
    socket.on("board:updated",  onBoardUpdated);
    socket.on("board:renamed",  onBoardRenamed);
    socket.on("board:reloaded", onBoardReloaded);
    socket.on("board:deleted",  onBoardDeleted);
    socket.on("presence:sync",  onPresenceSync);

    return () => {
      socket.emit("board:leave", boardId);
      socket.off("task:created",    onTaskCreated);
      socket.off("task:updated",    onTaskUpdated);
      socket.off("task:moved",      onTaskMoved);
      socket.off("task:deleted",    onTaskDeleted);
      socket.off("column:created",  onColCreated);
      socket.off("column:updated",  onColUpdated);
      socket.off("column:renamed",  onColUpdated);
      socket.off("column:reordered", onColUpdated);
      socket.off("column:deleted",  onColDeleted);
      socket.off("board:updated",   onBoardUpdated);
      socket.off("board:renamed",   onBoardRenamed);
      socket.off("board:reloaded",  onBoardReloaded);
      socket.off("board:deleted",   onBoardDeleted);
      socket.off("presence:sync",   onPresenceSync);
      setPresence([]);
    };
  }, [boardId, upsertTask, removeTaskLocal, reloadBoard]);

  // Re-announce presence when the authenticated user resolves
  // (auth may load after the socket effect fires on first render)
  useEffect(() => {
    if (!currentUser || !boardId) return;
    const socket = connectSocket();
    const presenceUser = {
      id: currentUser.id || currentUser._id,
      name: currentUser.name,
      avatar_url: currentUser.avatar_url,
    };
    socket.emit("board:join", { boardId, user: presenceUser });
  }, [currentUser, boardId]);

  /* ──────────────────────────── mutations ──────────────────────────────── */

  const createTask = useCallback(
    async (data) => {
      try {
        const task = await taskApi.create(boardId, data);
        upsertTask(task);
        return task;
      } catch (err) {
        toast.error(err.message);
        throw err;
      }
    },
    [boardId, upsertTask]
  );

  const updateTask = useCallback(
    async (taskId, data) => {
      const prev = tasks.find((t) => t.id === taskId);
      upsertTask({ ...prev, ...data }); // optimistic
      try {
        const task = await taskApi.update(boardId, taskId, data);
        upsertTask(task);
        return task;
      } catch (err) {
        if (prev) upsertTask(prev);
        toast.error(err.message);
        throw err;
      }
    },
    [boardId, tasks, upsertTask]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      const prev = tasks.find((t) => t.id === taskId);
      removeTaskLocal(taskId); // optimistic
      try {
        await taskApi.remove(boardId, taskId);
        toast.success("Task deleted");
      } catch (err) {
        if (prev) upsertTask(prev);
        toast.error(err.message);
      }
    },
    [boardId, tasks, removeTaskLocal, upsertTask]
  );

  // Apply a local move immediately, then persist.
  const moveTask = useCallback(
    async (taskId, columnId, position) => {
      const prev = tasks.find((t) => t.id === taskId);
      if (!prev) return;
      upsertTask({ ...prev, column_id: columnId, position });
      try {
        await taskApi.move(boardId, taskId, { column_id: columnId, position });
      } catch (err) {
        upsertTask(prev);
        toast.error(err.message);
      }
    },
    [boardId, tasks, upsertTask]
  );

  const addColumn = useCallback(
    async (title) => {
      try {
        const col = await columnApi.create(boardId, { title });
        setColumns((p) => [...p, col].sort((a, b) => a.position - b.position));
      } catch (err) {
        toast.error(err.message);
      }
    },
    [boardId]
  );

  const renameColumn = useCallback(
    async (columnId, title) => {
      setColumns((p) => p.map((c) => (c.id === columnId ? { ...c, title } : c)));
      try {
        await columnApi.update(boardId, columnId, { title });
      } catch (err) {
        toast.error(err.message);
      }
    },
    [boardId]
  );

  const deleteColumn = useCallback(
    async (columnId) => {
      try {
        await columnApi.remove(boardId, columnId);
        setColumns((p) => p.filter((c) => c.id !== columnId));
        setTasks((p) => p.filter((t) => t.column_id !== columnId));
      } catch (err) {
        toast.error(err.message);
      }
    },
    [boardId]
  );

  return {
    board, columns, tasks, members, role, loading, error, presence,
    setBoard, setMembers,
    createTask, updateTask, deleteTask, moveTask, upsertTask,
    addColumn, renameColumn, deleteColumn,
  };
};
