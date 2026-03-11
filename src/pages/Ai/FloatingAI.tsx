// components/shared/FloatingAI.tsx
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ChevronRight,
  Building2,
  Home,
  User,
  Bot,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  businessService,
  type IBusiness,
} from "../../services/business.service";
import api from "../../services/api";

/* ── Types ────────────────────────────────────────── */
type Step = "select" | "chat";
interface Message {
  role: "user" | "assistant";
  content: string;
}

/* ── Constants ────────────────────────────────────── */
const TYPE_ICON: Record<string, React.ElementType> = {
  personal: User,
  company: Building2,
  mass: Home,
};
const TYPE_COLOR: Record<string, string> = {
  personal: "#10b981",
  company: "#3b82f6",
  mass: "#8b5cf6",
};
const TYPE_LABEL: Record<string, string> = {
  personal: "Personal",
  company: "Company",
  mass: "Mess",
};

const SUGGESTIONS: Record<string, string[]> = {
  mass: [
    "এই মাসে মোট কত খরচ হয়েছে?",
    "কার কাছে কত টাকা বাকি?",
    "কোন category তে সবচেয়ে বেশি খরচ?",
  ],
  personal: [
    "এই মাসের আয়-ব্যয়ের সারসংক্ষেপ দাও",
    "সঞ্চয় পরিস্থিতি কেমন?",
    "কোথায় খরচ কমানো যায়?",
  ],
  company: [
    "এই মাসে profit/loss কত?",
    "সবচেয়ে বড় expense কোনটি?",
    "গত মাসের তুলনায় কেমন?",
  ],
};

/* ── API call ─────────────────────────────────────── */
const callAI = async (
  businessId: string,
  messages: Message[],
): Promise<{ reply: string; transaction?: any }> => {
  const { data } = await api.post("/ai/chat", { businessId, messages });
  return {
    reply: data.data?.reply ?? "উত্তর পাওয়া যায়নি।",
    transaction: data.data?.transaction ?? null,
  };
};

/* ── Message Bubble ───────────────────────────────── */
const Bubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "linear-gradient(135deg,#10b981,#0d9488)" }}
        >
          <Bot size={13} className="text-white" />
        </div>
      )}
      <div
        className="max-w-[80%] text-sm leading-relaxed"
        style={{
          background: isUser ? "#10b981" : "rgba(255,255,255,0.06)",
          color: isUser ? "#022c22" : "#e2e8f0",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "10px 14px",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   FloatingAI
════════════════════════════════════════════════════ */
const FloatingAI = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(false);
  const [selected, setSelected] = useState<IBusiness | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);
  useEffect(() => {
    if (step === "chat") setTimeout(() => inputRef.current?.focus(), 150);
  }, [step]);

  /* Load businesses */
  useEffect(() => {
    if (!open) return;
    setLoadingBiz(true);
    businessService
      .getMyBusinesses()
      .then((res: unknown[]) =>
        setBusinesses(
          res.map((m: unknown) => {
            const obj = m as Record<string, unknown>;
            return (obj.business ?? obj) as IBusiness;
          }),
        ),
      )
      .catch(() => toast.error("Businesses load করতে সমস্যা হয়েছে"))
      .finally(() => setLoadingBiz(false));
  }, [open]);

  /* Select business */
  const handleSelectBusiness = async (biz: IBusiness) => {
    setSelected(biz);
    setGreeting(true);
    setStep("chat");
    try {
      const firstMsg: Message = {
        role: "user",
        content: `${biz.name} business এর এই মাসের একটি সংক্ষিপ্ত financial সারসংক্ষেপ দাও।`,
      };
      const { reply, transaction } = await callAI(biz._id, [firstMsg]);

      // AI reply bubble
      const newMessages: Message[] = [{ role: "assistant", content: reply }];

      // যদি transaction create হয়ে থাকে
      if (transaction) {
        newMessages.push({
          role: "assistant",
          content: `✅ Transaction created: ${transaction.amount}৳ (${transaction.type})`,
        });
      }

      setMessages(newMessages);
    } catch {
      toast.error("AI connect করতে সমস্যা হয়েছে");
      handleReset();
    } finally {
      setGreeting(false);
    }
  };

  /* Send */
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || thinking || !selected) return;
    setInput("");
    const newMsgs: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setThinking(true);
    try {
      const { reply, transaction } = await callAI(selected._id, newMsgs);

      // AI reply bubble
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Optional: transaction info bubble
      if (transaction) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ Transaction created: ${transaction.amount}৳ (${transaction.type})`,
          },
        ]);
      }
    } catch {
      toast.error("উত্তর পাওয়া যায়নি");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setThinking(false);
    }
  };

  const handleReset = () => {
    setStep("select");
    setSelected(null);
    setMessages([]);
    setInput("");
  };
  const handleClose = () => {
    setOpen(false);
    setTimeout(handleReset, 300);
  };

  const suggestions = SUGGESTIONS[selected?.type ?? "personal"];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          bottom: "6rem",
          right: "1rem",
          background: "linear-gradient(135deg,#10b981,#0d9488)",
          boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
        }}
      >
        <Sparkles size={22} className="text-white" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            className="w-full sm:max-w-md flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{
              background: "#0d1424",
              border: "1px solid rgba(255,255,255,0.1)",
              height: step === "chat" ? "82vh" : "auto",
              maxHeight: "82vh",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#10b981,#0d9488)",
                  }}
                >
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    HisabBoi AI
                  </p>
                  {selected && (
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "#475569", maxWidth: 160 }}
                    >
                      {selected.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {step === "chat" && !greeting && (
                  <button
                    onClick={handleReset}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "#64748b",
                    }}
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#64748b",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Business select */}
            {step === "select" && (
              <div className="flex flex-col overflow-hidden">
                <div className="px-5 pt-4 pb-3">
                  <p className="text-white font-semibold mb-1">
                    কোন business নিয়ে জানতে চাও?
                  </p>
                  <p className="text-xs" style={{ color: "#475569" }}>
                    Select করলে AI সেই business এর হিসাব বিশ্লেষণ করবে
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
                  {loadingBiz ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <Loader2
                        size={22}
                        className="animate-spin"
                        style={{ color: "#10b981" }}
                      />
                      <p className="text-xs" style={{ color: "#475569" }}>
                        লোড হচ্ছে...
                      </p>
                    </div>
                  ) : businesses.length === 0 ? (
                    <p
                      className="text-center py-12 text-sm"
                      style={{ color: "#475569" }}
                    >
                      কোনো business পাওয়া যায়নি
                    </p>
                  ) : (
                    businesses.map((biz) => {
                      const Icon = TYPE_ICON[biz.type] ?? Building2;
                      const color = TYPE_COLOR[biz.type] ?? "#64748b";
                      return (
                        <button
                          key={biz._id}
                          onClick={() => handleSelectBusiness(biz)}
                          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.06)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.03)")
                          }
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}18` }}
                          >
                            <Icon size={18} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {biz.name}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "#475569" }}
                            >
                              {TYPE_LABEL[biz.type] ?? biz.type} account
                            </p>
                          </div>
                          <ChevronRight
                            size={15}
                            style={{ color: "#334155", flexShrink: 0 }}
                          />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Chat */}
            {step === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {/* Greeting loader */}
                  {greeting && (
                    <div className="flex gap-2">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg,#10b981,#0d9488)",
                        }}
                      >
                        <Bot size={13} className="text-white" />
                      </div>
                      <div
                        className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: "18px 18px 18px 4px",
                        }}
                      >
                        <Loader2
                          size={13}
                          className="animate-spin"
                          style={{ color: "#10b981" }}
                        />
                        <span className="text-xs" style={{ color: "#64748b" }}>
                          বিশ্লেষণ করছি...
                        </span>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <Bubble key={i} msg={msg} />
                  ))}

                  {/* Typing dots */}
                  {thinking && (
                    <div className="flex gap-2">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg,#10b981,#0d9488)",
                        }}
                      >
                        <Bot size={13} className="text-white" />
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: "18px 18px 18px 4px",
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{
                              background: "#10b981",
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Suggestions */}
                {!greeting && messages.length === 1 && !thinking && (
                  <div className="px-4 pb-3 flex gap-2 flex-wrap">
                    {suggestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="px-3 py-1.5 rounded-xl text-xs transition-all"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          color: "#10b981",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div
                  className="px-4 py-3 flex gap-2 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="জিজ্ঞেস করুন..."
                    disabled={greeting}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || thinking || greeting}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all"
                    style={{ background: "#10b981" }}
                  >
                    {thinking ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        style={{ color: "#022c22" }}
                      />
                    ) : (
                      <Send size={15} style={{ color: "#022c22" }} />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;
