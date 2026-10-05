import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, ShoppingBag, Zap, Send } from "lucide-react";
import type { IBusiness } from "../../services/business.service";
import { transactionService, type ITransaction } from "../../services/transaction.service";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { toCurrency } from "../../utils/currency";
import { haptic } from "../../native/bridge";
import TxnModal from "../../components/shared/TxnModal";

import {
  PersonalHeader,
  TimeRangeFilter,
  type TimeRange,
  HeroBalanceCard,
  IncomeExpenseCards,
  QuickActionGrid,
  SavingsTargetWidget,
  PersonalDuesCard,
  ExpenseCategoriesCard,
  RecentTxnsList,
  FloatingActionDock,
} from "./personal";

interface Props {
  business: IBusiness;
  onRefresh?: () => void;
}

export const PersonalDashboardContent: React.FC<Props> = ({ business, onRefresh }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { date: fmtDate } = useFormat(toCurrency(business.currency));

  // Time range filter
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Balance visibility toggle (stored in localStorage)
  const [balanceHidden, setBalanceHidden] = useState<boolean>(() => {
    return localStorage.getItem("hisabboi_personal_balance_hidden") === "true";
  });

  // Transaction modal state
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense" | "transfer">("income");

  // Summary and transactions data
  const [recentTxns, setRecentTxns] = useState<ITransaction[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(65000);
  const [totalExpense, setTotalExpense] = useState<number>(22500);

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

  // Load real transactions and summary if available
  useEffect(() => {
    let cancelled = false;
    const year = new Date().getFullYear();
    const thisMonth = new Date().getMonth() + 1;

    Promise.allSettled([
      transactionService.getMonthlySummary(business._id, year),
      transactionService.getAll(business._id, { page: "1", limit: "5" }),
    ]).then(([summaryRes, txnsRes]) => {
      if (cancelled) return;
      if (summaryRes.status === "fulfilled" && summaryRes.value?.months) {
        const monthData = summaryRes.value.months.find((m) => m.month === thisMonth);
        if (monthData && (monthData.income > 0 || monthData.expense > 0)) {
          setTotalIncome(monthData.income);
          setTotalExpense(monthData.expense);
        }
      }
      if (txnsRes.status === "fulfilled" && txnsRes.value?.transactions?.length > 0) {
        setRecentTxns(txnsRes.value.transactions);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [business._id]);

  // Balances
  const cashBalance = business.cashBalance ?? 12500;
  const mfsBalance = 15000;
  const bankBalance = business.bankBalance ?? 15000;
  const totalBalance = cashBalance + mfsBalance + bankBalance;

  // Savings target calculations
  const savingsTarget = 40000;
  const currentSaved = 26000;

  // Personal Dues
  const receivableTotal = 3500;
  const payableTotal = 1200;

  // Seed fallback transactions if no real transactions recorded yet
  const displayTxns = useMemo(() => {
    if (recentTxns.length > 0) {
      return recentTxns.slice(0, 4);
    }
    return [
      {
        _id: "seed_1",
        title: t("personalDashboard.salaryDeposit") + " (TechCorp)",
        account: "City Bank",
        date: fmtDate(new Date().toISOString(), "short"),
        amount: 50000,
        type: "income" as const,
        icon: Landmark,
      },
      {
        _id: "seed_2",
        title: t("personalDashboard.groceryShop") + " (Shwapno)",
        account: "bKash",
        date: fmtDate(new Date(Date.now() - 86400000).toISOString(), "short"),
        amount: 2450,
        type: "expense" as const,
        icon: ShoppingBag,
      },
      {
        _id: "seed_3",
        title: t("personalDashboard.electricityBill") + " (DESCO)",
        account: "Nagad",
        date: fmtDate(new Date(Date.now() - 86400000 * 2).toISOString(), "short"),
        amount: 1150,
        type: "expense" as const,
        icon: Zap,
      },
      {
        _id: "seed_4",
        title: t("personalDashboard.friendLoan") + " (Farhan)",
        account: "Cash",
        date: fmtDate(new Date(Date.now() - 86400000 * 3).toISOString(), "short"),
        amount: 2000,
        type: "expense" as const,
        icon: Send,
      },
    ];
  }, [recentTxns, t, fmtDate]);

  return (
    <div className="space-y-4 pb-28 text-slate-900 dark:text-neutral-100">
      {/* 1. Profile & Active Business Header */}
      <PersonalHeader business={business} onRefresh={onRefresh} />

      {/* 2. Time Range Pill Filter */}
      <TimeRangeFilter value={timeRange} onChange={setTimeRange} />

      {/* 3. Hero Balance Card with Privacy Toggle */}
      <HeroBalanceCard
        totalBalance={totalBalance}
        cashBalance={cashBalance}
        mfsBalance={mfsBalance}
        bankBalance={bankBalance}
        currency={business.currency}
        balanceHidden={balanceHidden}
        onToggleHide={toggleBalance}
      />

      {/* 4. Income vs Expense Dual Cards */}
      <IncomeExpenseCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        currency={business.currency}
        balanceHidden={balanceHidden}
      />

      {/* 5. Streamlined 4 Quick Action Handlers */}
      <QuickActionGrid
        onAddIncome={() => handleOpenTxn("income")}
        onAddExpense={() => handleOpenTxn("expense")}
        onTransfer={() => handleOpenTxn("transfer")}
        onOpenDues={() => navigate("/baki")}
      />

      {/* 6. Monthly Savings Target Widget */}
      <SavingsTargetWidget
        currentSaved={currentSaved}
        targetAmount={savingsTarget}
        currency={business.currency}
      />

      {/* 7. Personal Dues & Receivables (ধার-দেনা) */}
      <PersonalDuesCard
        receivableTotal={receivableTotal}
        payableTotal={payableTotal}
        currency={business.currency}
        onSendReminder={() => navigate("/baki?tab=receive")}
        onPayNow={() => navigate("/baki?tab=pay")}
        onViewAll={() => navigate("/baki")}
      />

      {/* 8. Expense Categories Breakdown */}
      <ExpenseCategoriesCard currency={business.currency} />

      {/* 9. Recent Transactions Feed */}
      <RecentTxnsList
        transactions={displayTxns}
        currency={business.currency}
        onViewAll={() => navigate("/transactions")}
      />

      {/* 10. Floating Sticky Quick Action Dock */}
      <FloatingActionDock
        onAddIncome={() => handleOpenTxn("income")}
        onAddExpense={() => handleOpenTxn("expense")}
      />

      {/* Transaction Modal */}
      {showTxnModal && (
        <TxnModal
          open={showTxnModal}
          onClose={() => setShowTxnModal(false)}
          defaultType={modalType}
          onSuccess={() => {
            setShowTxnModal(false);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default PersonalDashboardContent;
