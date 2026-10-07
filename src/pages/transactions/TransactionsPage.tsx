import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  HandCoins,
} from "lucide-react";
import { useBusinessStore } from "../../store/businessStore";
import {
  transactionService,
  type ITransaction,
  type ITxnSummary,
  type TxnType,
} from "../../services/transaction.service";
import TxnModal from "../../components/shared/TxnModal";
import SettleModal from "../../components/shared/SettleModal";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";
import LoadFailedState from "../../components/shared/LoadFailedState";
import { toastLoadFailure } from "../../offline/notify";
import { haptic } from "../../native/bridge";

/* ─── Helpers ─────────────────────────────────────────── */
const TYPE_META = {
  income: {
    badgeClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    textClass: "text-emerald-600 dark:text-emerald-400",
    icon: TrendingUp,
    sign: "+",
  },
  expense: {
    badgeClass: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/60",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    textClass: "text-rose-600 dark:text-rose-400",
    icon: TrendingDown,
    sign: "-",
  },
  transfer: {
    badgeClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    textClass: "text-blue-600 dark:text-blue-400",
    icon: ArrowLeftRight,
    sign: "",
  },
};

const SETTLE_META = {
  not_applicable: { badgeClass: "", icon: null, labelKey: "" },
  pending: {
    badgeClass: "bg-amber-50 text-amber-600 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
    icon: Clock,
    labelKey: "settle.status.pending",
  },
  partial: {
    badgeClass: "bg-blue-50 text-blue-600 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60",
    icon: AlertCircle,
    labelKey: "settle.status.partial",
  },
  settled: {
    badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
    icon: CheckCircle2,
    labelKey: "settle.status.settled",
  },
};

/* ─── Transaction Row ─────────────────────────────────── */
const TxnRow = ({
  txn,
  onEdit,
  onDelete,
  onSettle,
  isMass = false,
}: {
  txn: ITransaction;
  onEdit: (t: ITransaction) => void;
  onDelete: (t: ITransaction) => void;
  onSettle: (t: ITransaction) => void;
  isMass?: boolean;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat();
  const meta = TYPE_META[txn.type] || TYPE_META.expense;
  const settle = SETTLE_META[txn.settlementStatus] || SETTLE_META.not_applicable;
  const SettleIcon = settle.icon;
  const canSettle = ["pending", "partial"].includes(txn.settlementStatus);

  const openMenu = () => {
    const btn = triggerRef.current;
    if (!btn) {
      setMenuOpen((p) => !p);
      return;
    }
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen((p) => !p);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const reposition = () => {
      const btn = triggerRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors select-none">
      {/* Type icon */}
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.iconBg}`}
      >
        <meta.icon size={18} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
            {txn.category?.name ?? t("product.uncategorized")}
            {txn.category?.icon && <span className="ml-1">{txn.category.icon}</span>}
          </p>
          {/* Settlement badge */}
          {txn.settlementStatus !== "not_applicable" && SettleIcon && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${settle.badgeClass}`}
            >
              <SettleIcon size={10} />
              <span>{settle.labelKey ? t(settle.labelKey) : ""}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[12px] text-slate-500 dark:text-neutral-400">
            {fmtDate(txn.date)}
          </span>
          {txn.note && (
            <>
              <span className="text-slate-300 dark:text-neutral-600">•</span>
              <span className="text-[12px] text-slate-500 dark:text-neutral-400 truncate max-w-[180px]">
                {txn.note}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <p className={`text-sm sm:text-base font-bold font-mono ${meta.textClass}`}>
          {meta.sign}
          {money(txn.amount)}
        </p>

        {/* Menu button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={openMenu}
          aria-label="Actions"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
        >
          <MoreVertical size={16} />
        </button>

        {/* Action menu portal */}
        {menuOpen &&
          menuPos &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-[290]"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="fixed w-44 rounded-2xl overflow-hidden z-[295] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl py-1 divide-y divide-slate-100 dark:divide-neutral-800"
                style={{
                  top: menuPos.top,
                  right: menuPos.right,
                }}
              >
                {canSettle && (
                  <button
                    onClick={() => {
                      onSettle(txn);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  >
                    <HandCoins size={14} /> {t("transactions.settle")}
                  </button>
                )}
                {txn.settlementStatus === "settled" && (
                  <button
                    onClick={() => {
                      onSettle(txn);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <CheckCircle2 size={14} /> {t("transactions.viewSettlement")}
                  </button>
                )}
                <button
                  onClick={() => {
                    onEdit(txn);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Pencil size={14} /> {t("common.edit")}
                </button>
                <button
                  onClick={() => {
                    onDelete(txn);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 size={14} /> {t("common.delete")}
                </button>
              </div>
            </>,
            document.body
          )}
      </div>
    </div>
  );
};

/* ─── Transactions Page ───────────────────────────────── */
const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeBusiness } = useBusinessStore();
  const { t } = useTranslation();
  const { money, num } = useFormat();
  const isMass = activeBusiness?.type === "mass";

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [summary, setSummary] = useState<ITxnSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [typeFilter, setTypeFilter] = useState<TxnType | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ITransaction | null>(null);
  const [defaultType, setDefaultType] = useState<TxnType>("expense");
  const [failed, setFailed] = useState(false);
  const [deleting, setDeleting] = useState<ITransaction | null>(null);
  const [settling, setSettling] = useState<ITransaction | null>(null);

  const fetchTxns = useCallback(
    async (p = 1) => {
      if (!activeBusiness) return;
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(p), limit: "20" };
        if (typeFilter) params.type = typeFilter;
        const result = await transactionService.getAll(activeBusiness._id, params);
        setTransactions(result.transactions);
        setSummary(result.summary);
        setTotalPages(result.pagination.totalPages);
        setTotal(result.pagination.total);
        setFailed(false);
      } catch {
        setFailed(true);
        toastLoadFailure(t("transactions.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [activeBusiness, typeFilter, t]
  );

  useEffect(() => {
    fetchTxns(1);
    setPage(1);
  }, [fetchTxns]);

  // Handle ?type= from quick actions / dashboard
  useEffect(() => {
    const paramType = searchParams.get("type") as TxnType | null;
    if (paramType && ["income", "expense", "transfer"].includes(paramType)) {
      setDefaultType(paramType);
      setModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const openAdd = (type: TxnType) => {
    haptic("medium");
    setEditing(null);
    setDefaultType(type);
    setModalOpen(true);
  };
  const openEdit = (txn: ITransaction) => {
    haptic("light");
    setEditing(txn);
    setDefaultType(txn.type);
    setModalOpen(true);
  };
  const openSettle = (txn: ITransaction) => {
    haptic("light");
    setSettling(txn);
  };

  const handleSuccess = (txn: ITransaction) => {
    if (editing) {
      setTransactions((prev) => prev.map((t) => (t._id === txn._id ? txn : t)));
    } else {
      setTransactions((prev) => [txn, ...prev]);
    }
  };

  const handleSettleUpdate = (updated: ITransaction) => {
    setTransactions((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await transactionService.delete(deleting._id);
      setTransactions((prev) => prev.filter((t) => t._id !== deleting._id));
      setDeleting(null);
    } catch {
      toastLoadFailure(t("transactions.deleteFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 text-slate-900 dark:text-neutral-100">
      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
              {t("transactions.title")}
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              {t("transactions.txnCount", { count: num(total) })}
              {isMass && (
                <span className="text-purple-600 dark:text-purple-400 font-semibold ml-1">
                  {t("transactions.messTag")}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fetchTxns(page)}
              aria-label={t("common.refresh")}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 active:scale-95 transition-all shadow-xs"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => openAdd("income")}
              className="hidden sm:flex items-center gap-1.5 px-3.5 h-10 rounded-2xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 active:scale-95 transition-all shadow-xs select-none"
            >
              <TrendingUp size={14} />
              <span>{t("txn.income")}</span>
            </button>
            <button
              type="button"
              onClick={() => openAdd("expense")}
              className="hidden sm:flex items-center gap-1.5 px-3.5 h-10 rounded-2xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80 active:scale-95 transition-all shadow-xs select-none"
            >
              <TrendingDown size={14} />
              <span>{t("txn.expense")}</span>
            </button>
            <button
              type="button"
              onClick={() => openAdd("expense")}
              className="sm:hidden flex items-center gap-1.5 px-3.5 h-10 rounded-2xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all shrink-0 select-none"
            >
              <Plus size={15} />
              <span>{t("common.add")}</span>
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        {summary && !failed && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate">
                  {t("txn.income")}
                </span>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={13} />
                </div>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
                {money(summary.totalIncome)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate">
                  {t("txn.expense")}
                </span>
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ArrowDownRight size={13} />
                </div>
              </div>
              <p className="text-sm sm:text-lg font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 truncate">
                {money(summary.totalExpense)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate">
                  {t("common.balance")}
                </span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    summary.balance >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {summary.balance >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                </div>
              </div>
              <p
                className={`text-sm sm:text-lg font-bold font-mono tracking-tight truncate ${
                  summary.balance >= 0
                    ? "text-slate-900 dark:text-neutral-100"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {money(summary.balance)}
              </p>
            </div>
          </div>
        )}

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { label: t("transactions.filterAll"), value: "" },
              { label: t("txn.income"), value: "income" },
              { label: t("txn.expense"), value: "expense" },
              { label: t("txn.transfer"), value: "transfer" },
            ] as const
          ).map(({ label, value }) => {
            const isActive = typeFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  haptic("selection");
                  setTypeFilter(value as TxnType | "");
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? "bg-slate-900 dark:bg-neutral-100 text-white dark:text-slate-900 shadow-sm"
                    : "bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 border border-slate-200/80 dark:border-neutral-800 hover:border-slate-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Transaction List Surface */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : !activeBusiness ? (
            <div className="text-center py-16 px-4">
              <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400">
                {t("transactions.selectBusiness")}
              </p>
            </div>
          ) : failed ? (
            <LoadFailedState onRetry={() => fetchTxns(page)} />
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-slate-400 dark:text-neutral-500">
                <ArrowLeftRight size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  {t("transactions.empty")}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  {t("transactions.emptyHint")}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => openAdd("income")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 active:scale-95 transition-all"
                >
                  + {t("txn.income")}
                </button>
                <button
                  type="button"
                  onClick={() => openAdd("expense")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800 active:scale-95 transition-all"
                >
                  + {t("txn.expense")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {transactions.map((txn) => (
                <TxnRow
                  key={txn._id}
                  txn={txn}
                  onEdit={openEdit}
                  onDelete={(t) => setDeleting(t)}
                  onSettle={openSettle}
                  isMass={isMass}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-slate-50/50 dark:bg-neutral-900/50">
                  <button
                    type="button"
                    onClick={() => {
                      const p = page - 1;
                      setPage(p);
                      fetchTxns(p);
                    }}
                    disabled={page <= 1}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {t("common.previous")}
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                    {t("transactions.pageOf", { page: num(page), total: num(totalPages) })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const p = page + 1;
                      setPage(p);
                      fetchTxns(p);
                    }}
                    disabled={page >= totalPages}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {t("common.next")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <div
        className="lg:hidden fixed flex flex-col z-40"
        style={{
          bottom: "var(--fab-slot-1)",
          right: "var(--fab-right)",
          gap: "var(--fab-gap)",
        }}
      >
        <button
          type="button"
          onClick={() => openAdd("income")}
          aria-label={t("txn.income")}
          className="rounded-2xl flex items-center justify-center bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
          style={{
            width: "var(--fab-size)",
            height: "var(--fab-size)",
          }}
        >
          <TrendingUp size={22} />
        </button>
        <button
          type="button"
          onClick={() => openAdd("expense")}
          aria-label={t("txn.expense")}
          className="rounded-2xl flex items-center justify-center bg-rose-500 text-white shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
          style={{
            width: "var(--fab-size)",
            height: "var(--fab-size)",
          }}
        >
          <TrendingDown size={22} />
        </button>
      </div>

      {/* Add / Edit Modal */}
      <TxnModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSuccess={handleSuccess}
        editing={editing}
        defaultType={defaultType}
        isMass={isMass}
      />

      {/* Settle Modal */}
      {settling && (
        <SettleModal
          txn={settling}
          open={!!settling}
          onClose={() => setSettling(null)}
          onUpdate={handleSettleUpdate}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleting && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>
            <p className="text-center font-bold text-base text-slate-900 dark:text-neutral-100 mb-1">
              {t("transactions.deleteQuestion")}
            </p>
            <p className="text-xs text-center text-slate-500 dark:text-neutral-400 mb-5">
              {t("transactions.deleteSummary", {
                amount: money(deleting.amount),
                category: deleting.category?.name ?? "",
              })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 active:scale-95 transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;