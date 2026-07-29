import { useEffect } from "react";

/**
 * useKeyboardShortcuts — attaches global keyboard shortcuts.
 *
 * callbacks shape:
 *   onNewTask()       — triggered by "n" (when no input focused)
 *   onSearch()        — triggered by "/" (when no input focused)
 *   onToggleHelp()    — triggered by "?"
 *   onEscape()        — triggered by Escape
 */
const useKeyboardShortcuts = ({ onNewTask, onSearch, onToggleHelp, onEscape } = {}) => {
  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement;
      return (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable ||
          el.closest("[role='dialog']"))
      );
    };

    const handler = (e) => {
      // Never intercept when modifier keys are held (Ctrl/Cmd/Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "Escape":
          onEscape?.();
          break;
        case "n":
        case "N":
          if (!isInputFocused()) {
            e.preventDefault();
            onNewTask?.();
          }
          break;
        case "/":
          if (!isInputFocused()) {
            e.preventDefault();
            onSearch?.();
          }
          break;
        case "?":
          onToggleHelp?.();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onNewTask, onSearch, onToggleHelp, onEscape]);
};

export default useKeyboardShortcuts;
