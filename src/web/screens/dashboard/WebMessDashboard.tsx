import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingBag,
  Wallet,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import type { IBusiness } from "../../../services/business.service";
import api from "../../../services/api";
import mealService, { type IMealDay } from "../../../services/meal.service";
import {
  transactionService,
  type ITransaction,
  type TxnType,
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

interface ApiMessSummary {
  period?: { year: number; month: number };
  memberCount?: number;
  totalExpense?: number;
  totalIncome?: number;
  perPersonShare?: number;
  members?: Array<{
    memberId: string;
    name: string;
    email: string;
    totalPaid: number;
    totalDeposited: number;
    share: number;
    balance: number;
  }>;
  settlements?: Array<{
    from: string;
    fromId: string;
    to: string;
    toId: string;
    amount: number;
  }>;
}

export const WebMessDashboard: React.FC<Props> = ({ business, onRefresh }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { money, num } = useFormat(toCurrency(business.currency));

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [modalType, setModalType] = useState<TxnType>("expense");

  const [messSummary, setMessSummary] = useState<ApiMessSummary | null>(null);
  const [monthMeals, setMonthMeals] = useState<Record<string, IMealDay>>({});
  const [businessMembers, setBusinessMembers] = useState<IMember[]>([]);
  const [allTxns, setAllTxns] = useState<ITransaction[]>([]);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const loadData = useCallback(async () => {
    if (!business?._id) return;
    setLoading(true);
    try {
      const [messRes, mealsRes, txnsRes, membersRes] = await Promise.allSettled([
        api.get("/mess/summary", { params: { businessId: business._id, year, month } }),
        mealService.getMonthMeals(business._id, year, month),
        transactionService.getAll(business._id, { page: "1", limit: "100" }),
        businessMembersService.getMembers(business._id),
      ]);

      if (messRes.status === "fulfilled") {
        setMessSummary(messRes.value.data.data);
      }
      if (mealsRes.status === "fulfilled") {
        setMonthMeals(mealsRes.value.days || {});
      }
      if (txnsRes.status === "fulfilled") {
        setAllTxns(txnsRes.value.transactions || []);
      }
      if (membersRes.status === "fulfilled") {
        setBusinessMembers(membersRes.value || []);
      }
    } catch {
      toast.error(t("mess.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [business._id, year, month, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthStart = useMemo(() => new Date(year, month, 1, 0, 0, 0, 0), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month + 1, 0, 23, 59, 59, 999), [year, month]);

  const txnsInSelectedMonth = useMemo(() => {
    return allTxns.filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d >= monthStart && d <= monthEnd;
    });
  }, [allTxns, monthStart, monthEnd]);

  const activeMembersCount = useMemo(() => {
    return (
      businessMembers.length ||
      messSummary?.members?.length ||
      messSummary?.memberCount ||
      1
    );
  }, [businessMembers, messSummary]);

  const totalBazaar = useMemo(() => {
    if (messSummary?.totalExpense !== undefined && messSummary.totalExpense > 0) {
      return messSummary.totalExpense;
    }
    return txnsInSelectedMonth
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
  }, [messSummary, txnsInSelectedMonth]);

  const totalMeals = useMemo(() => {
    return Object.values(monthMeals).reduce((s, d) => s + (d.total || 0), 0);
  }, [monthMeals]);

  const mealRate = useMemo(() => {
    return totalMeals > 0 ? totalBazaar / totalMeals : 0;
  }, [totalMeals, totalBazaar]);

  const perPersonShare = useMemo(() => {
    if (messSummary?.perPersonShare !== undefined && messSummary.perPersonShare > 0) {
      return messSummary.perPersonShare;
    }
    return activeMembersCount > 0 ? totalBazaar / activeMembersCount : 0;
  }, [messSummary, totalBazaar, activeMembersCount]);

  const totalDeposits = useMemo(() => {
    if (messSummary?.totalIncome !== undefined && messSummary.totalIncome > 0) {
      return messSummary.totalIncome;
    }
    return txnsInSelectedMonth
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
  }, [messSummary, txnsInSelectedMonth]);

  const messFund = totalDeposits - totalBazaar;

  const memberMealsMap = useMemo(() => {
    const map: Record<string, number> = {};
    Object.values(monthMeals).forEach((day) => {
      day.members?.forEach((m) => {
        const mid = m.member?._id || String(m.member);
        if (mid) {
          map[mid] = (map[mid] || 0) + (Number(m.count) || 0);
        }
      });
    });
    return map;
  }, [monthMeals]);

  const memberLedger = useMemo(() => {
    if (messSummary?.members && messSummary.members.length > 0) {
      return messSummary.members.map((m) => {
        const count = memberMealsMap[m.memberId] || 0;
        const totalPaid = m.totalPaid || 0;
        const totalDeposited = m.totalDeposited || 0;
        const contributed = totalPaid + totalDeposited;
        const balance =
          totalDeposited > 0 && totalPaid === 0
            ? Math.round((contributed - (m.share || 0)) * 100) / 100
            : m.balance;

        return {
          memberId: m.memberId,
          name: m.name,
          email: m.email,
          meals: count,
          deposited: contributed,
          share: m.share || 0,
          balance,
        };
      });
    }

    if (businessMembers.length > 0) {
      return businessMembers.map((bm) => ({
        memberId: bm._id,
        name: `${bm.firstName} ${bm.lastName}`.trim() || bm.email,
        email: bm.email,
        meals: memberMealsMap[bm._id] || 0,
        deposited: 0,
        share: 0,
        balance: 0,
      }));
    }

    return [];
  }, [messSummary, businessMembers, memberMealsMap]);

  const bazaarExpenses = useMemo(() => {
    return txnsInSelectedMonth
      .filter((t) => t.type === "expense")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [txnsInSelectedMonth]);

  const openTxn = (type: TxnType) => {
    setModalType(type);
    setShowTxnModal(true);
  };

  const monthLabel = selectedDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Month Selector & Action Controls ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--surface-1)] p-3 rounded-2xl border border-[var(--border-light)]">
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-[var(--surface-2)] p-1 rounded-xl">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-3 text-xs font-bold text-[var(--text-primary)]">
            <Calendar size={14} className="text-purple-500" />
            <span>{monthLabel}</span>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => {
              loadData();
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
            onClick={() => openTxn("expense")}
            className="h-9 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-purple-600/20 active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Bazaar Expense</span>
          </button>

          <button
            type="button"
            onClick={() => openTxn("income")}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Member Deposit</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/meals")}
            className="h-9 px-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <UtensilsCrossed size={14} />
            <span>Daily Meals</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/mess")}
            className="h-9 px-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>Meal Sheet</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Live Meal Rate Card */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white rounded-2xl p-5 shadow-lg shadow-purple-900/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-purple-100 flex items-center gap-1.5">
              <UtensilsCrossed size={14} /> Live Meal Rate
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {totalMeals} Meals
            </span>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight mb-1">
              {money(mealRate)}
              <span className="text-xs font-normal text-purple-200 ml-1">/ meal</span>
            </div>
            <span className="text-xs text-purple-100/80">
              Total Meals: {totalMeals} • Active Members: {activeMembersCount}
            </span>
          </div>
        </div>

        {/* Total Bazaar Expense Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <ShoppingBag size={15} className="text-rose-500" /> Total Bazaar Cost
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowDownRight size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              {money(totalBazaar)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              {txnsInSelectedMonth.filter((t) => t.type === "expense").length} market visits
            </span>
          </div>
        </div>

        {/* Mess Fund / Cash in Hand Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <Wallet size={15} className="text-emerald-500" /> Mess Cash Fund
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                messFund >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {money(messFund)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              Deposits: {money(totalDeposits)}
            </span>
          </div>
        </div>

        {/* Per-Person Average Cost Card */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              <Users size={15} className="text-blue-500" /> Equal Share Cost
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold">
              Per Member
            </span>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {money(perPersonShare)}
            </div>
            <span className="text-[11px] text-[var(--text-faint)]">
              Across {activeMembersCount} registered mess members
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Dual-Column Canvas ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Members Ledger Table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Mess Members Ledger & Balances
                </h3>
                <p className="text-xs text-[var(--text-faint)]">
                  Meals consumed, deposits contributed, and net balance
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/mess")}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                Detailed Ledger
              </button>
            </div>

            {memberLedger.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-faint)] uppercase text-[10px] tracking-wider font-semibold">
                      <th className="pb-2.5">Member</th>
                      <th className="pb-2.5 text-center">Meals</th>
                      <th className="pb-2.5 text-right">Deposited</th>
                      <th className="pb-2.5 text-right">Cost Share</th>
                      <th className="pb-2.5 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {memberLedger.map((m) => (
                      <tr key={m.memberId} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-3 font-medium text-[var(--text-primary)]">
                          {m.name}
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            {m.meals}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-[var(--text-primary)] whitespace-nowrap">
                          {money(m.deposited)}
                        </td>
                        <td className="py-3 text-right text-[var(--text-muted)] whitespace-nowrap">
                          {money(m.share)}
                        </td>
                        <td
                          className={`py-3 text-right font-bold whitespace-nowrap ${
                            m.balance >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {m.balance >= 0 ? "+" : ""}
                          {money(m.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[var(--text-faint)]">
                No members found in this mess.
              </div>
            )}
          </div>

          {/* Recent Bazaar Expense Log */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Recent Bazaar Expenses
                </h3>
                <p className="text-xs text-[var(--text-faint)]">
                  Recorded grocery purchases for this month
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                All Transactions
              </button>
            </div>

            {bazaarExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-light)] text-[var(--text-faint)] uppercase text-[10px] tracking-wider font-semibold">
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Note</th>
                      <th className="pb-2.5">Category</th>
                      <th className="pb-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-light)]">
                    {bazaarExpenses.map((tx) => (
                      <tr key={tx._id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-3 text-[var(--text-faint)] whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate">
                          {tx.note || "Bazaar grocery purchase"}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[var(--surface-3)] text-[var(--text-secondary)]">
                            {tx.category?.name || "Bazaar"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          -{money(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-[var(--text-faint)]">
                No bazaar expenses recorded for this month yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5/12): Settlement Matrix & Quick Summaries */}
        <div className="lg:col-span-5 space-y-6">
          {/* Settle Up Matrix */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                To Settle Up Matrix
              </h3>
              <button
                type="button"
                onClick={() => navigate("/mess")}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                Settle All
              </button>
            </div>

            {messSummary?.settlements && messSummary.settlements.length > 0 ? (
              <div className="space-y-2.5">
                {messSummary.settlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {s.from}
                      </span>
                      <span className="text-[var(--text-faint)]">pays</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {s.to}
                      </span>
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">
                      {money(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-faint)] flex flex-col items-center">
                <CheckCircle2 size={24} className="text-emerald-500 mb-1.5 opacity-60" />
                All mess balances are fully settled!
              </div>
            )}
          </div>

          {/* Mess Guidelines / Rules Card */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
              Monthly Dining Quick Overview
            </h3>
            <p className="text-xs text-[var(--text-faint)] mb-4">
              Overview for {business.name}
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)]">
                <span className="text-[var(--text-muted)]">Active Members</span>
                <span className="font-bold text-[var(--text-primary)]">{activeMembersCount} members</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)]">
                <span className="text-[var(--text-muted)]">Days with Meal Entries</span>
                <span className="font-bold text-[var(--text-primary)]">{Object.keys(monthMeals).length} days</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--border-light)]">
                <span className="text-[var(--text-muted)]">Avg Meals / Day</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {Object.keys(monthMeals).length > 0
                    ? num(Math.round((totalMeals / Object.keys(monthMeals).length) * 10) / 10)
                    : num(0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--text-muted)]">Mess Currency</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{business.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal for Quick Entry */}
      {showTxnModal && (
        <TxnModal
          open={showTxnModal}
          onClose={() => setShowTxnModal(false)}
          defaultType={modalType}
          isMass={true}
          onSuccess={() => {
            loadData();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default WebMessDashboard;
