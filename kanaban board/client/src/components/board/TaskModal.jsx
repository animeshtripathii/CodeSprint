import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Trash2, GitBranch, Loader2, CheckSquare, Square, Plus, X } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input, Textarea, Select } from "../ui/Input";
import { PRIORITIES } from "../../lib/utils";

const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const empty = (columnId) => ({
  title: "",
  description: "",
  priority: "medium",
  due_date: "",
  assignee_id: "",
  column_id: columnId || "",
  subtasks: [],
});

const TaskModal = ({ open, onClose, task, defaultColumnId, columns, members, actions, onBreakdown }) => {
  const isEdit = Boolean(task);
  const [form, setForm] = useState(empty(defaultColumnId));
  const [saving, setSaving] = useState(false);
  const [breakingDown, setBreakingDown] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        due_date: toDateInput(task.due_date),
        assignee_id: task.assignee_id || "",
        column_id: task.column_id,
        subtasks: task.subtasks || [],
      });
    } else {
      setForm(empty(defaultColumnId || columns[0]?.id));
    }
    setNewSubtask("");
  }, [open, task, defaultColumnId, columns]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Subtask helpers
  const toggleSubtask = (i) => {
    setForm((f) => {
      const subtasks = f.subtasks.map((s, idx) =>
        idx === i ? { ...s, completed: !s.completed } : s
      );
      return { ...f, subtasks };
    });
  };

  const removeSubtask = (i) => {
    setForm((f) => ({ ...f, subtasks: f.subtasks.filter((_, idx) => idx !== i) }));
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm((f) => ({
      ...f,
      subtasks: [...f.subtasks, { title: newSubtask.trim(), completed: false }],
    }));
    setNewSubtask("");
  };

  const onSubtaskKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addSubtask(); }
  };

  const completedCount = form.subtasks.filter((s) => s.completed).length;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      assignee_id: form.assignee_id || null,
      subtasks: form.subtasks,
    };
    try {
      if (isEdit) {
        await actions.updateTask(task.id, payload);
        toast.success("Task updated");
      } else {
        await actions.createTask({ ...payload, column_id: form.column_id });
        toast.success("Task created");
      }
      onClose();
    } catch {
      /* handled in hook */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await actions.deleteTask(task.id);
    onClose();
  };

  const handleBreakdown = async () => {
    setBreakingDown(true);
    try {
      await onBreakdown(task);
    } finally {
      setBreakingDown(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit task" : "New task"} size="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Title" placeholder="What needs to be done?" autoFocus value={form.title} onChange={set("title")} />
        <Textarea label="Description" rows={3} placeholder="Add more detail…" value={form.description} onChange={set("description")} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Priority" value={form.priority} onChange={set("priority")}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
          <Input label="Due date" type="date" value={form.due_date} onChange={set("due_date")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Assignee" value={form.assignee_id} onChange={set("assignee_id")}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          {!isEdit && (
            <Select label="Column" value={form.column_id} onChange={set("column_id")}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
          )}
        </div>

        {/* Subtask / Checklist section */}
        {(isEdit || form.subtasks.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted uppercase tracking-[0.07em]">
                Checklist
              </label>
              {form.subtasks.length > 0 && (
                <span className="text-[11px] text-faint tabular">
                  {completedCount}/{form.subtasks.length} done
                </span>
              )}
            </div>

            {/* Progress bar */}
            {form.subtasks.length > 0 && (
              <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${(completedCount / form.subtasks.length) * 100}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {form.subtasks.map((s, i) => (
                <div key={i} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2 transition-colors">
                  <button type="button" onClick={() => toggleSubtask(i)} className="shrink-0 text-muted hover:text-brand-500 transition-colors">
                    {s.completed
                      ? <CheckSquare className="h-4 w-4 text-brand-500" />
                      : <Square className="h-4 w-4" />}
                  </button>
                  <span className={`flex-1 text-sm ${s.completed ? "line-through text-faint" : ""}`}>
                    {s.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(i)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-faint hover:text-priority-urgent transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask input */}
            <div className="flex items-center gap-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={onSubtaskKeyDown}
                placeholder="Add a subtask…"
                className="flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm outline-none transition-all duration-200 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/15 placeholder:text-faint"
              />
              <button
                type="button"
                onClick={addSubtask}
                disabled={!newSubtask.trim()}
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-faint hover:bg-surface-2 hover:text-ink transition-colors disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            {isEdit && (
              <Button type="button" variant="ghost" onClick={handleDelete} className="text-priority-urgent">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isEdit && (
              <Button type="button" variant="outline" onClick={handleBreakdown} disabled={breakingDown}>
                {breakingDown ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
                AI breakdown
              </Button>
            )}
            <Button type="submit" loading={saving}>{isEdit ? "Save" : "Create task"}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
