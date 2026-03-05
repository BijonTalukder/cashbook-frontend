import { useEffect, useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessStore } from "../../store/businessStore";
import { transactionService } from "../../services/transaction.service";

import {
  businessService,
  type IBusinessCategory,
  type IBusinessTransactionCategory,
} from "../../services/business.service";
import {
  invoiceService,
  monthName,
  type IInvoiceListItem,
} from "../../services/Invoice.service";

const C = {
  bg: "#0a0f1e",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
};
const fmt = (n: number) =>
  "৳" + n.toLocaleString("en-BD", { maximumFractionDigits: 0 });
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
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
  const [cats, setCats] = useState<IBusinessCategory[]>([]);
  const [mealCatId, setMealCatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(false);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    if (!isMess) return;
    setLoadingCats(true);
    businessService
      .geTransactiontCategories(businessId)
      .then((all: IBusinessTransactionCategory[]) =>
        setCats(all.filter((c) => c.type === "expense" || c.type === "both")),
      )
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoadingCats(false));
  }, [isMess, businessId]);

  const handleGenerate = async () => {
    if (isMess && !mealCatId) {
      toast.error("Please select meal category");
      return;
    }
    setLoading(true);
    try {
      const inv = await invoiceService.generate(businessId, {
        month,
        year,
        mealCategoryId: isMess ? mealCatId : undefined,
      });
      toast.success("Invoice generated!");
      onGenerated(inv._id);
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const selCls =
    "w-full rounded-xl px-4 py-2.5 text-sm outline-none appearance-none bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold">Generate Invoice</h3>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              {isMess ? "Mess accounting invoice" : "Income & expense summary"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: C.card, color: "#64748b" }}
          >
            <X size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "#64748b" }}
            >
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={selCls}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-xs mb-1.5"
              style={{ color: "#64748b" }}
            >
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={selCls}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isMess && (
          <div className="mb-4">
            <label
              className="block text-xs mb-1.5"
              style={{ color: "#64748b" }}
            >
              Meal Category <span className="text-red-400">*</span>
            </label>
            {loadingCats ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2
                  size={14}
                  className="animate-spin"
                  style={{ color: "#10b981" }}
                />
                <span className="text-xs" style={{ color: "#475569" }}>
                  Loading...
                </span>
              </div>
            ) : (
              <select
                value={mealCatId}
                onChange={(e) => setMealCatId(e.target.value)}
                className={selCls}
              >
                <option value="">Select meal category...</option>
                {cats.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs mt-1.5" style={{ color: "#475569" }}>
              এই category র সব expense ÷ total meals = meal rate।
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
            Same month/year এ আগে invoice থাকলে overwrite হবে।
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
              <Loader2 size={15} className="animate-spin" /> Generating...
            </>
          ) : (
            <>
              <FileText size={15} /> Generate Invoice
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

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [invoices, setInvoices] = useState<IInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showGenerate, setShowGenerate] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    Promise.all([
      transactionService.getAll(businessId, {}),
      invoiceService.list(businessId),
    ])
      .then(([txRes, invRes]) => {
        setTransactions(txRes.transactions ?? []);
        setInvoices(invRes);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [businessId]);

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
    if (!confirm("Delete this invoice?")) return;
    try {
      await invoiceService.delete(businessId, id);
      setInvoices((p) => p.filter((i) => i._id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const typeColor = (t: string) =>
    ({ income: "#10b981", expense: "#ef4444", transfer: "#f59e0b" })[t] ??
    "#94a3b8";
  const typeLabel = (t: string) =>
    isMess
      ? ({ income: "Deposit", expense: "Cost", transfer: "Transfer" }[t] ?? t)
      : ({ income: "Income", expense: "Expense", transfer: "Transfer" }[t] ??
        t);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Invoices
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
            Transactions & generated invoices
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: "#10b981", color: "#022c22" }}
        >
          <Plus size={15} /> Generate
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Income",
            v: totalIncome,
            c: "#10b981",
            Icon: TrendingUp,
          },
          {
            label: "Total Expense",
            v: totalExpense,
            c: "#ef4444",
            Icon: TrendingDown,
          },
          {
            label: "Net Balance",
            v: net,
            c: net >= 0 ? "#10b981" : "#ef4444",
            Icon: ArrowLeftRight,
          },
        ].map(({ label, v, c, Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color: c }} />
              <span className="text-xs" style={{ color: "#475569" }}>
                {label}
              </span>
            </div>
            <p className="text-lg font-bold" style={{ color: c }}>
              {fmt(v)}
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
          <Filter size={13} style={{ color: "#475569" }} />
          {(["all", "income", "expense", "transfer"] as FilterType[]).map(
            (f) => {
              const lbl = {
                all: "All",
                income: isMess ? "Deposit" : "Income",
                expense: isMess ? "Cost" : "Expense",
                transfer: "Transfer",
              }[f];
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
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? `${col}18` : "transparent",
                    border: `1px solid ${active ? `${col}40` : "transparent"}`,
                    color: active ? col : "#475569",
                  }}
                >
                  {lbl}
                </button>
              );
            },
          )}
          <span className="ml-auto text-xs" style={{ color: "#334155" }}>
            {filtered.length} entries
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
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "#334155" }}>
              No transactions found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Date", "Type", "Category", "Note", "Member", "Amount"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium"
                        style={{ color: "#475569" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx._id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "#64748b" }}
                    >
                      {new Date(tx.date).toLocaleDateString("en-BD", {
                        day: "2-digit",
                        month: "short",
                      })}
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
                      style={{ color: "#94a3b8" }}
                    >
                      {tx.category?.name ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs max-w-[140px] truncate"
                      style={{ color: "#64748b" }}
                    >
                      {tx.note ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: "#64748b" }}
                    >
                      {tx.member
                        ? `${tx.member.firstName} ${tx.member.lastName}`
                        : "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm font-semibold"
                      style={{ color: typeColor(tx.type) }}
                    >
                      {tx.type === "expense" ? "-" : "+"}
                      {fmt(tx.amount)}
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
          <h2 className="text-sm font-semibold text-white mb-3">
            Generated Invoices
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
                  <p className="text-sm font-medium text-white">
                    {monthName(inv.month)} {inv.year}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                    Income {fmt(inv.totalIncome)} · Expense{" "}
                    {fmt(inv.totalExpense)} ·{" "}
                    <span
                      style={{
                        color: inv.netBalance >= 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      Net {fmt(inv.netBalance)}
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
