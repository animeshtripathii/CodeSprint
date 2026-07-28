import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { boardApi } from "../lib/api";

const BoardsContext = createContext(null);

export const BoardsProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await boardApi.list();
      setBoards(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail — user will see empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (data) => {
    const board = await boardApi.create(data);
    // Do a full refresh so task_count / member_count are accurate for ALL boards
    refresh();
    return board;
  }, [refresh]);

  const remove = useCallback(async (id) => {
    await boardApi.remove(id);
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Update a single board in state (e.g. after rename)
  const updateBoard = useCallback((updated) => {
    setBoards((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
  }, []);

  return (
    <BoardsContext.Provider value={{ boards, loading, refresh, create, remove, updateBoard }}>
      {children}
    </BoardsContext.Provider>
  );
};

export const useBoards = () => {
  const ctx = useContext(BoardsContext);
  if (!ctx) throw new Error("useBoards must be used within BoardsProvider");
  return ctx;
};
