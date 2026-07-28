import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, X } from "lucide-react";
import { boardApi } from "../lib/api";
import { getSocket } from "../lib/socket";
import Avatar from "./ui/Avatar";
import { relativeTime } from "../lib/utils";

/**
 * ActivityFeed — slide-in panel showing the board's activity log.
 *
 * Backend shape (after mapKeys toSnakeCase):
 *   { id, task_title, task_id, action, timestamp, user: { name, email, avatar_url } }
 */

const ActivityItem = ({ a }) => {
  const userName = a.user?.name || "System";
  const userAvatar = a.user?.avatar_url || null;
  const userId = a.user?._id || a.user?.id || a.id;
  const time = a.timestamp || a.created_at;

  return (
    <li className="flex gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2 transition-colors">
      <Avatar name={userName} id={userId} src={userAvatar} size="xs" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-medium text-ink">{userName}</span>{" "}
          <span className="text-muted">{a.action}</span>
          {a.task_title && (
            <>
              {" "}on{" "}
              <span className="font-medium text-ink">"{a.task_title}"</span>
            </>
          )}
        </p>
        <p className="mt-0.5 text-[11px] text-faint">{relativeTime(time)}</p>
      </div>
    </li>
  );
};

const ActivityFeed = ({ open, onClose, boardId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    boardApi
      .activity(boardId, 50)
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, boardId]);

  // Live updates
  useEffect(() => {
    const socket = getSocket();
    const onNew = (a) => setActivities((prev) => [a, ...prev].slice(0, 80));
    socket.on("activity:new", onNew);
    return () => socket.off("activity:new", onNew);
  }, [boardId]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-ink/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="glass fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <Activity className="h-4 w-4 text-brand-500" /> Activity
              </h3>
              <button onClick={onClose} className="rounded p-1 text-muted hover:bg-surface-2 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 rounded-lg" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Activity className="h-8 w-8 text-faint" />
                  <p className="text-sm text-faint">No activity yet.</p>
                  <p className="text-xs text-faint">Create or move a task to see logs here.</p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {activities.map((a, idx) => (
                    <ActivityItem key={a.id || idx} a={a} />
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ActivityFeed;
