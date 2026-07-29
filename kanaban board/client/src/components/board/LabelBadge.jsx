/**
 * LabelBadge — displays a single colored label chip.
 * Props:
 *   label  { id, name, color }
 *   size   "sm" | "xs"  (default "sm")
 *   onRemove  optional callback — shows × button when provided
 */
const LabelBadge = ({ label, size = "sm", onRemove }) => {
  if (!label) return null;

  const base =
    size === "xs"
      ? "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
      : "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold";

  // Derive a faint background from the label color at 15% opacity
  const bg = label.color + "26"; // hex 26 ≈ 15% alpha

  return (
    <span
      className={base}
      style={{ backgroundColor: bg, color: label.color, border: `1px solid ${label.color}40` }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: label.color }}
      />
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(label); }}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label={`Remove ${label.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default LabelBadge;
