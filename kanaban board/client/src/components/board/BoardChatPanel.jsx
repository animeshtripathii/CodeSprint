import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { boardApi } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

const BoardChatPanel = ({ open, onClose, boardId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  
  const panelRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchChatHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await boardApi.getChat(boardId);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load chat history:", err);
      toast.error("Failed to load chat messages");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (open) {
      fetchChatHistory();
    }
  }, [open, fetchChatHistory]);

  // Scroll to bottom on new messages or thinking state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Listen to new messages from Socket.io room
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewChatMessage = (msg) => {
      // Avoid duplicates
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id || m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (msg.is_ai || msg.isAI) {
        setThinking(false);
      }
    };

    socket.on("chat:message", onNewChatMessage);
    return () => {
      socket.off("chat:message", onNewChatMessage);
    };
  }, []);

  // Handle message send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText("");
    setSending(true);

    if (messageText.toLowerCase().startsWith("@ai")) {
      setThinking(true);
    }

    try {
      await boardApi.sendChat(boardId, messageText);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
      setThinking(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-30 bg-ink/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Chat Side Drawer */}
          <motion.aside
            ref={panelRef}
            className="glass fixed right-0 top-0 z-40 flex h-full w-full sm:w-80 flex-col border-l bg-surface shadow-[var(--shadow-lift)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <MessageSquare className="h-4 w-4 text-brand-500" /> Board Chat & AI
              </h3>
              <button onClick={onClose} className="rounded p-1 text-muted hover:bg-surface-2 hover:text-ink transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="skeleton h-8 w-8 rounded-full shrink-0" />
                      <div className="skeleton h-12 flex-1 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
                  <MessageSquare className="h-8 w-8 text-faint" />
                  <p className="text-sm font-semibold text-ink">Welcome to Board Chat!</p>
                  <p className="text-xs text-muted max-w-[200px] leading-relaxed">
                    Chat with your team here. Mention <span className="font-semibold text-brand-500">@AI</span> to ask Gemini about board tasks.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isAI = msg.is_ai || msg.isAI;
                    const senderName = msg.sender_id?.name || msg.senderId?.name || "AI Assistant";
                    const senderAvatar = msg.sender_id?.avatarUrl || msg.senderId?.avatarUrl || null;
                    const senderUserId = msg.sender_id?._id || msg.senderId?.id || msg.id;

                    return (
                      <div
                        key={msg._id || msg.id || index}
                        className={`flex gap-2.5 ${isAI ? "items-start" : "items-start"}`}
                      >
                        {isAI ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-500 shrink-0 border border-brand-100">
                            <Bot className="h-4 w-4" />
                          </div>
                        ) : (
                          <Avatar
                            name={senderName}
                            src={senderAvatar}
                            id={senderUserId}
                            size="xs"
                            className="shrink-0"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-semibold text-ink">
                              {isAI ? "Flowbot" : senderName}
                            </span>
                          </div>
                          <div
                            className={`mt-1 rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                              isAI
                                ? "bg-brand-50/50 border border-brand-500/10 text-ink"
                                : "bg-surface-2 text-ink"
                            }`}
                          >
                            <p className="whitespace-pre-line break-words">{msg.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Thinking Indicator */}
              {thinking && (
                <div className="flex gap-2.5 items-start">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-500 shrink-0 border border-brand-100 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-brand-500">Flowbot is thinking...</span>
                    <div className="mt-1 flex items-center gap-1.5 rounded-2xl bg-brand-50/20 border border-brand-500/5 px-3 py-2 text-xs text-muted w-max">
                      <Loader2 className="h-3 w-3 animate-spin text-brand-500" />
                      <span>Retrieving tasks and analyzing board...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message team... Use @AI to ask bot"
                className="flex-1 rounded-full border border-line bg-surface-2 px-4 py-2 text-xs text-ink focus:border-brand-500 focus:outline-none"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600 focus:outline-none disabled:opacity-40 transition-all shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default BoardChatPanel;
