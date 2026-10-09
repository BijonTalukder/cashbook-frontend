import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { IBusiness } from "../../services/business.service";
import {
  transactionService,
  type ITransaction,
  type IPendingDue,
} from "../../services/transaction.service";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { toCurrency } from "../../utils/currency";
import { haptic } from "../../native/bridge";
import { RefreshCw } from "lucide-react";
import TxnModal from "../../components/shared/TxnModal";

import {
  TimeRangeFilter,
  type TimeRange,
  HeroBalanceCard,
  IncomeExpenseCards,
  QuickActionGrid,
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

export const PersonalDashboardContent: React.FC<Props> = ({ business, onRefresh }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { monthName } = useFormat(toCurrency(business.currency));

  // Time range filter
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Balance visibility toggle (stored in localStorage)
  const [balanceHidden, setBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem("hisabboi_personal_balance_hidden") === "true";
  });

  // Transaction modal state
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "transfer">("income");

  // Dynamic data states
  const [allTxns, setAllTxns] = useState<ITransaction[]>([]);
  const [pendingDues, setPendingDues] = useState<IPendingDue[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleBalance = () => {
    haptic("light");
    setBalanceHidden((prev) => {
      const next = !prev;
      localStorage.setItem("hisabboi_personal_balance_hidden", String(next));
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
      const [txnsRes, duesRes] = await Promise.allSettled([
        transactionService.getAll(business._id, { limit: "100" }),
        transactionService.getPendingDues(business._id),
      ]);

      if (txnsRes.status === "fulfilled") {
        setAllTxns(txnsRes.value.transactions || []);
      }
      if (duesRes.status === "fulfilled") {
        setPendingDues(duesRes.value || []);
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

  // Compute dynamic total income and total expense for the active range
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

  // Dynamic Balances
  // If business has explicit cash/bank ledger balances, use them; otherwise derive from cashbook transactions
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

  // Calculate MFS balance dynamically from transactions
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
    ? (cashBalance + bankBalance + mfsBalance)
    : netTxnBalance;

  // Dynamic Dues Calculation from pending dues API
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
        // No logged-in user → surface all dues as receivables so the card still
        // reflects whatever the API returned, rather than rendering zeros.
        rec += due.amount;
        recs.push({
          name: `${due.from.firstName} ${due.from.lastName}`.trim() || due.from.email,
          amount: due.amount,
        });
      }
    });

    recs.sort((a, b) => b.amount - a.amount);
    pays.sort((a, b) => b.amount - a.amount);

    return {
      receivableTotal: rec,
      payableTotal: pay,
      topReceivables: recs.slice(0, 3),
      topPayables: pays.slice(0, 3),
    };
  }, [pendingDues, user?._id]);

  // Period label for headers
  const periodLabel = useMemo(() => {
    if (timeRange === "today") return t("personalDashboard.today");
    if (timeRange === "7d") return t("personalDashboard.days7");
    if (timeRange === "30d") return t("personalDashboard.days30");
    if (timeRange === "year") return t("personalDashboard.year");
    return monthName(new Date().getMonth(), "long");
  }, [timeRange, t, monthName]);

  return (
    <div className="space-y-4 pb-28 text-slate-900 dark:text-neutral-100">
      {/* 1. Time Range Pill Filter & Refresh */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="flex-1 min-w-0">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>
        <button
          type="button"
          onClick={() => {
            haptic("light");
            (onRefresh || fetchData)();
          }}
          className="w-9 h-9 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 active:scale-95 transition-all shadow-xs shrink-0"
          aria-label="Refresh data"
          title={t("common.refresh") || "Refresh"}
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-blue-600 dark:text-blue-400" : ""} />
        </button>
      </div>

      {/* 3. Hero Balance Card (100% Dynamic) */}
      <HeroBalanceCard
        totalBalance={totalBalance}
        cashBalance={cashBalance}
        mfsBalance={mfsBalance}
        bankBalance={bankBalance}
        currency={business.currency}
        balanceHidden={balanceHidden}
        onToggleHide={toggleBalance}
      />

      {/* 4. Income / Expense Cards (100% Dynamic) */}
      <IncomeExpenseCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        currency={business.currency}
        balanceHidden={balanceHidden}
        periodLabel={periodLabel}
      />

      {/* 5. 4-Button Quick Action Grid */}
      <QuickActionGrid
        onAddIncome={() => handleOpenTxn("income")}
        onAddExpense={() => handleOpenTxn("expense")}
        onTransfer={() => handleOpenTxn("transfer")}
        onOpenDues={() => navigate("/dues")}
      />

      {/* 6. Personal Dues Card (100% Dynamic) */}
      <PersonalDuesCard
        receivableTotal={receivableTotal}
        payableTotal={payableTotal}
        topReceivables={topReceivables}
        topPayables={topPayables}
        currency={business.currency}
        onViewAll={() => navigate("/dues")}
      />

      {/* 8. Expense Categories Card (100% Dynamic) */}
      <ExpenseCategoriesCard
        currency={business.currency}
        categories={expenseCategories}
        periodLabel={periodLabel}
        onViewAnalysis={() => navigate("/reports")}
      />

      {/* 9. Recent Transactions Feed (100% Dynamic) */}
      <RecentTxnsList
        transactions={allTxns.slice(0, 5)}
        currency={business.currency}
        onViewAll={() => navigate("/transactions")}
      />

      {/* 10. Floating Sticky Action Dock */}
      <FloatingActionDock
        onAddIncome={() => handleOpenTxn("income")}
        onAddExpense={() => handleOpenTxn("expense")}
      />

      {/* Rapid Transaction Entry Modal */}
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

export default PersonalDashboardContent;
