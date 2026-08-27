import { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeftRight,
  User,
  CreditCard,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import {
  transactionService,
  type ITransaction,
  type ISettlement,
} from "../../services/transaction.service";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { useBackHandler, useBodyScrollLock } from "../../native/hooks";

const C = {
  bg: "var(--bg)",
  modal: "var(--bg-elevated)",
  card: "var(--surface-1)",
  border: "var(--border)",
};

const SETTLE_META = {
  not_applicable: { color: "#475569", icon: null, labelKey: "settle.status.not_applicable" },
  pending: { color: "#f59e0b", icon: Clock, labelKey: "settle.status.pending" },
  partial: { color: "#3b82f6", icon: AlertCircle, labelKey: "settle.status.partial" },
  settled: { color: "#10b981", icon: CheckCircle2, labelKey: "settle.status.settled" },
};

/* ─── Props ───────────────────────────────────────────── */
interface Props {
  txn: ITransaction;
  open: boolean;
  onClose: () => void;
  onUpdate: (updated: ITransaction) => void;
}

const SettleModal = ({ txn, open, onClose, onUpdate }: Props) => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate, symbol } = useFormat();

  const [settlements, setSettlements] = useState<ISettlement[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const remaining = txn.amount - (txn.settledAmount ?? 0);
  const settleMeta = SETTLE_META[txn.settlementStatus];
  const SettleIcon = settleMeta.icon;

  /* ── load settlement history ──────────────────────── */
  useEffect(() => {
    if (!open) return;
    setHistLoading(true);
    transactionService
      .getSettlements(txn._id)
      .then(setSettlements)
      .catch(() => toast.error(t("settle.loadHistoryFailed")))
      .finally(() => setHistLoading(false));
  }, [open, txn._id, t]);

  /* ── pre-fill amount with remaining ──────────────── */
  useEffect(() => {
    if (open && txn.settlementStatus !== "settled") {
      setAmount(String(remaining));
    }
  }, [open]);

  // Hardware back dismisses the sheet before it navigates, and the page behind
  // it must not scroll while it is up.
  useBackHandler(open, onClose);
  useBodyScrollLock(open);

  if (!open) return null;

  /* ── submit ────────────────────────────────────────── */
  const handleSettle = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast.error(t("settle.invalidAmount"));
      return;
    }
    if (n > remaining) {
      toast.error(t("settle.maxAmount", { amount: money(remaining) }));
      return;
    }

    // paidTo = the person who originally paid (txn.member) — current user is paying them back
    const paidTo = txn.member._id;

    setSubmitting(true);
    try {
      const result = await transactionService.settle(txn._id, {
        amount: n,
        paidTo,
        note: note.trim() || undefined,
      });

      toast.success(
        result.status === "settled"
          ? t("settle.fullySettledToast")
          : t("settle.recordedToast", { amount: money(n), remaining: money(result.remaining) }),
      );

      // optimistic update the transaction
      const updated: ITransaction = {
        ...txn,
        settledAmount: result.settledAmount,
        settlementStatus: result.status,
      };
      onUpdate(updated);

      // refresh history
      const hist = await transactionService.getSettlements(txn._id);
      setSettlements(hist);

      setAmount("");
      setNote("");

      if (result.status === "settled") {
        setTimeout(onClose, 1200);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("settle.failed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadySettled = txn.settlementStatus === "settled";

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4 anim-scrim-in"
      style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(10px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden anim-sheet-up sm:animate-none"
        style={{
          background: C.modal,
          border: "1px solid var(--border-strong)",
          // dvh, not vh: with the soft keyboard up, vh keeps the pre-keyboard
          // height and pushes the action button off the bottom of the screen.
          maxHeight: "92dvh",
          overflowY: "auto",
          overscrollBehavior: "contain",
          paddingBottom: "var(--safe-bottom)",
          boxShadow: "var(--shadow-sheet)",
        }}
      >
        {/* Grab handle — signals "drag or tap outside to dismiss" the way an
            Android bottom sheet does. */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ background: "var(--border-strong)" }} />
        </div>
        {/* ── Header ──────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 sticky top-0 z-10"
          style={{
            background: C.modal,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.1)" }}
            >
              <ArrowLeftRight size={15} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("settle.title")}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                {t("settle.subtitle", { category: txn.category?.name ?? "", amount: money(txn.amount) })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg -mr-1.5"
            style={{ color: "var(--text-faint)", background: "var(--surface-3)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* ── Status overview ─────────────────────── */}
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background: `${settleMeta.color}08`,
              border: `1px solid ${settleMeta.color}25`,
            }}
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {SettleIcon && (
                  <SettleIcon size={13} style={{ color: settleMeta.color }} />
                )}
                <span
                  className="text-xs font-semibold"
                  style={{ color: settleMeta.color }}
                >
                  {t(settleMeta.labelKey)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    {t("settle.settled")}
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {money(txn.settledAmount ?? 0)}
                  </p>
                </div>
                <div style={{ color: "var(--text-faint)" }}>·</div>
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    {t("settle.remaining")}
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: isAlreadySettled ? "#10b981" : "#f59e0b" }}
                  >
                    {isAlreadySettled ? t("settle.cleared") : money(remaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                {num(Math.round(((txn.settledAmount ?? 0) / txn.amount) * 100))}%
              </span>
              <div
                className="w-20 h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--surface-4)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(((txn.settledAmount ?? 0) / txn.amount) * 100))}%`,
                    background: settleMeta.color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Who owes whom ────────────────────────── */}
          <div
            className="rounded-xl p-3 flex items-center gap-2"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #10b981, #0d9488)",
              }}
            >
              <span className="text-[10px] font-bold text-white">
                {txn.member?.firstName?.[0]}
                {txn.member?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {txn.member?.firstName} {txn.member?.lastName}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                {t("settle.paidLine", { amount: money(txn.amount) })}
              </p>
            </div>
          </div>

          {/* ── Settlement form ─────────────────────── */}
          {!isAlreadySettled && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {t("settle.recordPayment")}
              </p>

              {/* Amount */}
              <div>
                <label
                  className="block text-xs mb-1.5"
                  style={{ color: "var(--text-faint)" }}
                >
                  {t("settle.amountWithCurrency", { symbol })}
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {symbol}
                  </span>
                  <input
                    type="number" inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(remaining)}
                    min="1"
                    max={remaining}
                    className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none transition-all"
                    style={{
                      background: "var(--surface-3)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "rgba(16,185,129,0.4)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "var(--border-strong)";
                    }}
                  />
                </div>
                {/* Quick fill buttons */}
                <div className="flex gap-1.5 mt-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setAmount(String(Math.round((remaining * pct) / 100)))
                      }
                      className="flex-1 py-1 rounded-lg text-[11px] transition-all"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {num(pct)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label
                  className="block text-xs mb-1.5"
                  style={{ color: "var(--text-faint)" }}
                >
                  {t("settle.note")}
                </label>
                <div className="relative">
                  <StickyNote
                    size={13}
                    className="absolute left-3.5 top-3"
                    style={{ color: "var(--text-faint)" }}
                  />
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("settle.notePlaceholder")}
                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-slate-700 outline-none"
                    style={{
                      background: "var(--surface-3)",
                      border: "1px solid var(--border-strong)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "rgba(16,185,129,0.4)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "var(--border-strong)";
                    }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSettle}
                disabled={submitting || !amount}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 press disabled:opacity-50"
                style={{ background: "#10b981", color: "#022c22" }}
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    {t("settle.markPaid", { amount: money(parseFloat(amount) || 0) })}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Settled state CTA ────────────────────── */}
          {isAlreadySettled && (
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <CheckCircle2 size={18} style={{ color: "#10b981" }} />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("settle.fullySettled")}
                </p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {t("settle.allReimbursed", { amount: money(txn.amount) })}
                </p>
              </div>
            </div>
          )}

          {/* ── Settlement history ───────────────────── */}
          <div>
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "var(--text-faint)" }}
            >
              {t("settle.history")}
            </p>

            {histLoading ? (
              <div className="flex items-center justify-center py-5">
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ color: "var(--text-faint)" }}
                />
              </div>
            ) : settlements.length === 0 ? (
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {t("settle.noPayments")}
                </p>
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${C.border}` }}
              >
                {settlements.map((s, i) => (
                  <div
                    key={s._id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom:
                        i < settlements.length - 1
                          ? "1px solid var(--border-light)"
                          : "none",
                      background: "var(--surface-1)",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(16,185,129,0.1)" }}
                    >
                      <CreditCard size={12} style={{ color: "#10b981" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                        {s.paidBy?.firstName} → {s.paidTo?.firstName}
                        {s.note && (
                          <span style={{ color: "var(--text-faint)" }}> · {s.note}</span>
                        )}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                        {t("settle.historyLine", { date: fmtDate(s.createdAt), type: s.type })}
                      </p>
                    </div>
                    <p
                      className="text-xs font-semibold flex-shrink-0"
                      style={{ color: "#10b981" }}
                    >
                      {money(s.amount, { signed: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettleModal;
