import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MessageCircle } from "lucide-react";
import Avatar from "../ui/Avatar";
import { PriorityTag } from "../ui/Badge";
import LabelBadge from "./LabelBadge";
import { cn, formatDueDate } from "../../lib/utils";

const TaskCard = ({ task, onClick, overlay = false, boardLabels = [] }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = { transform: CSS.Translate.toString(transform), transition };
  const due = formatDueDate(task.due_date);

  // Resolve labels for this task
  const taskLabelIds = task.label_ids || task.labelIds || [];
  const taskLabels = boardLabels.filter((l) =>
    taskLabelIds.map(String).includes(String(l.id || l._id))
  );

  // Subtask progress
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const hasSubtasks = subtasks.length > 0;

  // Comment count
  const commentCount = task.comment_count || task.commentCount || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick?.(task)}
      className={cn(
        "liquid-glass group cursor-grab rounded-2xl border border-white/12 bg-white/[0.045] backdrop-blur-xl p-4 active:cursor-grabbing",
        "shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-200",
        "hover:bg-white/[0.07] hover:border-white/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]",
        isDragging && "opacity-40",
        overlay && "rotate-2 cursor-grabbing shadow-[var(--shadow-lift)]"
      )}
    >
      {/* Priority tag */}
      <PriorityTag priority={task.priority} />

      {/* Label chips (up to 3) */}
      {taskLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {taskLabels.slice(0, 3).map((l) => (
            <LabelBadge key={l.id || l._id} label={{ ...l, id: l.id || l._id }} size="xs" />
          ))}
          {taskLabels.length > 3 && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-faint">
              +{taskLabels.length - 3}
            </span>
          )}
        </div>
      )}

      <p className="mt-2.5 text-[15px] font-semibold leading-snug tracking-tight text-ink">
        {task.title}
      </p>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {task.description}
        </p>
      )}

      {/* Subtask progress mini-bar */}
      {hasSubtasks && (
        <div className="mt-2.5 space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
            />
          </div>
          <p className="text-[10px] tabular text-faint">
            {completedSubtasks}/{subtasks.length} subtasks
          </p>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between border-t border-line/70 pt-3">
        {/* Assignee */}
        {task.assignee_id ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={task.assignee_name} id={task.assignee_id} src={task.assignee_avatar} size="xs" />
            <span className="max-w-[7rem] truncate text-[11px] text-muted">{task.assignee_name}</span>
          </div>
        ) : (
          <span className="text-[11px] text-faint">Unassigned</span>
        )}

        {/* Right badges */}
        <div className="flex items-center gap-1.5">
          {/* Comment count badge */}
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
              <MessageCircle className="h-3 w-3" /> {commentCount}
            </span>
          )}

          {/* Due date badge */}
          {due && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular",
                due.overdue ? "bg-priority-urgent/10 text-priority-urgent" : "bg-surface-2 text-muted"
              )}
            >
              <Calendar className="h-3 w-3" /> {due.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
