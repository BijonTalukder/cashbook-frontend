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
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";

const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  border: "var(--border)",
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
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const isMeFrom = due.from._id === currentUserId;
  const isMeTo = due.to._id === currentUserId;

  // "I owe": isMeFrom
  // "I'm owed": isMeTo
  const directionColor = isMeFrom ? "#ef4444" : "#10b981";
  const directionLabel = isMeFrom ? t("dues.youOwe") : t("dues.youreOwed");
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
            <ArrowRight size={12} style={{ color: "var(--text-faint)" }} />
            <Avatar
              name={due.to.firstName}
              color={
                isMeTo ? "135deg,#10b981,#0d9488" : "135deg,#8b5cf6,#7c3aed"
              }
            />
          </div>

          {/* Names */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              <span
                style={{ color: isMeFrom ? "#f87171" : "var(--text-secondary)" }}
              >
                {isMeFrom ? t("dues.you") : due.from.firstName}
              </span>{" "}
              →{" "}
              <span
                style={{ color: isMeTo ? "#10b981" : "var(--text-secondary)" }}
              >
                {isMeTo ? t("dues.you") : due.to.firstName}
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
              <span
                className="text-[10px]"
                style={{ color: "var(--text-faint)" }}
              >
                {plural(t, "dues.txnCount", due.transactions.length, {
                  count: num(due.transactions.length),
                })}
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
              {money(due.amount)}
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
                <CheckCircle2 size={13} /> {t("dues.markPaid")}
              </button>
            )}
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs transition-all"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {t("dues.details")}
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded transaction list ────────────────── */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-light)" }}>
          {due.transactions.map((txn: IDueTransaction, i: number) => (
            <div
              key={txn._id}
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom:
                  i < due.transactions.length - 1
                    ? "1px solid var(--border-light)"
                    : "none",
              }}
            >
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {txn.note ?? t("dues.noNote")}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-faint)" }}
                >
                  {fmtDate(txn.date, "short")}
                </p>
              </div>
              <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                {money(txn.amount)}
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
  const { t } = useTranslation();
  const { money, num } = useFormat();

  // Settle all transactions in this due group
  const handleSettle = async () => {
    setSubmitting(true);
    try {
      // Settle each transaction's remaining amount
      await Promise.all(
        due.transactions.map((txn) =>
          transactionService.settle(txn._id, {
            amount: txn.amount,
            paidTo: due.to._id,
            note: note.trim() || undefined,
          }),
        ),
      );
      toast.success(t("dues.settled", { amount: money(due.amount) }));
      onDone();
    } catch {
      toast.error(t("dues.settleFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{
        background: "var(--overlay-scrim)",
        backdropFilter: "blur(10px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(16,185,129,0.1)" }}
        >
          <CheckCircle2 size={22} style={{ color: "#10b981" }} />
        </div>

        <h3
          className="text-lg font-bold text-center mb-1"
          style={{
            fontFamily: "'DM Serif Display', serif",
            color: "var(--text-primary)",
          }}
        >
          {t("dues.settleTitle", { amount: money(due.amount) })}
        </h3>
        <p
          className="text-xs text-center mb-5"
          style={{ color: "var(--text-faint)" }}
        >
          {plural(t, "dues.settle", due.transactions.length, {
            name: due.to.firstName,
            count: num(due.transactions.length),
          })}
        </p>

        {/* Note */}
        <div className="mb-4">
          <label
            className="block text-xs mb-1.5"
            style={{ color: "var(--text-faint)" }}
          >
            {t("dues.paymentNote")}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("dues.paymentNotePlaceholder")}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "var(--surface-3)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {t("common.cancel")}
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
              t("common.confirm")
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
  const { t } = useTranslation();
  const { money, num } = useFormat();

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
      toast.error(t("dues.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, t]);

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
              className="text-2xl font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "var(--text-primary)",
              }}
            >
              {t("dues.title")}
            </h1>
            {activeBusiness && (
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-faint)" }}
              >
                {t("dues.subtitle", { business: activeBusiness.name, count: num(dues.length) })}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchDues()}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              color: "var(--text-muted)",
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
                {t("dues.iOwe")}
              </span>
            </div>
            <p
              className="text-xl font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "#f87171",
              }}
            >
              {money(totalIOwe)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#7f1d1d" }}>
              {plural(t, "dues.peopleCount", myDues.length, { count: num(myDues.length) })}
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
                {t("dues.owedToMe")}
              </span>
            </div>
            <p
              className="text-xl font-bold"
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: "#10b981",
              }}
            >
              {money(totalOwedToMe)}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#064e3b" }}>
              {plural(t, "dues.peopleCount", owedToMe.length, { count: num(owedToMe.length) })}
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
              style={{ background: "var(--surface-2)" }}
            >
              <CheckCircle2 size={20} style={{ color: "var(--text-faint)" }} />
            </div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {t("dues.allClear")}
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              {t("dues.noPending", { business: activeBusiness?.name ?? "" })}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* I owe */}
            {myDues.length > 0 && (
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-3"
                  style={{ color: "var(--text-faint)" }}
                >
                  <Clock size={10} style={{ color: "#ef4444" }} /> {t("dues.youNeedToPay")}
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
                  style={{ color: "var(--text-faint)" }}
                >
                  <AlertCircle size={10} style={{ color: "#10b981" }} /> {t("dues.youWillReceive")}
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
                  style={{ color: "var(--text-faint)" }}
                >
                  <Users size={10} /> {t("dues.withinTeam")}
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
