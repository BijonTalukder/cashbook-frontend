import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Plus,
  Minus,
  RefreshCw,
  Search,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { IBusiness } from "../../../services/business.service";
import {
  transactionService,
  type ITransaction,
  type IPendingDue,
} from "../../../services/transaction.service";
import {
  businessMembersService,
  type IMember,
} from "../../../services/businessMembers.service";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";
import TxnModal from "../../../components/shared/TxnModal";

interface Props {
  business: IBusiness;
  onRefresh?: () => void;
}

type TimeRange = "today" | "7d" | "30d" | "month" | "year" | "all";

const CATEGORY_COLORS = [
  "#3b82f6", "#06b6d4", "#f59e0b", "#f43f5e", "#10b981", "#8b5cf6"
];

export const WebCompanyDashboard: React.FC<Props> = ({ business, onRefresh }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { money } = useFormat(toCurrency(business.currency));

  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [balanceHidden, setBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem("hisabboi_company_balance_hidden") === "true";
  });

  const [showTxnModal, setShowTxnModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "transfer">("income");

  const [allTxns, setAllTxns] = useState<ITransaction[]>([]);
  const [pendingDues, setPendingDues] = useState<IPendingDue[]>([]);
  const [teamMembers, setTeamMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleBalance = () => {
    setBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem("hisabboi_company_balance_hidden", String(next));
      return next;
    });
  };

  const handleOpenTxn = (type: "income" | "expense" | "transfer") => {
    setModalType(type);
    setShowTxnModal(true);
  };

  const fetchData = useCallback(async () => {
    if (!business?._id) return;
    setLoading(true);
    try {
      const [txnsRes, duesRes, membersRes] = await Promise.allSettled([
        transactionService.getAll(business._id, { limit: "150" }),
        transactionService.getPendingDues(business._id),
        businessMembersService.getMembers(business._id),
      ]);

      if (txnsRes.status === "fulfilled") {
        setAllTxns(txnsRes.value.transactions || []);
      }
      if (duesRes.status === "fulfilled") {
        setPendingDues(duesRes.value || []);
      }
      if (membersRes.status === "fulfilled") {
        setTeamMembers(membersRes.value || []);
      }
    } finally {
      setLoading(false);
    }
  }, [business._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTxns = useMemo(() => {
    const now = new Date();
    return allTxns.filter((t) => {
      if (!t.date) return true;
      const d = new Date(t.date);
      if (timeRange === "today") return d.toDateString() === now.toDateString();
      if (timeRange === "7d") return now.getTime() - d.getTime() <= 7 * 86400000;
      if (timeRange === "30d") return now.getTime() - d.getTime() <= 30 * 86400000;
      if (timeRange === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeRange === "year") return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [allTxns, timeRange]);

  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTxns.forEach((tx) => {
      if (tx.type === "income") inc += tx.amount;
      else if (tx.type === "expense") exp += tx.amount;
    });
    return { totalIncome: inc, totalExpense: exp };
  }, [filteredTxns]);

  const netOperatingProfit = totalIncome - totalExpense;

  const hasBusinessBalances = (business.cashBalance ?? 0) > 0 || (business.bankBalance ?? 0) > 0;
  const netTxnBalance = useMemo(() => {
    let inc = 0;
    let exp = 0;
    allTxns.forEach((tx) => {
      if (tx.type === "income") inc += tx.amount;
      else if (tx.type === "expense") exp += tx.amount;
    });
    return inc - exp;
  }, [allTxns]);

  const mfsBalance = useMemo(() => {
    let mfs = 0;
    allTxns.forEach((tx) => {
      const method = (tx.paymentMethod || "").toLowerCase();
      if (method.includes("bkash") || method.includes("nagad") || method.includes("mfs")) {
        if (tx.type === "income") mfs += tx.amount;
        else if (tx.type === "expense") mfs -= tx.amount;
      }
    });
    return Math.max(mfs, 0);
  }, [allTxns]);

  const bankBalance = business.bankBalance ?? 0;
  const cashBalance = hasBusinessBalances
    ? (business.cashBalance ?? 0)
    : Math.max(0, netTxnBalance - mfsBalance);

  const totalTreasuryBalance = hasBusinessBalances
    ? cashBalance + bankBalance + mfsBalance
    : netTxnBalance;

  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number }>();
    const sorted = [...filteredTxns].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((tx) => {
      const day = new Date(tx.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const curr = map.get(day) || { date: day, income: 0, expense: 0 };
      if (tx.type === "income") curr.income += tx.amount;
      else if (tx.type === "expense") curr.expense += tx.amount;
      map.set(day, curr);
    });

    return Array.from(map.values());
  }, [filteredTxns]);

  const expenseCategories = useMemo(() => {
    const expenses = filteredTxns.filter((t) => t.type === "expense");
    if (expenses.length === 0 || totalExpense === 0) return [];

    const map = new Map<string, number>();
    expenses.forEach((tx) => {
      const name = tx.category?.name || "Operating Expenses";
      map.set(name, (map.get(name) || 0) + tx.amount);
    });

    return Array.from(map.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percent: Math.round((amount / totalExpense) * 100),
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTxns, totalExpense]);

  const searchedTxns = useMemo(() => {
    if (!searchTerm.trim()) return filteredTxns;
    const term = searchTerm.toLowerCase();
    return filteredTxns.filter(
      (t) =>
        t.note?.toLowerCase().includes(term) ||
        t.category?.name?.toLowerCase().includes(term) ||
        t.amount.toString().includes(term)
    );
  }, [filteredTxns, searchTerm]);

  return (
    <div className="space-y-6">
      {/* ── Top Bar Controls: Time Range & Quick Action Buttons ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--surface-1)] p-3 rounded-2xl border border-[var(--border-light)]">
        {/* Time Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-[var(--surface-2)] rounded-xl">
          {(
            [
              { id: "today", label: "Today" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "month", label: "This Month" },
              { id: "year", label: "This Year" },
              { id: "all", label: "All" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTimeRange(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                timeRange === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => {
              fetchData();
              onRefresh?.();
            }}
            disabled={loading}
            className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-muted)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenTxn("income")}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Add Revenue</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTxn("expense")}
            className="h-9 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-600/20 active:scale-95 cursor-pointer"
          >
            <Minus size={14} />
            <span>+ Add Expense</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenTxn("transfer")}
            className="h-9 px-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ArrowLeftRight size={14} />
            <span>Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/members")}
            className="h-9 px-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Users size={14} />
            <span>Team ({teamMembers.length})</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Corporate Treasury Balance Card */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl p-5 shadow-lg shadow-blue-900/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200 flex items-center gap-1.5">
              <Building2 size={14} /> Treasury Balance
            </span>
            <button
              type="button"
              onClick={toggleBalance}
              className="text-blue-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              {balanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight mb-1">
              {balanceHidden ? "••••••" : money(totalTreasuryBalance)}
            </div>
            <div className="text-xs text-blue-200/80">
              Cash: {money(cashBalance)} • Bank: {money(bankBalance)}
            </div>
          </div>
        </div>

        {/* Period Revenue Inflow Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <TrendingUp size={15} className="text-emerald-500" /> Revenue Inflow
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {money(totalIncome)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              {filteredTxns.filter((t) => t.type === "income").length} client deposits & invoices
            </span>
          </div>
        </div>

        {/* Period Operating Outflow Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <TrendingDown size={15} className="text-rose-500" /> Operating Expenses
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowDownRight size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {money(totalExpense)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              {filteredTxns.filter((t) => t.type === "expense").length} operational vouchers
            </span>
          </div>
        </div>

        {/* Operating Margin Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <Layers size={15} className="text-indigo-500" /> Net Operating Margin
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold">
              {totalIncome > 0
                ? `${Math.round((netOperatingProfit / totalIncome) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                netOperatingProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {money(netOperatingProfit)}
            </div>
            <div className="w-full bg-[var(--surface-3)] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, totalIncome > 0 ? (netOperatingProfit / totalIncome) * 100 : 0)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dual-Column Canvas ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Cashflow Timeline & Transaction Stream Table */}
        <div className="lg:col-span-7 space-y-6">
          {/* Revenue & Expense Chart */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Revenue & Expense Flow
                </h3>
                <p className="text-xs text-[var(--text-faint)]">
                  Timeline of company financials
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
                </span>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="companyIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="companyExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-faint)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--text-faint)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#companyIncomeGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#companyExpenseGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--text-faint)] text-xs">
                No corporate transactions recorded for this period
              </div>
            )}
          </div>

          {/* Corporate Transactions Table */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Corporate Ledger Stream
                </h3>
                <p className="text-xs text-[var(--text-faint)]">
                  Showing {searchedTxns.length} records
                </p>
              </div>

              {/* Table search filter */}
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-faint)]" />
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-light)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {searchedTxns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-faint)] uppercase text-[10px] tracking-wider font-semibold">
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Note</th>
                      <th className="pb-2.5">Department</th>
                      <th className="pb-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {searchedTxns.slice(0, 10).map((tx) => (
                      <tr key={tx._id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-3 text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate">
                          {tx.note || "Corporate transaction"}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[var(--surface-3)] text-[var(--text-secondary)]">
                            {tx.category?.name || "General"}
                          </span>
                        </td>
                        <td
                          className={`py-3 text-right font-bold whitespace-nowrap ${
                            tx.type === "income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {money(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[var(--text-faint)]">
                No matching transactions found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5/12): Department Breakdown & Team Dues */}
        <div className="lg:col-span-5 space-y-6">
          {/* Department Expense Breakdown */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              Department Expense Allocation
            </h3>
            <p className="text-xs text-[var(--text-faint)] mb-4">
              Breakdown of operational spend
            </p>

            {expenseCategories.length > 0 ? (
              <div className="space-y-4">
                {expenseCategories.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {cat.name}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-[var(--text-primary)]">
                          {money(cat.amount)}
                        </span>
                        <span className="text-[10px] text-[var(--text-faint)] ml-1">
                          ({cat.percent}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[var(--surface-3)] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-[var(--text-faint)]">
                No categorized department expenses for this period.
              </div>
            )}
          </div>

          {/* Corporate Dues & Vendor Payables */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Corporate Receivables & Payables
                </h3>
                <p className="text-xs text-[var(--text-faint)]">
                  Pending client & partner settlements
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/dues")}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                View All
              </button>
            </div>

            {pendingDues.length > 0 ? (
              <div className="space-y-2.5">
                {pendingDues.slice(0, 5).map((due, idx) => {
                  const partnerName =
                    `${due.from.firstName} ${due.from.lastName}`.trim() ||
                    due.from.email ||
                    "Client / Partner";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-light)]"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {partnerName}
                        </p>
                        <span className="text-[10px] text-[var(--text-faint)]">
                          {due.from.email || "Pending settlement"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {money(due.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-faint)] flex flex-col items-center">
                <CheckCircle2 size={24} className="text-emerald-500 mb-1.5 opacity-60" />
                All corporate dues are fully cleared!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corporate Transaction Modal */}
      {showTxnModal && (
        <TxnModal
          open={showTxnModal}
          onClose={() => setShowTxnModal(false)}
          defaultType={modalType}
          onSuccess={() => {
            fetchData();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default WebCompanyDashboard;
