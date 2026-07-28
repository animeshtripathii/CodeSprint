import { useState, useEffect, useCallback } from "react";
import { FileText, Loader2, CheckCircle2, Clock, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { aiApi } from "../../lib/api";

const Section = ({ icon: Icon, title, items, color }) => {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        <Icon className="h-4 w-4" /> {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
};

const AISummaryModal = ({ open, onClose, boardId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await aiApi.summary(boardId);
      setSummary(res);
    } catch (err) {
      console.error("Sprint summary generation failed:", err);
      setError("AI is busy right now, try again shortly");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (open) {
      fetchSummary();
    }
  }, [open, fetchSummary]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-500" /> AI Sprint Summary
        </span>
      }
    >
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <p className="text-sm">Gemini is generating sprint summary…</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold tracking-tight">Summary Failed</h4>
            <p className="mt-1 text-xs text-muted max-w-xs">{error}</p>
          </div>
          <Button size="sm" onClick={fetchSummary}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry summary
          </Button>
        </div>
      )}

      {summary && !loading && (
        <div className="space-y-5">
          {summary.headline && (
            <p className="rounded-2xl border border-brand-500/15 bg-brand-50 p-4 text-sm leading-relaxed text-brand-950 shadow-sm">
              {summary.headline}
            </p>
          )}
          <Section icon={CheckCircle2} title="Completed" items={summary.completed} color="#10b981" />
          <Section icon={Clock} title="In progress" items={summary.inProgress} color="#fbbf24" />
          <Section icon={AlertTriangle} title="Risks & blockers" items={summary.risks} color="#f43f5e" />
          <Section icon={ArrowRight} title="Recommendations" items={summary.recommendations} color="#818cf8" />
        </div>
      )}
    </Modal>
  );
};

export default AISummaryModal;
