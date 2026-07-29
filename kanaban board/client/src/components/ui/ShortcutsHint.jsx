import { Keyboard, X } from "lucide-react";

const SHORTCUTS = [
  { key: "N", label: "New task" },
  { key: "/", label: "Focus search" },
  { key: "Esc", label: "Close modal" },
  { key: "?", label: "Toggle shortcuts" },
];

const Kbd = ({ children }) => (
  <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-line bg-surface-2 px-1 font-mono text-[10px] font-semibold text-ink shadow-[0_1px_0_rgba(0,0,0,.1)]">
    {children}
  </kbd>
);

/**
 * ShortcutsHint — small floating panel at bottom-left listing keyboard shortcuts.
 * Toggled by pressing "?".
 */
const ShortcutsHint = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 left-5 z-50"
      style={{ animation: "shortcuts-slide-in 0.2s ease-out both" }}
    >
      <style>{`
        @keyframes shortcuts-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="card rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-lift)] min-w-[180px]">
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Keyboard className="h-3.5 w-3.5 text-brand-500" /> Shortcuts
          </span>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-faint hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-1.5">
          {SHORTCUTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-6">
              <span className="text-xs text-muted">{label}</span>
              <Kbd>{key}</Kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHint;
