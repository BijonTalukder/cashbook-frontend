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
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  businessService,
  type IBusiness,
} from "../../services/business.service";
import api from "../../services/api";
import { useTranslation } from "../../i18n/useTranslation";
import { haptic } from "../../native/bridge";
import { useBackHandler, useBodyScrollLock, useMediaQuery } from "../../native/hooks";
import type { TFunction } from "../../i18n/useTranslation";
import { enumLabel } from "../../i18n/labels";
import { AnalyticsView } from "./components/AnalyticsView";
import { CommandAutocomplete } from "./components/CommandAutocomplete";
import type { AnalyticsResult } from "./types";

/* ── Types ────────────────────────────────────────── */
type Step = "select" | "chat";
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  error?: boolean;
}

const formatTime = (ts?: number) =>
  ts
    ? new Date(ts).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

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
const SUGGESTION_KEYS: Record<string, string[]> = {
  mass: [
    "ai.suggestions.massTotalSpend",
    "ai.suggestions.massWhoOwes",
    "ai.suggestions.massTopCategory",
  ],
  personal: [
    "ai.suggestions.personalSummary",
    "ai.suggestions.personalSavings",
    "ai.suggestions.personalCutBack",
  ],
  company: [
    "ai.suggestions.companyProfitLoss",
    "ai.suggestions.companyBiggestExpense",
    "ai.suggestions.companyVsLastMonth",
  ],
};

const CAPABILITY_KEYS = [
  "ai.capabilities.expenseAnalysis",
  "ai.capabilities.dueTracking",
  "ai.capabilities.savingsAdvice",
  "ai.capabilities.addTransaction",
];

/* ── API call ─────────────────────────────────────── */
const callAI = async (
  businessId: string,
  messages: Message[],
  t: TFunction,
): Promise<string> => {
  const { data } = await api.post("/ai/chat", { businessId, messages });
  return data.data?.reply ?? t("ai.noReply");
};

/* ── Message Bubble ───────────────────────────────── */
const RichText = ({ text }: { text: string }): React.ReactNode => {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const isBullet = /^[-*•]\s?/.test(line.trim());
        const body = isBullet
          ? line.trim().replace(/^[-*•]\s?/, "")
          : line.trim();
        const inlineMarkup = body
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
        return (
          <div
            key={i}
            style={{ color: "var(--text-primary)" }}
            className="leading-relaxed"
          >
            {isBullet && (
              <span className="mr-1.5" style={{ color: "#10b981" }}>
                •
              </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: inlineMarkup }} />
          </div>
        );
      })}
    </div>
  );
};

const Bubble = ({ msg, onRetry }: { msg: Message; onRetry?: () => void }) => {
  const { t } = useTranslation();
  const isUser = msg.role === "user";
  const isError = !!msg.error;
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: isError
              ? "rgba(239,68,68,0.15)"
              : "linear-gradient(135deg,#10b981,#0d9488)",
          }}
        >
          {isError ? (
            <AlertTriangle size={13} style={{ color: "#ef4444" }} />
          ) : (
            <Bot size={13} className="text-white" />
          )}
        </div>
      )}
      <div className={`max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className="text-sm leading-relaxed"
          style={{
            background: isUser
              ? "#10b981"
              : isError
                ? "rgba(239,68,68,0.08)"
                : "var(--surface-4)",
            border: isError ? "1px solid rgba(239,68,68,0.25)" : "none",
            color: isUser ? "#022c22" : isError ? "#ef4444" : "var(--text-primary)",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            padding: "10px 14px",
          }}
        >
          {isUser ? msg.content : <RichText text={msg.content} />}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          {msg.timestamp && (
            <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
              {formatTime(msg.timestamp)}
            </span>
          )}
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: "#10b981" }}
            >
              <RotateCcw size={10} /> {t("ai.tryAgain")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   FloatingAI
════════════════════════════════════════════════════ */
const FloatingAI = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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
  const lastPayloadRef = useRef<Message[] | null>(null);

  /* ── Drag & Floating Position ─────────────────────── */
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem("cashbook_floating_ai_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.x === "number" &&
          typeof parsed.y === "number" &&
          !isNaN(parsed.x) &&
          !isNaN(parsed.y)
        ) {
          const buttonSize = 56;
          const margin = 12;
          const maxX = Math.max(margin, window.innerWidth - buttonSize - margin);
          const maxY = Math.max(margin, window.innerHeight - buttonSize - margin);
          return {
            x: Math.min(Math.max(parsed.x, margin), maxX),
            y: Math.min(Math.max(parsed.y, margin), maxY),
          };
        }
      }
    } catch {}
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    moved: boolean;
  } | null>(null);
  const justDraggedRef = useRef(false);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);

  // Keep button within screen bounds on window resize / orientation change
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const buttonSize = 56;
        const margin = 12;
        const maxX = Math.max(margin, window.innerWidth - buttonSize - margin);
        const maxY = Math.max(margin, window.innerHeight - buttonSize - margin);
        const clampedX = Math.min(Math.max(prev.x, margin), maxX);
        const clampedY = Math.min(Math.max(prev.y, margin), maxY);
        if (clampedX === prev.x && clampedY === prev.y) return prev;
        const next = { x: clampedX, y: clampedY };
        try {
          localStorage.setItem("cashbook_floating_ai_pos", JSON.stringify(next));
        } catch {}
        return next;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    dragInfoRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      moved: false,
    };

    try {
      button.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragInfoRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      setIsDragging(true);
    }

    const buttonSize = 56;
    const margin = 12;
    const maxX = Math.max(margin, window.innerWidth - buttonSize - margin);
    const maxY = Math.max(margin, window.innerHeight - buttonSize - margin);

    const clampedX = Math.min(Math.max(drag.origLeft + dx, margin), maxX);
    const clampedY = Math.min(Math.max(drag.origTop + dy, margin), maxY);

    const newPos = { x: clampedX, y: clampedY };
    currentPosRef.current = newPos;
    setPosition(newPos);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragInfoRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const didMove = drag.moved;
    dragInfoRef.current = null;
    setIsDragging(false);

    if (didMove) {
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 120);
      haptic("light");
      if (currentPosRef.current) {
        try {
          localStorage.setItem("cashbook_floating_ai_pos", JSON.stringify(currentPosRef.current));
        } catch {}
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    dragInfoRef.current = null;
    setIsDragging(false);
  };

  const handleClick = () => {
    if (justDraggedRef.current) return;
    haptic("medium");
    setOpen(true);
  };

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
      .catch(() => toast.error(t("ai.loadBusinessesFailed")))
      .finally(() => setLoadingBiz(false));
  }, [open]);

  /* Select business */
  const handleSelectBusiness = async (biz: IBusiness) => {
    haptic("selection");
    setSelected(biz);
    setGreeting(true);
    setStep("chat");
    try {
      const firstMsg: Message = {
        role: "user",
        content: t("ai.greetingPrompt", { business: biz.name }),
      };
      const reply = await callAI(biz._id, [firstMsg], t);
      setMessages([{ role: "assistant", content: reply, timestamp: Date.now() }]);
    } catch {
      toast.error(t("ai.connectFailed"));
      handleReset();
    } finally {
      setGreeting(false);
    }
  };

  /* Send */
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || thinking || !selected) return;
    haptic("medium");
    setInput("");
    const newMsgs: Message[] = [
      ...messages,
      { role: "user", content: text, timestamp: Date.now() },
    ];
    setMessages(newMsgs);
    lastPayloadRef.current = newMsgs;
    setThinking(true);
    try {
      const reply = await callAI(selected._id, newMsgs, t);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: Date.now() },
      ]);
      lastPayloadRef.current = null;
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("ai.replyFailed"),
          error: true,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  /* Retry the last failed exchange without re-adding a duplicate user bubble */
  const handleRetry = async () => {
    if (!lastPayloadRef.current || !selected || thinking) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.error ? prev.slice(0, -1) : prev;
    });
    setThinking(true);
    try {
      const reply = await callAI(selected._id, lastPayloadRef.current, t);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: Date.now() },
      ]);
      lastPayloadRef.current = null;
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("ai.replyFailed"),
          error: true,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleReset = () => {
    haptic("light");
    setStep("select");
    setSelected(null);
    setMessages([]);
    setInput("");
    lastPayloadRef.current = null;
  };
  const handleClose = () => {
    haptic("light");
    setOpen(false);
    setTimeout(handleReset, 300);
  };

  // The assistant is a full-screen surface on phones: back should dismiss it
  // and the page behind it must not scroll while it is up.
  useBackHandler(open, handleClose);
  useBodyScrollLock(open);

  const suggestionKeys = SUGGESTION_KEYS[selected?.type ?? "personal"] ?? SUGGESTION_KEYS.personal;

  return (
    <>
      {/* Floating button */}
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
        aria-label={t("ai.assistant")}
        title={t("ai.assistant")}
        className={`fixed z-40 w-14 h-14 rounded-2xl flex items-center justify-center select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab press"
        }`}
        style={{
          ...(position
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
                bottom: "auto",
                right: "auto",
              }
            : {
                // Default responsive dock slot
                bottom: isDesktop ? "1.5rem" : "var(--fab-slot-0)",
                right: "var(--fab-right)",
              }),
          background: "linear-gradient(135deg,#10b981,#0d9488)",
          boxShadow: isDragging
            ? "0 18px 40px rgba(16,185,129,0.55), 0 0 0 3px rgba(16,185,129,0.3)"
            : "0 8px 32px rgba(16,185,129,0.35)",
          transform: isDragging ? "scale(1.08)" : undefined,
          transition: isDragging
            ? "none"
            : "transform 180ms ease, box-shadow 180ms ease",
          touchAction: "none",
          WebkitUserSelect: "none",
        }}
      >
        <Sparkles size={22} className="text-white pointer-events-none" />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center"
          style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            className="w-full sm:max-w-md flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              boxShadow: "var(--shadow-elevated)",
              height: step === "chat" ? "82dvh" : "auto",
              maxHeight: "88dvh",
              paddingBottom: "var(--safe-bottom)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
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
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    {t("ai.assistant")}
                  </p>
                  {selected && (
                    <p
                      className="text-[11px] truncate"
                      style={{ color: "var(--text-faint)", maxWidth: 160 }}
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
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
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
                  <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {t("ai.selectTitle")}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {t("ai.selectSubtitle")}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {CAPABILITY_KEYS.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-1 rounded-lg"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          color: "#10b981",
                        }}
                      >
                        {t(c)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
                  {loadingBiz ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <Loader2
                        size={22}
                        className="animate-spin"
                        style={{ color: "#10b981" }}
                      />
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {t("common.loading")}
                      </p>
                    </div>
                  ) : businesses.length === 0 ? (
                    <p
                      className="text-center py-12 text-sm"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {t("ai.noBusinesses")}
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
                            background: "var(--surface-1)",
                            border: "1px solid var(--border-light)",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--surface-4)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "var(--surface-1)")
                          }
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}18` }}
                          >
                            <Icon size={18} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                              {biz.name}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "var(--text-faint)" }}
                            >
                              {t("invoiceDetail.accountSuffix", {
                                type: enumLabel(t, "businessType", biz.type),
                              })}
                            </p>
                          </div>
                          <ChevronRight
                            size={15}
                            style={{ color: "var(--text-faint)", flexShrink: 0 }}
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
                          background: "var(--surface-4)",
                          borderRadius: "18px 18px 18px 4px",
                        }}
                      >
                        <Loader2
                          size={13}
                          className="animate-spin"
                          style={{ color: "#10b981" }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("ai.analysing")}
                        </span>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <Bubble
                      key={i}
                      msg={msg}
                      onRetry={
                        msg.error && i === messages.length - 1 ? handleRetry : undefined
                      }
                    />
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
                          background: "var(--surface-4)",
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
                    {suggestionKeys.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleSend(t(key))}
                        className="px-3 py-1.5 rounded-xl text-xs transition-all"
                        style={{
                          background: "rgba(16,185,129,0.08)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          color: "#10b981",
                        }}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div
                  className="flex-shrink-0"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                <div className="px-4 pt-3 flex gap-2">
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
                    placeholder={t("ai.inputPlaceholder")}
                    disabled={greeting}
                    className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50"
                    style={{
                      background: "var(--surface-3)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || thinking || greeting}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 press"
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
                  <p
                    className="text-[10px] text-center px-4 pb-2.5 pt-1.5 flex items-center justify-center gap-1"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <ShieldAlert size={10} className="flex-shrink-0" />
                    {t("ai.disclaimer")}
                  </p>
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
