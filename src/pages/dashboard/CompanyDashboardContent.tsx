import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { IBusiness } from "../../services/business.service";
import {
  transactionService,
  type ITransaction,
  type IPendingDue,
} from "../../services/transaction.service";
import {
  businessMembersService,
  type IMember,
} from "../../services/businessMembers.service";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { toCurrency } from "../../utils/currency";
import { haptic } from "../../native/bridge";
import {
  Building2,
  Users,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react";
import TxnModal from "../../components/shared/TxnModal";

import {
  TimeRangeFilter,
  type TimeRange,
  HeroBalanceCard,
  IncomeExpenseCards,
  PersonalDuesCard,
  type IPersonalDueRow,
  ExpenseCategoriesCard,
  type IExpenseCategoryItem,
  RecentTxnsList,
  FloatingActionDock,
} from "./personal";

interface Props {
  business: IBusiness;
  onRefresh?: () => void;
}

const CATEGORY_COLORS = [
  { colorClass: "bg-blue-600 dark:bg-blue-500", dotColorClass: "bg-blue-600 dark:bg-blue-500" },
  { colorClass: "bg-sky-400 dark:bg-sky-500", dotColorClass: "bg-sky-400 dark:bg-sky-500" },
  { colorClass: "bg-amber-400 dark:bg-amber-500", dotColorClass: "bg-amber-400 dark:bg-amber-500" },
  { colorClass: "bg-rose-500 dark:bg-rose-400", dotColorClass: "bg-rose-500 dark:bg-rose-400" },
  { colorClass: "bg-emerald-500 dark:bg-emerald-400", dotColorClass: "bg-emerald-500 dark:bg-emerald-400" },
  { colorClass: "bg-purple-500 dark:bg-purple-400", dotColorClass: "bg-purple-500 dark:bg-purple-400" },
];

export const CompanyDashboardContent: React.FC<Props> = ({
  business,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { num, monthName } = useFormat(toCurrency(business.currency));

  // Time range filter
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Balance visibility toggle (stored in localStorage)
  const [balanceHidden, setBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem("hisabboi_company_balance_hidden") === "true";
  });

  // Transaction modal state
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "transfer">("income");

  // Dynamic data states
  const [allTxns, setAllTxns] = useState<ITransaction[]>([]);
  const [pendingDues, setPendingDues] = useState<IPendingDue[]>([]);
  const [teamMembers, setTeamMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleBalance = () => {
    haptic("light");
    setBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem("hisabboi_company_balance_hidden", String(next));
      return next;
    });
  };

  const handleOpenTxn = (type: "income" | "expense" | "transfer") => {
    haptic("selection");
    setModalType(type);
    setShowTxnModal(true);
  };

  // Fetch real data
  const fetchData = useCallback(async () => {
    if (!business?._id) return;
    setLoading(true);
    try {
      const [txnsRes, duesRes, membersRes] = await Promise.allSettled([
        transactionService.getAll(business._id, { limit: "100" }),
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
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, [business._id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamically filter transactions based on active TimeRange
  const filteredTxns = useMemo(() => {
    const now = new Date();
    return allTxns.filter((t) => {
      if (!t.date) return true;
      const d = new Date(t.date);
      if (timeRange === "today") {
        return d.toDateString() === now.toDateString();
      }
      if (timeRange === "7d") {
        return now.getTime() - d.getTime() <= 7 * 86400000;
      }
      if (timeRange === "30d") {
        return now.getTime() - d.getTime() <= 30 * 86400000;
      }
      if (timeRange === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeRange === "year") {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [allTxns, timeRange]);

  // Dynamic Revenue and Operating Expenses
  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTxns.forEach((tx) => {
      if (tx.type === "income") inc += tx.amount;
      else if (tx.type === "expense") exp += tx.amount;
    });
    return { totalIncome: inc, totalExpense: exp };
  }, [filteredTxns]);

  // Dynamic Expense Category Breakdown
  const expenseCategories: IExpenseCategoryItem[] = useMemo(() => {
    const expenses = filteredTxns.filter((t) => t.type === "expense");
    if (expenses.length === 0 || totalExpense === 0) return [];

    const map = new Map<string, number>();
    expenses.forEach((tx) => {
      const name = tx.category?.name || t("personalDashboard.others");
      map.set(name, (map.get(name) || 0) + tx.amount);
    });

    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const topCategories = sorted.slice(0, 4);
    const remaining = sorted.slice(4).reduce((sum, item) => sum + item[1], 0);

    const items: IExpenseCategoryItem[] = topCategories.map(([name, amount], index) => {
      const percentage = Math.round((amount / totalExpense) * 100);
      const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      return {
        name,
        amount,
        percentage,
        colorClass: color.colorClass,
        dotColorClass: color.dotColorClass,
      };
    });

    if (remaining > 0) {
      const percentage = Math.round((remaining / totalExpense) * 100);
      const color = CATEGORY_COLORS[4];
      items.push({
        name: t("personalDashboard.others"),
        amount: remaining,
        percentage,
        colorClass: color.colorClass,
        dotColorClass: color.dotColorClass,
      });
    }

    return items;
  }, [filteredTxns, totalExpense, t]);

  // Derived Corporate Treasury Balances
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

  const totalBalance = hasBusinessBalances
    ? cashBalance + bankBalance + mfsBalance
    : netTxnBalance;

  // Dynamic Dues
  const { receivableTotal, payableTotal, topReceivables, topPayables } = useMemo(() => {
    let rec = 0;
    let pay = 0;
    const recs: IPersonalDueRow[] = [];
    const pays: IPersonalDueRow[] = [];

    pendingDues.forEach((due) => {
      const owedToMe = user?._id && due.to?._id === user._id;
      const owedByMe = user?._id && due.from?._id === user._id;

      if (owedToMe) {
        rec += due.amount;
        recs.push({
          name: `${due.from.firstName} ${due.from.lastName}`.trim() || due.from.email,
          amount: due.amount,
        });
      } else if (owedByMe) {
        pay += due.amount;
        pays.push({
          name: `${due.to.firstName} ${due.to.lastName}`.trim() || due.to.email,
          amount: due.amount,
        });
      } else {
        rec += due.amount;
        recs.push({
          name: `${due.from.firstName} ${due.from.lastName}`.trim() || due.from.email,
          amount: due.amount,
        });
      }
    });

    return {
      receivableTotal: rec,
      payableTotal: pay,
      topReceivables: recs.slice(0, 3),
      topPayables: pays.slice(0, 3),
    };
  }, [pendingDues, user?._id]);

  const periodLabel = useMemo(() => {
    if (timeRange === "today") return t("personalDashboard.today");
    if (timeRange === "7d") return t("personalDashboard.days7");
    if (timeRange === "30d") return t("personalDashboard.days30");
    if (timeRange === "year") return t("personalDashboard.year");
    return monthName(new Date().getMonth(), "long");
  }, [timeRange, t, monthName]);

  const activeMembersCount = teamMembers.length || 1;

  return (
    <div className="space-y-4 pb-28 text-slate-900 dark:text-neutral-100 max-w-lg mx-auto w-full px-1">
      {/* 1. Company Header with Team Badge, Month Filter, & Refresh */}
      <section className="space-y-2">
        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
                {business.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                  {t("businessType.company")}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/members")}
                  className="text-[11px] text-slate-500 dark:text-neutral-400 hover:text-blue-600 flex items-center gap-1 font-medium"
                >
                  <Users size={12} />
                  <span>{t("company.teamMembersCount", { count: num(activeMembersCount) })}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic("light");
              (onRefresh || fetchData)();
            }}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 active:scale-95 transition-all select-none shadow-xs shrink-0"
            aria-label="Refresh data"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-blue-600 dark:text-blue-400" : ""} />
          </button>
        </div>

        {/* Time range filter pill bar */}
        <div className="pt-0.5">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>
      </section>

      {/* 2. Treasury Balance Card (Cash, Bank, MFS) */}
      <HeroBalanceCard
        totalBalance={totalBalance}
        cashBalance={cashBalance}
        mfsBalance={mfsBalance}
        bankBalance={bankBalance}
        currency={business.currency}
        balanceHidden={balanceHidden}
        onToggleHide={toggleBalance}
      />

      {/* 3. Revenue / Operating Expenses Performance Cards */}
      <IncomeExpenseCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        currency={business.currency}
        balanceHidden={balanceHidden}
        periodLabel={periodLabel}
      />

      {/* 4. Company Quick Action Grid (4 Tactile Cards) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleOpenTxn("income")}
          className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-2.5 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <TrendingUp size={18} />
          </div>
          <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
            + {t("txn.income")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenTxn("expense")}
          className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-2.5 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <TrendingDown size={18} />
          </div>
          <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
            - {t("txn.expense")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenTxn("transfer")}
          className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-2.5 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ArrowLeftRight size={18} />
          </div>
          <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
            {t("txn.transfer")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/members")}
          className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-2.5 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users size={18} />
          </div>
          <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
            {t("nav.members")}
          </span>
        </button>
      </div>

      {/* 5. Corporate Dues & Payables (Client Receivables vs Vendor Payables) */}
      <PersonalDuesCard
        receivableTotal={receivableTotal}
        payableTotal={payableTotal}
        topReceivables={topReceivables}
        topPayables={topPayables}
        currency={business.currency}
        onViewAll={() => navigate("/dues")}
      />

      {/* 6. Department / Expense Categories Breakdown */}
      <ExpenseCategoriesCard
        currency={business.currency}
        categories={expenseCategories}
        periodLabel={periodLabel}
        onViewAnalysis={() => navigate("/reports")}
      />

      {/* 7. Recent Company Transactions Ledger Stream */}
      <RecentTxnsList
        transactions={allTxns.slice(0, 5)}
        currency={business.currency}
        onViewAll={() => navigate("/transactions")}
      />

      {/* 8. Floating Sticky Action Dock */}
      <FloatingActionDock
        onAddIncome={() => handleOpenTxn("income")}
        onAddExpense={() => handleOpenTxn("expense")}
      />

      {/* Direct Transaction Modal */}
      {showTxnModal && (
        <TxnModal
          open={showTxnModal}
          defaultType={modalType}
          onClose={() => setShowTxnModal(false)}
          onSuccess={() => {
            setShowTxnModal(false);
            fetchData();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default CompanyDashboardContent;
