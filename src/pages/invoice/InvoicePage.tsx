import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Filter,
  Loader2,
  Trash2,
  Eye,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import {
  transactionService,
  type ITxnCategory,
} from "../../services/transaction.service";
import {
  invoiceService,
  type IInvoiceListItem,
} from "../../services/Invoice.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { confirmAction } from "../../components/ui/confirm";
import LoadFailedState from "../../components/shared/LoadFailedState";
import { useRefreshHandler } from "../../native/refresh";
import { toastLoadFailure } from "../../offline/notify";

const C = {
  bg: "var(--bg)",
  card: "var(--surface-1)",
  border: "var(--border)",
};
const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
type FilterType = "all" | "income" | "expense" | "transfer";

interface Tx {
  _id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  category: { _id: string; name: string } | null;
  note?: string;
  member: { _id: string; firstName: string; lastName: string } | null;
}

/* ── Custom Category Dropdown ──────────────────────── */
const CategorySelect = ({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: ITxnCategory[];
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = categories.find((c) => c._id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { t } = useTranslation();

  const selCls =
    "w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text-primary)]";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={selCls + " flex items-center justify-between"}
      >
        <span
          style={{
            color: selected ? "var(--text-primary)" : "var(--text-faint)",
          }}
        >
          {selected ? selected.name : t("invoices.selectMealCategory")}
        </span>
        <ChevronDown size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
      </button>
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "var(--surface-6)",
            border: "1px solid var(--border-strong)",
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => {
                onChange(c._id);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors"
              style={{
                color: c._id === value ? "#10b981" : "var(--text-secondary)",
                background:
                  c._id === value ? "rgba(16,185,129,0.1)" : "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--surface-3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  c._id === value ? "rgba(16,185,129,0.1)" : "transparent";
              }}
            >
              {c.name}
            </button>
          ))}
          {categories.length === 0 && (
            <p className="px-4 py-3 text-sm" style={{ color: "var(--text-faint)" }}>
              No expense categories found
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Generate Modal ─────────────────────────────────── */
const GenerateModal = ({
  isMess,
  businessId,
  onClose,
  onGenerated,
}: {
  isMess: boolean;
  businessId: string;
  onClose: () => void;
  onGenerated: (id: string) => void;
}) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [cats, setCats] = useState<ITxnCategory[]>([]);
  const [mealCatId, setMealCatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const { t } = useTranslation();
  const { num, monthName: monthLabel } = useFormat();

  // ✅ Fixed: use transactionService.getCategories with businessId
  useEffect(() => {
    if (!isMess) return;
    setLoadingCats(true);
    transactionService
      .getCategories(businessId)
      .then((all) =>
        setCats(all.filter((c) => c.type === "expense" || c.type === "both")),
      )
      .catch(() => toast.error(t("invoices.loadCategoriesFailed")))
      .finally(() => setLoadingCats(false));
  }, [isMess, businessId, t]);

  const handleGenerate = async () => {
    if (isMess && !mealCatId) {
      toast.error(t("invoices.selectMealCategoryError"));
      return;
    }
    setLoading(true);
    try {
      const inv = await invoiceService.generate(businessId, {
        month,
        year,
        mealCategoryId: isMess ? mealCatId : undefined,
      });
      toast.success(t("invoices.generated"));
      onGenerated(inv._id);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("invoices.generateFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const selCls =
    "w-full rounded-xl px-4 py-2.5 text-sm outline-none appearance-none bg-[var(--surface-2)] border border-[var(--border-strong)] text-[var(--text-primary)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay-scrim)" }}
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("invoices.generateInvoice")}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
              {isMess ? t("invoices.messSubtitle") : t("invoices.regularSubtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: C.card, color: "var(--text-muted)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Month / Year */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              {t("invoices.month")}
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={selCls}
              style={{ background: "var(--surface-6)" }}
            >
              {MONTH_INDEXES.map((i) => (
                <option key={i} value={i + 1}>
                  {monthLabel(i, "long")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              {t("invoices.year")}
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={selCls}
              style={{ background: "var(--surface-6)" }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {num(y, { useGrouping: false })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Meal category — custom dropdown, no white text bug */}
        {isMess && (
          <div className="mb-4">
            <label
              className="block text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              {t("invoices.mealCategory")} <span className="text-red-400">*</span>
            </label>
            {loadingCats ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2
                  size={14}
                  className="animate-spin"
                  style={{ color: "#10b981" }}
                />
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {t("common.loading")}
                </span>
              </div>
            ) : (
              <CategorySelect
                value={mealCatId}
                onChange={setMealCatId}
                categories={cats}
              />
            )}
            <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
              {t("invoices.mealRateHint")}
            </p>
          </div>
        )}

        <div
          className="rounded-xl p-3 mb-4"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.15)",
          }}
        >
          <p className="text-xs" style={{ color: "#f59e0b" }}>
            {t("invoices.overwriteWarning")}
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: "#10b981", color: "#022c22" }}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> {t("invoices.generating")}
            </>
          ) : (
            <>
              <FileText size={15} /> {t("invoices.generateInvoice")}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* ── Main Page ──────────────────────────────────────── */
const InvoicePage = () => {
  const navigate = useNavigate();
  const { activeBusiness } = useBusinessStore();
  const isMess = activeBusiness?.type === "mass";
  const businessId = activeBusiness?._id ?? "";
  const { t } = useTranslation();
  const { money, num, date: fmtDate, monthName: monthLabel } = useFormat();

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [invoices, setInvoices] = useState<IInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showGenerate, setShowGenerate] = useState(false);

  const load = useCallback(() => {
    if (!businessId) return;
    setLoading(true);
    Promise.all([
      transactionService.getAll(businessId, {}),
      invoiceService.list(businessId),
    ])
      .then(([txRes, invRes]) => {
        setTransactions(txRes.transactions ?? []);
        setInvoices(invRes);
        setFailed(false);
      })
      .catch(() => {
        setFailed(true);
        toastLoadFailure(t("invoices.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [businessId, t]);

  useEffect(() => { load(); }, [load]);

  // Pull down on this screen to re-fetch it.
  useRefreshHandler(load);

  const filtered = transactions.filter(
    (t) => filter === "all" || t.type === filter,
  );
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const handleDelete = async (id: string) => {
    const ok = await confirmAction({
      title: t("invoices.deleteConfirm"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      danger: true,
    });
    if (!ok) return;
    try {
      await invoiceService.delete(businessId, id);
      setInvoices((p) => p.filter((i) => i._id !== id));
      toast.success(t("invoices.deleted"));
    } catch {
      toast.error(t("invoices.deleteFailed"));
    }
  };

  const typeColor = (type: string) =>
    ({ income: "#10b981", expense: "#ef4444", transfer: "#f59e0b" })[type] ??
    "#94a3b8";
  const typeLabel = (type: string) => {
    const key = isMess
      ? { income: "txn.deposit", expense: "txn.cost", transfer: "txn.transfer" }[type]
      : { income: "txn.income", expense: "txn.expense", transfer: "txn.transfer" }[type];
    return key ? t(key) : type;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: "var(--text-primary)",
            }}
          >
            {t("invoices.title")}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {t("invoices.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "#10b981", color: "#022c22" }}
        >
          <Plus size={15} /> {t("invoices.generate")}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            key: "income",
            label: t("invoices.totalIncome"),
            v: totalIncome,
            c: "#10b981",
            Icon: TrendingUp,
          },
          {
            key: "expense",
            label: t("invoices.totalExpense"),
            v: totalExpense,
            c: "#ef4444",
            Icon: TrendingDown,
          },
          {
            key: "net",
            label: t("invoices.netBalance"),
            v: net,
            c: net >= 0 ? "#10b981" : "#ef4444",
            Icon: ArrowLeftRight,
          },
        ].map(({ key, label, v, c, Icon }) => (
          <div
            key={key}
            className="rounded-xl p-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color: c }} />
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                {label}
              </span>
            </div>
            <p className="text-lg font-bold truncate" style={{ color: failed ? "var(--text-faint)" : c }}>
              {failed ? "—" : money(v, { decimals: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Transaction table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        {/* Filter pills */}
        <div
          className="flex items-center gap-2 p-4 border-b flex-wrap"
          style={{ borderColor: C.border }}
        >
          <Filter size={13} style={{ color: "var(--text-faint)" }} />
          {(["all", "income", "expense", "transfer"] as FilterType[]).map(
            (f) => {
              const lbl = f === "all" ? t("invoices.filterAll") : typeLabel(f);
              const col = {
                all: "#94a3b8",
                income: "#10b981",
                expense: "#ef4444",
                transfer: "#f59e0b",
              }[f];
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3.5 h-9 flex items-center rounded-lg text-xs font-medium flex-shrink-0 whitespace-nowrap press"
                  style={{
                    background: active ? `${col}18` : "transparent",
                    border: `1px solid ${active ? `${col}40` : "transparent"}`,
                    color: active ? col : "var(--text-faint)",
                  }}
                >
                  {lbl}
                </button>
              );
            },
          )}
          <span className="ml-auto text-xs" style={{ color: "var(--text-faint)" }}>
            {t("invoices.entriesCount", { count: num(filtered.length) })}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              size={22}
              className="animate-spin"
              style={{ color: "#10b981" }}
            />
          </div>
        ) : failed ? (
          <LoadFailedState onRetry={load} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              {t("invoices.noTransactions")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {[
                    "invoices.table.date",
                    "invoices.table.type",
                    "invoices.table.category",
                    "invoices.table.note",
                    "invoices.table.member",
                    "invoices.table.amount",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {t(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx._id}
                    className="transition-colors hover:bg-[var(--surface-1)]"
                    style={{ borderBottom: "1px solid var(--border-light)" }}
                  >
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {fmtDate(tx.date, "short")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${typeColor(tx.type)}15`,
                          color: typeColor(tx.type),
                        }}
                      >
                        {typeLabel(tx.type)}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {tx.category?.name ?? t("common.dash")}
                    </td>
                    <td
                      className="px-4 py-3 text-xs max-w-[140px] truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {tx.note ?? t("common.dash")}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {tx.member
                        ? `${tx.member.firstName} ${tx.member.lastName}`
                        : t("common.dash")}
                    </td>
                    <td
                      className="px-4 py-3 text-sm font-semibold"
                      style={{ color: typeColor(tx.type) }}
                    >
                      {money(tx.type === "expense" ? -tx.amount : tx.amount, {
                        decimals: 0,
                        signed: true,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generated invoices */}
      {invoices.length > 0 && (
        <div>
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {t("invoices.generatedInvoices")}
          </h2>
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.1)" }}
                >
                  <FileText size={16} style={{ color: "#10b981" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t("invoices.monthYear", {
                      month: monthLabel(inv.month - 1, "long"),
                      year: num(inv.year, { useGrouping: false }),
                    })}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                    {t("invoices.invoiceSummary", {
                      income: money(inv.totalIncome, { decimals: 0 }),
                      expense: money(inv.totalExpense, { decimals: 0 }),
                    })}
                    <span
                      style={{
                        color: inv.netBalance >= 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {t("invoices.netLabel", { amount: money(inv.netBalance, { decimals: 0 }) })}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate(`/invoices/${businessId}/${inv._id}`)
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      color: "#10b981",
                    }}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(inv._id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      color: "#ef4444",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGenerate && (
        <GenerateModal
          isMess={!!isMess}
          businessId={businessId}
          onClose={() => setShowGenerate(false)}
          onGenerated={(id) => {
            setShowGenerate(false);
            navigate(`/invoices/${businessId}/${id}`);
          }}
        />
      )}
    </div>
  );
};

export default InvoicePage;
