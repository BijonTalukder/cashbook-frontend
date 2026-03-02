import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  RefreshCw,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { useAuthStore } from "../../store/authStore";
import {
  transactionService,
  type IPendingDue,
  type IDueTransaction,
} from "../../services/transaction.service";

/* ─── helpers ─────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", { day: "2-digit", month: "short" });

const C = {
  bg: "#0a0f1e",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
};

/* ─── Avatar ──────────────────────────────────────────── */
const Avatar = ({
  name,
  color = "135deg, #10b981, #0d9488",
  size = 8,
}: {
  name: string;
  color?: string;
  size?: number;
}) => (
  <div
    className={`w-${size} h-${size} rounded-xl flex items-center justify-center flex-shrink-0`}
    style={{
      background: `linear-gradient(${color})`,
      minWidth: `${size * 4}px`,
      width: `${size * 4}px`,
      height: `${size * 4}px`,
    }}
  >
    <span
      style={{ fontSize: `${size * 1.3}px`, fontWeight: 700, color: "#fff" }}
    >
      {name?.[0]?.toUpperCase()}
    </span>
  </div>
);

/* ─── Due Card ────────────────────────────────────────── */
const DueCard = ({
  due,
  currentUserId,
  onSettleAll,
}: {
  due: IPendingDue;
  currentUserId: string;
  onSettleAll: (due: IPendingDue) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  const isMeFrom = due.from._id === currentUserId;
  const isMeTo = due.to._id === currentUserId;

  // "I owe": isMeFrom
  // "I'm owed": isMeTo
  const directionColor = isMeFrom ? "#ef4444" : "#10b981";
  const directionLabel = isMeFrom ? "You owe" : "You're owed";
  const directionBg = isMeFrom
    ? "rgba(239,68,68,0.06)"
    : "rgba(16,185,129,0.06)";
  const directionBorder = isMeFrom
    ? "rgba(239,68,68,0.15)"
    : "rgba(16,185,129,0.15)";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {/* ── Main row ────────────────────────────────── */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Avatars */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Avatar
              name={due.from.firstName}
              color={
                isMeFrom ? "135deg,#ef4444,#dc2626" : "135deg,#3b82f6,#2563eb"
              }
            />
            <ArrowRight size={12} style={{ color: "#334155" }} />
            <Avatar
              name={due.to.firstName}
              color={
                isMeTo ? "135deg,#10b981,#0d9488" : "135deg,#8b5cf6,#7c3aed"
              }
            />
          </div>

          {/* Names */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">
              <span style={{ color: isMeFrom ? "#f87171" : "#94a3b8" }}>
                {isMeFrom ? "You" : due.from.firstName}
              </span>{" "}
              →{" "}
              <span style={{ color: isMeTo ? "#10b981" : "#94a3b8" }}>
                {isMeTo ? "You" : due.to.firstName}
              </span>
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{
                  background: directionBg,
                  color: directionColor,
                  border: `1px solid ${directionBorder}`,
                }}
              >
                {directionLabel}
              </span>
              <span className="text-[10px]" style={{ color: "#334155" }}>
                {due.transactions.length} txn
                {due.transactions.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <p
              className="text-lg font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: directionColor,
              }}
            >
              ৳{fmt(due.amount)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {(isMeFrom || isMeTo) && (
          <div className="flex items-center gap-2 mt-3">
            {isMeFrom && (
              <button
                onClick={() => onSettleAll(due)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                <CheckCircle2 size={13} /> Mark as Paid
              </button>
            )}
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#64748b",
              }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Details
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded transaction list ────────────────── */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {due.transactions.map((t: IDueTransaction, i: number) => (
            <div
              key={t._id}
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom:
                  i < due.transactions.length - 1
                    ? "1px solid rgba(255,255,255,0.03)"
                    : "none",
              }}
            >
              <div>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  {t.note ?? "No note"}
                </p>
                <p className="text-[10px]" style={{ color: "#334155" }}>
                  {fmtDate(t.date)}
                </p>
              </div>
              <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                ৳{fmt(t.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Quick Settle Modal (from dues page) ─────────────── */
const QuickSettleModal = ({
  due,
  onClose,
  onDone,
}: {
  due: IPendingDue;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Settle all transactions in this due group
  const handleSettle = async () => {
    setSubmitting(true);
    try {
      // Settle each transaction's remaining amount
      await Promise.all(
        due.transactions.map((t) =>
          transactionService.settle(t._id, {
            amount: t.amount,
            paidTo: due.to._id,
            note: note.trim() || undefined,
          }),
        ),
      );
      toast.success(`৳${fmt(due.amount)} settled!`);
      onDone();
    } catch {
      toast.error("Settlement failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "#0d1424",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(16,185,129,0.1)" }}
        >
          <CheckCircle2 size={22} style={{ color: "#10b981" }} />
        </div>

        <h3
          className="text-lg font-bold text-white text-center mb-1"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Settle ৳{fmt(due.amount)}
        </h3>
        <p className="text-xs text-center mb-5" style={{ color: "#475569" }}>
          Pay <strong style={{ color: "#fff" }}>{due.to.firstName}</strong> to
          clear {due.transactions.length} pending transaction
          {due.transactions.length > 1 ? "s" : ""}
        </p>

        {/* Note */}
        <div className="mb-4">
          <label className="block text-xs mb-1.5" style={{ color: "#475569" }}>
            Payment note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. bKash, cash, bank transfer..."
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSettle}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#10b981", color: "#022c22" }}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────── */
const PendingDuesPage = () => {
  const { activeBusiness } = useBusinessStore();
  const { user } = useAuthStore();

  const [dues, setDues] = useState<IPendingDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingDue, setSettlingDue] = useState<IPendingDue | null>(null);

  const myDues = dues.filter((d) => d.from._id === user?._id);
  const owedToMe = dues.filter((d) => d.to._id === user?._id);
  const otherDues = dues.filter(
    (d) => d.from._id !== user?._id && d.to._id !== user?._id,
  );

  const totalIOwe = myDues.reduce((s, d) => s + d.amount, 0);
  const totalOwedToMe = owedToMe.reduce((s, d) => s + d.amount, 0);

  const fetchDues = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const data = await transactionService.getPendingDues(activeBusiness._id);
      setDues(data);
    } catch {
      toast.error("Failed to load dues");
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchDues();
  }, [fetchDues]);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8 space-y-5">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Pending Dues
            </h1>
            {activeBusiness && (
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                {activeBusiness.name} · {dues.length} pending
              </p>
            )}
          </div>
          <button
            onClick={() => fetchDues()}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              color: "#64748b",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── My summary cards ────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={12} style={{ color: "#ef4444" }} />
              <span className="text-xs" style={{ color: "#ef4444" }}>
                I owe
              </span>
            </div>
            <p
              className="text-xl font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "#f87171",
              }}
            >
              ৳{fmt(totalIOwe)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#7f1d1d" }}>
              {myDues.length} people
            </p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.15)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle size={12} style={{ color: "#10b981" }} />
              <span className="text-xs" style={{ color: "#10b981" }}>
                Owed to me
              </span>
            </div>
            <p
              className="text-xl font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "#10b981",
              }}
            >
              ৳{fmt(totalOwedToMe)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#064e3b" }}>
              {owedToMe.length} people
            </p>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: "#10b981" }}
            />
          </div>
        ) : dues.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: C.card, border: `1px dashed ${C.border}` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <CheckCircle2 size={20} style={{ color: "#334155" }} />
            </div>
            <p className="text-white text-sm font-medium mb-1">All clear!</p>
            <p className="text-xs" style={{ color: "#475569" }}>
              No pending dues in {activeBusiness?.name}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* I owe */}
            {myDues.length > 0 && (
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-3"
                  style={{ color: "#334155" }}
                >
                  <Clock size={10} style={{ color: "#ef4444" }} /> You need to
                  pay
                </p>
                <div className="space-y-2">
                  {myDues.map((due, i) => (
                    <DueCard
                      key={i}
                      due={due}
                      currentUserId={user?._id ?? ""}
                      onSettleAll={setSettlingDue}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Owed to me */}
            {owedToMe.length > 0 && (
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-3"
                  style={{ color: "#334155" }}
                >
                  <AlertCircle size={10} style={{ color: "#10b981" }} /> You'll
                  receive
                </p>
                <div className="space-y-2">
                  {owedToMe.map((due, i) => (
                    <DueCard
                      key={i}
                      due={due}
                      currentUserId={user?._id ?? ""}
                      onSettleAll={setSettlingDue}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Between others */}
            {otherDues.length > 0 && (
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-3"
                  style={{ color: "#334155" }}
                >
                  <Users size={10} /> Within team
                </p>
                <div className="space-y-2">
                  {otherDues.map((due, i) => (
                    <DueCard
                      key={i}
                      due={due}
                      currentUserId={user?._id ?? ""}
                      onSettleAll={setSettlingDue}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Settle Modal ───────────────────────── */}
      {settlingDue && (
        <QuickSettleModal
          due={settlingDue}
          onClose={() => setSettlingDue(null)}
          onDone={() => {
            setSettlingDue(null);
            fetchDues();
          }}
        />
      )}
    </div>
  );
};

export default PendingDuesPage;
