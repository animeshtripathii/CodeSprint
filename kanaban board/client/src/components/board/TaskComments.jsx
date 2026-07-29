import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { commentApi } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import Avatar from "../ui/Avatar";
import { relativeTime } from "../../lib/utils";

/**
 * TaskComments — thread of comments for a task, with real-time socket sync.
 * Props:
 *   taskId   string
 *   currentUser { id, name, avatar_url }
 */
const TaskComments = ({ taskId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const data = await commentApi.list(taskId);
      setComments(data || []);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Real-time socket sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onCreated = (comment) => {
      if ((comment.task_id || comment.taskId)?.toString() !== taskId?.toString()) return;
      setComments((prev) => {
        const id = comment._id || comment.id;
        if (prev.some((c) => (c._id || c.id) === id)) return prev;
        return [...prev, comment];
      });
    };

    const onDeleted = ({ commentId, taskId: tid }) => {
      if (tid?.toString() !== taskId?.toString()) return;
      setComments((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
    };

    socket.on("comment:created", onCreated);
    socket.on("comment:deleted", onDeleted);
    return () => {
      socket.off("comment:created", onCreated);
      socket.off("comment:deleted", onDeleted);
    };
  }, [taskId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await commentApi.create(taskId, text.trim());
      setText("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentApi.remove(commentId);
      // Optimistic remove (socket event also removes)
      setComments((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-muted uppercase tracking-[0.07em]">
          Comments
        </label>
        {comments.length > 0 && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold tabular text-faint">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-faint" />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-line py-5 text-center">
          <MessageCircle className="h-5 w-5 text-faint" />
          <p className="text-xs text-faint">No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="max-h-48 space-y-3 overflow-y-auto pr-0.5">
          {comments.map((c) => {
            const id = c._id || c.id;
            const user = c.user_id || c.userId || {};
            const userName = user.name || "Unknown";
            const userAvatar = user.avatar_url || user.avatarUrl;
            const userId = user._id || user.id;
            const isOwn = currentUser && (currentUser.id === userId?.toString() || currentUser._id === userId?.toString());

            return (
              <div key={id} className="group flex gap-2.5">
                <Avatar name={userName} src={userAvatar} id={userId} size="xs" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-ink">{userName}</span>
                    <span className="text-[10px] text-faint">{relativeTime(c.created_at || c.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words rounded-xl bg-surface-2 px-3 py-2 text-xs text-ink leading-relaxed">
                    {c.body}
                  </p>
                </div>
                {isOwn && (
                  <button
                    type="button"
                    onClick={() => handleDelete(id)}
                    className="mt-0.5 shrink-0 self-start opacity-0 group-hover:opacity-100 text-faint hover:text-priority-urgent transition-all"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}

      {/* New comment input */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        {currentUser && (
          <Avatar name={currentUser.name} src={currentUser.avatar_url} id={currentUser.id} size="xs" className="shrink-0" />
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink outline-none transition-all focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/15 placeholder:text-faint"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 transition-all"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>
    </div>
  );
};

export default TaskComments;
