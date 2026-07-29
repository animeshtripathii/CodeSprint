import { useState, useRef, useEffect } from "react";
import { Tag, Plus, Check, X } from "lucide-react";
import { labelApi } from "../../lib/api";
import LabelBadge from "./LabelBadge";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#06b6d4", "#6366f1", "#8b5cf6", "#ec4899",
  "#64748b", "#0ea5e9",
];

/**
 * LabelPicker — dropdown that lets users assign/unassign labels on a task.
 * Props:
 *   boardId        string
 *   boardLabels    [{_id|id, name, color}]  — board-level label definitions
 *   selectedIds    [string]                  — currently assigned label ids
 *   onChange       (newIds: string[]) => void
 *   onLabelsChange (newLabels) => void        — called when board labels mutate
 */
const LabelPicker = ({ boardId, boardLabels = [], selectedIds = [], onChange, onLabelsChange }) => {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (labelId) => {
    const next = selectedIds.includes(labelId)
      ? selectedIds.filter((id) => id !== labelId)
      : [...selectedIds, labelId];
    onChange(next);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await labelApi.create(boardId, { name: newName.trim(), color: newColor });
      onLabelsChange?.([...boardLabels, created]);
      onChange([...selectedIds, created.id || created._id]);
      setNewName("");
      setCreating(false);
      toast.success(`Label "${created.name}" created`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, labelId) => {
    e.stopPropagation();
    try {
      await labelApi.remove(boardId, labelId);
      onLabelsChange?.(boardLabels.filter((l) => (l.id || l._id) !== labelId));
      onChange(selectedIds.filter((id) => id !== labelId));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const selectedLabels = boardLabels.filter((l) => selectedIds.includes(l.id || l._id));

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-[0.07em]">
        Labels
      </label>

      {/* Selected chips + open trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[36px] w-full flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-left transition-all hover:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        {selectedLabels.length === 0 ? (
          <span className="flex items-center gap-1.5 text-xs text-faint">
            <Tag className="h-3.5 w-3.5" /> Add labels…
          </span>
        ) : (
          selectedLabels.map((l) => (
            <LabelBadge key={l.id || l._id} label={{ ...l, id: l.id || l._id }} size="xs" />
          ))
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="card absolute left-0 z-30 mt-1.5 w-64 rounded-2xl p-2 shadow-[var(--shadow-lift)]">
          {/* Existing labels */}
          <div className="max-h-44 space-y-0.5 overflow-y-auto">
            {boardLabels.length === 0 && !creating && (
              <p className="py-4 text-center text-xs text-faint">No labels yet. Create one below.</p>
            )}
            {boardLabels.map((l) => {
              const lid = l.id || l._id;
              const isSelected = selectedIds.includes(lid);
              return (
                <div
                  key={lid}
                  className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2 transition-colors"
                  onClick={() => toggle(lid)}
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: l.color }}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                  </span>
                  <span className="flex-1 text-sm text-ink">{l.name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, lid)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-faint hover:text-priority-urgent transition-all"
                    title="Delete label"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-1 border-t pt-1">
            {creating ? (
              <div className="space-y-2 p-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Label name…"
                  className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/15"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: c === newColor ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving || !newName.trim()}
                    className="flex-1 rounded-lg bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving…" : "Create"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-faint hover:bg-surface-2 hover:text-ink transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Create new label
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelPicker;
