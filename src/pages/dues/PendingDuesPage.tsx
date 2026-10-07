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
  Share2,
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
import { haptic } from "../../native/bridge";
import { shareViaWhatsApp } from "../../utils/share";

/* ─── Avatar ──────────────────────────────────────────── */
const Avatar = ({
  name,
  bgClass = "from-emerald-500 to-teal-600",
}: {
  name: string;
  bgClass?: string;
}) => (
  <div
    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-tr ${bgClass} text-white shadow-xs`}
  >
    <span className="text-xs font-bold leading-none">
      {name?.[0]?.toUpperCase() || "U"}
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
  const { t, language } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();

  const isMeFrom = due.from._id === currentUserId;
  const isMeTo = due.to._id === currentUserId;

  const directionColor = isMeFrom
    ? "text-rose-600 dark:text-rose-400"
    : "text-emerald-600 dark:text-emerald-400";
  const directionLabel = isMeFrom ? t("dues.youOwe") : t("dues.youreOwed");
  const directionBadge = isMeFrom
    ? "bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
    : "bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60";

  return (
    <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
      {/* ── Main row ────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {/* Avatars */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Avatar
              name={due.from.firstName}
              bgClass={
                isMeFrom
                  ? "from-rose-500 to-red-600"
                  : "from-blue-500 to-indigo-600"
              }
            />
            <ArrowRight size={12} className="text-slate-400 dark:text-neutral-500 shrink-0" />
            <Avatar
              name={due.to.firstName}
              bgClass={
                isMeTo
                  ? "from-emerald-500 to-teal-600"
                  : "from-purple-500 to-indigo-600"
              }
            />
          </div>

          {/* Names */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-slate-900 dark:text-neutral-100">
              <span className={isMeFrom ? "text-rose-600 dark:text-rose-400" : ""}>
                {isMeFrom ? t("dues.you") : due.from.firstName}
              </span>{" "}
              →{" "}
              <span className={isMeTo ? "text-emerald-600 dark:text-emerald-400" : ""}>
                {isMeTo ? t("dues.you") : due.to.firstName}
              </span>
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${directionBadge}`}
              >
                {directionLabel}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                {plural(t, "dues.txnCount", due.transactions.length, {
                  count: num(due.transactions.length),
                })}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <p className={`text-base sm:text-lg font-bold font-mono tracking-tight ${directionColor}`}>
              {money(due.amount)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {(isMeFrom || isMeTo) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:divide-neutral-800">
            {isMeFrom && (
              <button
                type="button"
                onClick={() => {
                  haptic("medium");
                  onSettleAll(due);
                }}
                className="flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-all select-none"
              >
                <CheckCircle2 size={14} />
                <span>{t("dues.markPaid")}</span>
              </button>
            )}
            {isMeTo && (
              <button
                type="button"
                onClick={() => {
                  haptic("light");
                  const debtorName = due.from.firstName || (language === "en" ? "Friend" : "বন্ধু");
                  const msg =
                    language === "en"
                      ? `Hello ${debtorName},\nYou have an outstanding due of ${money(due.amount)} in HisabBoi. Please settle the amount. Thank you!`
                      : `আসসালামু আলাইকুম ${debtorName},\nহিসাববই অ্যাপে আপনার কাছে ${money(due.amount)} টাকা বকেয়া রয়েছে। অনুগ্রহ করে হিসাবটি পরিশোধ করুন। ধন্যবাদ!`;
                  shareViaWhatsApp(msg);
                }}
                className="flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition-all select-none"
              >
                <Share2 size={14} />
                <span>{t("personalDashboard.sendReminder")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                haptic("selection");
                setExpanded((p) => !p);
              }}
              className="flex items-center gap-1 px-3.5 h-9 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 active:scale-95 transition-all select-none"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <span>{t("dues.details")}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded transaction list ────────────────── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 divide-y divide-slate-100 dark:divide-neutral-800">
          {due.transactions.map((txn: IDueTransaction) => (
            <div
              key={txn._id}
              className="flex items-center justify-between px-4 sm:px-5 py-2.5 text-xs"
            >
              <div className="min-w-0 pr-2">
                <p className="font-medium text-slate-800 dark:text-neutral-200 truncate">
                  {txn.note ?? t("dues.noNote")}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500">
                  {fmtDate(txn.date, "short")}
                </p>
              </div>
              <p className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                {money(txn.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Quick Settle Modal ─────────────────────────────── */
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

  const handleSettle = async () => {
    setSubmitting(true);
    try {
      await Promise.all(
        due.transactions.map((txn) =>
          transactionService.settle(txn._id, {
            amount: txn.amount,
            paidTo: due.to._id,
            note: note.trim() || undefined,
          })
        )
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
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} />
        </div>

        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-neutral-100 mb-1">
          {t("dues.settleTitle", { amount: money(due.amount) })}
        </h3>
        <p className="text-xs text-center text-slate-500 dark:text-neutral-400 mb-5">
          {plural(t, "dues.settle", due.transactions.length, {
            name: due.to.firstName,
            count: num(due.transactions.length),
          })}
        </p>

        {/* Note */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">
            {t("dues.paymentNote")}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("dues.paymentNotePlaceholder")}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 active:scale-95 transition-all"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSettle}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-95 transition-all"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : t("common.confirm")}
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
    (d) => d.from._id !== user?._id && d.to._id !== user?._id
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
    <div className="min-h-screen bg-[var(--bg)] pb-28 text-slate-900 dark:text-neutral-100">
      <div className="max-w-2xl mx-auto px-4 py-4 lg:px-8 lg:py-6 space-y-4">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("dues.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {t("dues.pendingCount", { count: num(dues.length) })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("light");
              fetchDues();
            }}
            aria-label="Refresh dues"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 active:scale-95 transition-all shadow-xs"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── My summary cards ────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1 text-rose-600 dark:text-rose-400">
              <Clock size={13} />
              <span className="text-xs font-semibold">{t("dues.iOwe")}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {money(totalIOwe)}
            </p>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5 font-medium">
              {plural(t, "dues.peopleCount", myDues.length, {
                count: num(myDues.length),
              })}
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
              <AlertCircle size={13} />
              <span className="text-xs font-semibold">{t("dues.owedToMe")}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {money(totalOwedToMe)}
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 font-medium">
              {plural(t, "dues.peopleCount", owedToMe.length, {
                count: num(owedToMe.length),
              })}
            </p>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : dues.length === 0 ? (
          <div className="rounded-3xl p-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-slate-200 dark:border-neutral-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 mb-0.5">
              {t("dues.allClear")}
            </p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {t("dues.noPending", { business: activeBusiness?.name ?? "" })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* I owe */}
            {myDues.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-1">
                  <Clock size={12} className="text-rose-500" />
                  <span>{t("dues.youNeedToPay")}</span>
                </p>
                <div className="space-y-2.5">
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
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-1">
                  <AlertCircle size={12} className="text-emerald-500" />
                  <span>{t("dues.youWillReceive")}</span>
                </p>
                <div className="space-y-2.5">
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
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-1">
                  <Users size={12} className="text-slate-400" />
                  <span>{t("dues.withinTeam")}</span>
                </p>
                <div className="space-y-2.5">
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
