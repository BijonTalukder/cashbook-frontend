import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Plus, TrendingUp, TrendingDown, ArrowLeftRight,
  Pencil, Trash2, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw, MoreVertical, CheckCircle2,
  Clock, AlertCircle, HandCoins,
} from "lucide-react";
import { toast } from "sonner";
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

/* ─── Design tokens ───────────────────────────────────── */
const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  border: "var(--border)",
};

/* ─── Helpers ─────────────────────────────────────────── */
const TYPE_META = {
  income: { color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: TrendingUp, sign: "+" },
  expense: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: TrendingDown, sign: "-" },
  transfer: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: ArrowLeftRight, sign: "" },
};

const SETTLE_META = {
  not_applicable: { color: "var(--text-faint)", icon: null, labelKey: "" },
  pending: { color: "#f59e0b", icon: Clock, labelKey: "settle.status.pending" },
  partial: { color: "#3b82f6", icon: AlertCircle, labelKey: "settle.status.partial" },
  settled: { color: "#10b981", icon: CheckCircle2, labelKey: "settle.status.settled" },
};

/* ─── Transaction Row ─────────────────────────────────── */
const TxnRow = ({
  txn, onEdit, onDelete, onSettle, isMass = false,
}: {
  txn: ITransaction;
  onEdit: (t: ITransaction) => void;
  onDelete: (t: ITransaction) => void;
  onSettle: (t: ITransaction) => void;
  isMass?: boolean;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Menu position is computed from the trigger's bounding rect each time it
  // opens. Portalling out of the row is the only way to escape the card's
  // `overflow-hidden` clipping — the absolute-positioned dropdown was
  // getting sliced at the card edge, hiding the Edit / Delete rows.
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat();
  const meta = TYPE_META[txn.type];
  const settle = SETTLE_META[txn.settlementStatus];
  const SettleIcon = settle.icon;
  const canSettle = ["pending", "partial"].includes(txn.settlementStatus);

  const openMenu = () => {
    const btn = triggerRef.current;
    if (!btn) { setMenuOpen((p) => !p); return; }
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen((p) => !p);
  };

  // The portal lives at <body>, so it doesn't move with the page. Recompute
  // its anchor on every scroll/resize, otherwise the menu drifts away from
  // the trigger row as the user keeps scrolling. Don't close on scroll —
  // some browsers fire a scroll event right after a button click (focus
  // scroll, ripple scroll), which would yank the menu closed immediately.
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
    <div
      className="flex items-center gap-3 px-4 py-3.5 transition-all group"
      style={{ borderBottom: "1px solid var(--border-light)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Type icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: meta.bg, color: meta.color }}
      >
        <meta.icon size={16} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 scroll-x snap-x-rail -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {txn.category?.name ?? t("product.uncategorized")}
            {txn.category?.icon && <span className="ml-1">{txn.category.icon}</span>}
          </p>
          {/* Settlement badge */}
          {txn.settlementStatus !== "not_applicable" && SettleIcon && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
              style={{
                background: `${settle.color}12`,
                border: `1px solid ${settle.color}25`,
                color: settle.color,
              }}
            >
              <SettleIcon size={10} />
              <span className="text-xs font-semibold">{settle.labelKey ? t(settle.labelKey) : ""}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>{fmtDate(txn.date)}</span>
          {txn.note && (
            <>
              <span style={{ color: "var(--text-faint)" }}>·</span>
              <span className="text-xs truncate max-w-[140px]" style={{ color: "var(--text-faint)" }}>
                {txn.note}
              </span>
            </>
          )}
          {txn.toMember && (
            <>
              <span style={{ color: "var(--text-faint)" }}>·</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("transactions.toMember", { name: txn.toMember.firstName })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Member avatar */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
        >
          <span className="text-xs font-bold text-white">
            {txn.member?.firstName?.[0]}{txn.member?.lastName?.[0]}
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          {txn.member?.firstName}
        </span>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0 min-w-[80px]">
        <p className="text-sm font-semibold" style={{ color: meta.color }}>
          {money(txn.type === "expense" ? -txn.amount : txn.amount, { signed: txn.type === "income" })}
        </p>
        {txn.settlementStatus === "partial" && (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t("transactions.partialPaid", { amount: money(txn.settledAmount) })}
          </p>
        )}
      </div>

      {/* ── Action menu ─────────────────────────────── */}
      <div className="relative flex-shrink-0">
        <button
          ref={triggerRef}
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          style={{ color: "var(--text-muted)", background: "var(--surface-3)" }}
        >
          <MoreVertical size={14} />
        </button>

        {menuOpen && menuPos && createPortal(
          <>
            <div className="fixed inset-0 z-[290]" onClick={() => setMenuOpen(false)} />
            <div
              role="menu"
              className="fixed w-40 rounded-xl overflow-hidden z-[295]"
              style={{
                top: menuPos.top,
                right: menuPos.right,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {canSettle && (
                <button
                  onClick={() => { onSettle(txn); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all"
                  style={{ color: "#10b981" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <HandCoins size={13} /> {t("transactions.settle")}
                </button>
              )}
              {txn.settlementStatus === "settled" && (
                <button
                  onClick={() => { onSettle(txn); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <CheckCircle2 size={13} /> {t("transactions.viewSettlement")}
                </button>
              )}
              <button
                onClick={() => { onEdit(txn); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Pencil size={13} /> {t("common.edit")}
              </button>
              <button
                onClick={() => { onDelete(txn); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all"
                style={{ color: "#f87171" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Trash2 size={13} /> {t("common.delete")}
              </button>
            </div>
          </>,
          document.body,
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

  const fetchTxns = useCallback(async (p = 1) => {
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
  }, [activeBusiness, typeFilter, t]);

  useEffect(() => { fetchTxns(1); setPage(1); }, [fetchTxns]);

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
      setTransactions((prev) => prev.map((t) => t._id === txn._id ? txn : t));
    } else {
      setTransactions((prev) => [txn, ...prev]);
    }
  };

  const handleSettleUpdate = (updated: ITransaction) => {
    setTransactions((prev) => prev.map((t) => t._id === updated._id ? updated : t));
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await transactionService.delete(deleting._id);
      setTransactions((prev) => prev.filter((t) => t._id !== deleting._id));
      toast.success(t("transactions.deleted"));
    } catch {
      toast.error(t("transactions.deleteFailed"));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8 space-y-5">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="text-2xl font-bold truncate"
              style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
            >
              {t("transactions.title")}
            </h1>
            {activeBusiness && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                {plural(t, "transactions.subtitle", total, {
                  business: activeBusiness.name,
                  count: num(total),
                })}
                {isMass && <span style={{ color: "#8b5cf6" }}>{t("transactions.messTag")}</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => fetchTxns(page)}
              aria-label={t("common.refresh")}
              className="w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 press"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: "var(--text-muted)" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => openAdd("income")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium press"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}
            >
              <TrendingUp size={13} /> {t("txn.income")}
            </button>
            <button
              onClick={() => openAdd("expense")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium press"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
            >
              <TrendingDown size={13} /> {t("txn.expense")}
            </button>
            <button
              onClick={() => openAdd("expense")}
              className="sm:hidden flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-semibold flex-shrink-0 press"
              style={{ background: "#10b981", color: "#022c22" }}
            >
              <Plus size={14} /> {t("common.add")}
            </button>
          </div>
        </div>

        {/* ── Summary cards ────────────────────────────── */}
        {summary && !failed && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "income", label: t("txn.income"), value: summary.totalIncome, color: "#10b981", icon: ArrowUpRight },
              { key: "expense", label: t("txn.expense"), value: summary.totalExpense, color: "#ef4444", icon: ArrowDownRight },
              {
                key: "balance",
                label: t("common.balance"),
                value: summary.balance,
                color: summary.balance >= 0 ? "#10b981" : "#ef4444",
                icon: summary.balance >= 0 ? ArrowUpRight : ArrowDownRight,
              },
            ].map(({ key, label, value, color, icon: Icon }) => (
              <div
                key={key}
                className="rounded-2xl p-3 sm:p-4 min-w-0"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] sm:text-xs truncate" style={{ color: "var(--text-faint)" }}>
                    {label}
                  </span>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, color }}
                  >
                    <Icon size={12} />
                  </div>
                </div>
                <p
                  className="text-[15px] sm:text-lg font-bold truncate tabular-nums"
                  style={{ fontFamily: "'DM Serif Display', serif", color }}
                >
                  {money(Math.abs(value))}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Type filter pills ────────────────────────── */}
        <div className="flex items-center gap-2 scroll-x snap-x-rail -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {[
            { label: t("transactions.filterAll"), value: "" },
            { label: t("txn.income"), value: "income" },
            { label: t("txn.expense"), value: "expense" },
            { label: t("txn.transfer"), value: "transfer" },
          ].map(({ label, value }) => {
            const isActive = typeFilter === value;
            const color = value ? TYPE_META[value as TxnType]?.color : "#10b981";
            return (
              <button
                key={value}
                onClick={() => {
                  haptic("selection");
                  setTypeFilter(value as TxnType | "");
                }}
                className="px-3.5 h-9 flex-shrink-0 rounded-xl text-xs font-medium press whitespace-nowrap"
                style={{
                  background: isActive ? `${color}15` : C.card,
                  border: `1px solid ${isActive ? `${color}35` : C.border}`,
                  color: isActive ? color : "var(--text-muted)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Transaction list ─────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin" style={{ color: "#10b981" }} />
            </div>
          ) : !activeBusiness ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                {t("transactions.selectBusiness")}
              </p>
            </div>
          ) : failed ? (
            <LoadFailedState onRetry={() => fetchTxns(page)} />
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--surface-2)" }}
              >
                <ArrowLeftRight size={20} style={{ color: "var(--text-faint)" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{t("transactions.empty")}</p>
              <p className="text-xs mb-5" style={{ color: "var(--text-faint)" }}>
                {t("transactions.emptyHint")}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => openAdd("income")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}
                >
                  <TrendingUp size={13} /> {isMass ? t("txn.addDeposit") : t("transactions.addIncome")}
                </button>
                <button
                  onClick={() => openAdd("expense")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
                >
                  <TrendingDown size={13} /> {isMass ? t("txn.addCost") : t("transactions.addExpense")}
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
                  onDelete={setDeleting}
                  onSettle={openSettle}
                  isMass={isMass}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: "1px solid var(--border-light)" }}
                >
                  <button
                    onClick={() => { const p = page - 1; setPage(p); fetchTxns(p); }}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-xl text-xs disabled:opacity-40"
                    style={{ background: "var(--surface-2)", border: `1px solid ${C.border}`, color: "var(--text-secondary)" }}
                  >
                    {t("common.previous")}
                  </button>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {t("transactions.pageOf", { page: num(page), total: num(totalPages) })}
                  </span>
                  <button
                    onClick={() => { const p = page + 1; setPage(p); fetchTxns(p); }}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-xl text-xs disabled:opacity-40"
                    style={{ background: "var(--surface-2)", border: `1px solid ${C.border}`, color: "var(--text-secondary)" }}
                  >
                    {t("common.next")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile FAB ───────────────────────────────── */}
      <div
        className="lg:hidden fixed flex flex-col z-40"
        style={{
          // Stacks upward from the assistant button's slot rather than a fixed
          // offset, so the two no longer overlap on short screens.
          bottom: "var(--fab-slot-1)",
          right: "var(--fab-right)",
          gap: "var(--fab-gap)",
        }}
      >
        <button
          onClick={() => openAdd("income")}
          aria-label={t("txn.income")}
          className="rounded-2xl flex items-center justify-center press"
          style={{
            width: "var(--fab-size)",
            height: "var(--fab-size)",
            background: "#10b981",
            boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
          }}
        >
          <TrendingUp size={22} className="text-emerald-950" />
        </button>
        <button
          onClick={() => openAdd("expense")}
          aria-label={t("txn.expense")}
          className="rounded-2xl flex items-center justify-center press"
          style={{
            width: "var(--fab-size)",
            height: "var(--fab-size)",
            background: "#ef4444",
            boxShadow: "0 8px 24px rgba(239,68,68,0.35)",
          }}
        >
          <TrendingDown size={22} className="text-white" />
        </button>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────── */}
      <TxnModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSuccess={handleSuccess}
        editing={editing}
        defaultType={defaultType}
        isMass={isMass}
      />

      {/* ── Settle Modal ─────────────────────────────── */}
      {settling && (
        <SettleModal
          txn={settling}
          open={!!settling}
          onClose={() => setSettling(null)}
          onUpdate={handleSettleUpdate}
        />
      )}

      {/* ── Delete confirm ───────────────────────────── */}
      {deleting && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "var(--overlay-scrim)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(239,68,68,0.1)" }}
            >
              <Trash2 size={18} style={{ color: "#ef4444" }} />
            </div>
            <p className="text-center font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{t("transactions.deleteQuestion")}</p>
            <p className="text-xs text-center mb-5" style={{ color: "var(--text-faint)" }}>
              {t("transactions.deleteSummary", {
                amount: money(deleting.amount),
                category: deleting.category?.name ?? "",
              })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--surface-3)", border: `1px solid ${C.border}`, color: "var(--text-secondary)" }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#ef4444", color: "#fff" }}
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