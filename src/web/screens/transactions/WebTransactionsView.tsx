import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  type ITransaction,
  type ITxnSummary,
  type TxnType,
} from "../../../services/transaction.service";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";

interface Props {
  transactions: ITransaction[];
  summary: ITxnSummary | null;
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  typeFilter: TxnType | "";
  onTypeFilterChange: (type: TxnType | "") => void;
  onPageChange: (newPage: number) => void;
  onRefresh: () => void;
  onOpenAdd: (type: TxnType) => void;
  onEdit: (txn: ITransaction) => void;
  onDelete: (txn: ITransaction) => void;
  onSettle: (txn: ITransaction) => void;
  isMass?: boolean;
}

const SETTLE_META = {
  not_applicable: { label: "", color: "" },
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  partial: { label: "Partial", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  settled: { label: "Settled", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
};

export const WebTransactionsView: React.FC<Props> = ({
  transactions,
  summary,
  loading,
  total,
  page,
  totalPages,
  typeFilter,
  onTypeFilterChange,
  onPageChange,
  onRefresh,
  onOpenAdd,
  onEdit,
  onDelete,
  onSettle,
  isMass = false,
}) => {
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTxns = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.note?.toLowerCase().includes(term) ||
        tx.category?.name?.toLowerCase().includes(term) ||
        tx.member?.firstName?.toLowerCase().includes(term) ||
        tx.amount.toString().includes(term)
    );
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-6">
      {/* ── Top Bar Controls: Filters, Search & Action Buttons ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[var(--surface-1)] p-4 rounded-2xl border border-[var(--border-light)]">
        {/* Left: Type Filter Pills & Search */}
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
            {(
              [
                { label: t("transactions.filterAll"), value: "" },
                { label: t("txn.income"), value: "income" },
                { label: t("txn.expense"), value: "expense" },
                { label: t("txn.transfer"), value: "transfer" },
              ] as const
            ).map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => onTypeFilterChange(value as TxnType | "")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-faint)]" />
            <input
              type="text"
              placeholder="Search by note, category, member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-light)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right: Refresh & Add Action Buttons */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => onOpenAdd("income")}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ {t("txn.income")}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAdd("expense")}
            className="h-9 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-600/20 active:scale-95 cursor-pointer"
          >
            <Minus size={14} />
            <span>+ {t("txn.expense")}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAdd("transfer")}
            className="h-9 px-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ArrowLeftRight size={14} />
            <span>{t("txn.transfer")}</span>
          </button>
        </div>
      </div>

      {/* ── Summary Cards Grid ─────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <TrendingUp size={15} className="text-emerald-500" /> {t("txn.income")}
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {money(summary.totalIncome)}
              </div>
              <span className="text-[11px] text-[var(--text-faint)]">
                {num(summary.incomeCount || 0)} entries
              </span>
            </div>
          </div>

          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <TrendingDown size={15} className="text-rose-500" /> {t("txn.expense")}
              </span>
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ArrowDownRight size={14} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                {money(summary.totalExpense)}
              </div>
              <span className="text-[11px] text-[var(--text-faint)]">
                {num(summary.expenseCount || 0)} entries
              </span>
            </div>
          </div>

          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <ArrowLeftRight size={15} className="text-blue-500" /> {t("common.balance")}
              </span>
            </div>
            <div>
              <div
                className={`text-2xl font-black tracking-tight ${
                  summary.balance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {money(summary.balance)}
              </div>
              <span className="text-[11px] text-[var(--text-faint)]">
                Net cash balance
              </span>
            </div>
          </div>

          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                <Filter size={15} className="text-purple-500" /> Total Records
              </span>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                {num(total)}
              </div>
              <span className="text-[11px] text-[var(--text-faint)]">
                Page {num(page)} of {num(totalPages || 1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Data Table ─────────────────────────────────── */}
      <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <RefreshCw size={24} className="animate-spin mb-2 text-emerald-500" />
            <span className="text-xs">Loading ledger...</span>
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="py-20 text-center text-xs text-[var(--text-faint)]">
            No transactions found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-[var(--text-faint)] uppercase text-[10px] tracking-wider font-semibold">
                  <th className="pb-3 pl-2">Type</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Note / Details</th>
                  <th className="pb-3">Recorded By</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {filteredTxns.map((tx) => {
                  const isIncome = tx.type === "income";
                  const isExpense = tx.type === "expense";
                  const settle = SETTLE_META[tx.settlementStatus] || SETTLE_META.not_applicable;
                  const canSettle = ["pending", "partial"].includes(tx.settlementStatus);

                  return (
                    <tr
                      key={tx._id}
                      className="hover:bg-[var(--surface-2)] transition-colors group"
                    >
                      <td className="py-3.5 pl-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isExpense
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {isIncome ? (
                            <TrendingUp size={14} />
                          ) : isExpense ? (
                            <TrendingDown size={14} />
                          ) : (
                            <ArrowLeftRight size={14} />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-[var(--text-muted)] whitespace-nowrap">
                        {fmtDate(tx.date, "short")}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--surface-3)] text-[var(--text-primary)]">
                          {tx.category?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 max-w-[240px] truncate font-medium text-[var(--text-primary)]">
                        {tx.note || "—"}
                      </td>
                      <td className="py-3.5 text-[var(--text-muted)] whitespace-nowrap">
                        {tx.member?.firstName} {tx.member?.lastName}
                      </td>
                      <td className="py-3.5">
                        {settle.label ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${settle.color}`}
                          >
                            {settle.label}
                          </span>
                        ) : (
                          <span className="text-[var(--text-faint)] text-[11px]">—</span>
                        )}
                      </td>
                      <td
                        className={`py-3.5 text-right font-bold text-sm whitespace-nowrap ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isExpense
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {isIncome ? "+" : isExpense ? "-" : ""}
                        {money(tx.amount)}
                      </td>
                      <td className="py-3.5 pr-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                          {canSettle && (
                            <button
                              type="button"
                              onClick={() => onSettle(tx)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                              title="Settle balance"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(tx)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Controls ──────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-light)] pt-4 mt-4">
            <span className="text-xs text-[var(--text-faint)]">
              Showing page {num(page)} of {num(totalPages)} ({num(total)} total entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebTransactionsView;
