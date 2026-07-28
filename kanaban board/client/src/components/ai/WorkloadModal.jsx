import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { ShieldAlert, Loader2, Check, X, RefreshCw, HelpCircle, ArrowRight } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { boardApi, taskApi } from "../../lib/api";

const WorkloadModal = ({ open, onClose, boardId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [processingIds, setProcessingIds] = useState({});

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setProcessingIds({});
    try {
      const res = await boardApi.analyzeWorkload(boardId);
      setData(res);
    } catch (err) {
      console.error("Workload analysis client fetch failed:", err);
      setError("AI is busy right now, try again in a moment");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (open) {
      fetchAnalysis();
    }
  }, [open, fetchAnalysis]);

  const handleApprove = async (rec) => {
    const taskId = rec.task_id;
    setProcessingIds((prev) => ({ ...prev, [taskId]: true }));
    try {
      await taskApi.reassign(boardId, taskId, {
        assigneeId: rec.to_user_id,
        source: "ai_recommendation",
      });
      toast.success(`Task reassigned to ${rec.to_user_name}`);
      
      // Optimistically remove from suggestion list in UI
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recommendations: prev.recommendations.filter((r) => r.task_id !== taskId),
        };
      });
    } catch (err) {
      console.error("Reassignment failed:", err);
      toast.error(`Failed to reassign task: ${err.message || "Unknown error"}`);
    } finally {
      setProcessingIds((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    }
  };

  const handleReject = (rec) => {
    toast.success(`Dismissed suggestion for "${rec.task_title}"`);
    // Remove from suggestion list in UI locally only
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recommendations: prev.recommendations.filter((r) => r.task_id !== rec.task_id),
      };
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-brand-500" /> AI Workload Analysis
        </span>
      }
      description="Identify task blockages and optimize workload distribution across members."
    >
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <p className="text-sm">Gemini is analyzing board workload…</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold tracking-tight">Analysis Failed</h4>
            <p className="mt-1 text-xs text-muted max-w-xs">{error}</p>
          </div>
          <Button size="sm" onClick={fetchAnalysis}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry analysis
          </Button>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Summary Card */}
          {data.summary && (
            <div className="rounded-2xl border border-brand-500/15 bg-brand-50 p-4 text-sm leading-relaxed text-brand-950 shadow-sm">
              {data.summary}
            </div>
          )}

          {/* Recommendations List */}
          <div className="space-y-3.5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-[0.12em] text-faint">
              Reassignment Recommendations ({data.recommendations?.length || 0})
            </h4>

            {!data.recommendations?.length ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2/45 py-10 text-center">
                <HelpCircle className="h-6 w-6 text-faint" />
                <p className="text-xs text-muted max-w-xs">
                  No reassignments recommended. Workload is balanced.
                </p>
              </div>
            ) : (
              <div className="max-h-[350px] space-y-3.5 overflow-y-auto pr-1">
                {data.recommendations.map((rec) => {
                  const isProcessing = !!processingIds[rec.task_id];
                  return (
                    <div
                      key={rec.task_id}
                      className="card flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-sm"
                    >
                      <div>
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 uppercase tracking-wide">
                          Workload Suggestion
                        </span>
                        <h5 className="mt-1.5 font-display text-sm font-semibold tracking-tight">
                          {rec.task_title}
                        </h5>
                      </div>

                      <div className="flex items-center gap-3.5 text-xs text-muted">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-faint uppercase font-bold tracking-wider">Current</span>
                          <span className="font-semibold text-ink truncate max-w-[120px]">
                            {rec.from_user_name || "Unassigned"}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-faint shrink-0 mt-3" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-faint uppercase font-bold tracking-wider">Proposed</span>
                          <span className="font-semibold text-brand-600 truncate max-w-[120px]">
                            {rec.to_user_name}
                          </span>
                        </div>
                      </div>

                      {rec.reason && (
                        <p className="text-xs text-muted bg-surface-2/60 rounded-xl p-2.5 leading-relaxed">
                          {rec.reason}
                        </p>
                      )}

                      <div className="flex justify-end gap-2 border-t pt-3">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleReject(rec)}
                          disabled={isProcessing}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleApprove(rec)}
                          loading={isProcessing}
                          disabled={isProcessing}
                          className="border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default WorkloadModal;
