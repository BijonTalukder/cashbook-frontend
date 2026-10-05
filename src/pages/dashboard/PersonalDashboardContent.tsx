import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Landmark,
  Smartphone,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  Users,
  PiggyBank,
  Eye,
  EyeOff,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Receipt,
  ShoppingBag,
  Zap,
  Send,
  Plus,
  Minus,
  Store,
  RefreshCw,
} from "lucide-react";
import type { IBusiness } from "../../services/business.service";
import { transactionService, type ITransaction } from "../../services/transaction.service";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { toCurrency } from "../../utils/currency";
import { haptic } from "../../native/bridge";
import TxnModal from "../../components/shared/TxnModal";

interface Props {
  business: IBusiness;
  onRefresh?: () => void;
}

type TimeRange = "today" | "7d" | "30d" | "month" | "year";

export const PersonalDashboardContent: React.FC<Props> = ({ business, onRefresh }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { money, num, date: fmtDate, monthName } = useFormat(toCurrency(business.currency));

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

  // Dynamic balances
  const cashBalance = business.cashBalance ?? 12500;
  const mfsBalance = 15000;
  const bankBalance = business.bankBalance ?? 15000;
  const totalBalance = cashBalance + mfsBalance + bankBalance;

  // Savings target calculations
  const savingsTarget = 40000;
  const currentSaved = 26000;
  const savingsPercent = Math.min(100, Math.round((currentSaved / savingsTarget) * 100));

  // Personal Dues
  const receivableTotal = 3500;
  const payableTotal = 1200;

  // Current month string
  const currentMonth = monthName(new Date().getMonth(), "long");

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
      {/* Profile & Business Mode Strip */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-slate-200/60 dark:border-neutral-800/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 dark:ring-neutral-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-sm ring-2 ring-slate-200 dark:ring-neutral-700">
                {user?.firstName?.[0] || "U"}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_#ffffff] dark:shadow-[0_0_0_2px_#171717]" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[14px] text-slate-900 dark:text-neutral-100 truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold shrink-0">
                {t("businessType.personal")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-neutral-400 text-[12px] truncate">
              <Store size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate font-medium">{business.name}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic("light");
            onRefresh?.();
          }}
          aria-label="Refresh data"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shrink-0"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* 1. Time Range Pill Filter */}
      <div className="flex items-center justify-between p-1 bg-slate-200/60 dark:bg-neutral-800/80 backdrop-blur-md rounded-2xl text-center">
        {(
          [
            { key: "today", label: t("personalDashboard.today") },
            { key: "7d", label: t("personalDashboard.days7") },
            { key: "30d", label: t("personalDashboard.days30") },
            { key: "month", label: t("personalDashboard.thisMonth") },
            { key: "year", label: t("personalDashboard.year") },
          ] as { key: TimeRange; label: string }[]
        ).map((tab) => {
          const isActive = timeRange === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                haptic("selection");
                setTimeRange(tab.key);
              }}
              className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Hero Balance Card (Minimalist & Clean) */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {t("personalDashboard.totalBalance")}
          </span>

          <button
            type="button"
            onClick={toggleBalance}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 transition-colors active:scale-95"
          >
            {balanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="font-medium">
              {balanceHidden ? t("personalDashboard.show") : t("personalDashboard.hide")}
            </span>
          </button>
        </div>

        {/* Big Balance Amount */}
        <div className="flex items-baseline gap-1 py-1">
          {balanceHidden ? (
            <span className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-slate-400 dark:text-neutral-600 select-none">
              ••••••••
            </span>
          ) : (
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
              {money(totalBalance)}
            </span>
          )}
        </div>

        {/* Account Breakdown Strip */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 grid grid-cols-3 gap-2">
          {/* Cash */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
              <Wallet size={13} className="text-emerald-500" />
              {t("personalDashboard.cash")}
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-neutral-200 mt-0.5 truncate">
              {balanceHidden ? "••••" : money(cashBalance)}
            </span>
          </div>

          {/* bKash / Nagad */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
              <Smartphone size={13} className="text-blue-500" />
              {t("personalDashboard.mfs")}
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-neutral-200 mt-0.5 truncate">
              {balanceHidden ? "••••" : money(mfsBalance)}
            </span>
          </div>

          {/* Bank */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
              <Landmark size={13} className="text-purple-500" />
              {t("personalDashboard.bank")}
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-neutral-200 mt-0.5 truncate">
              {balanceHidden ? "••••" : money(bankBalance)}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Income vs Expense Dual Cards (Grid 2-col) */}
      <section className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-neutral-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft size={16} />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              +12%
            </span>
          </div>

          <div>
            <span className="text-[12px] text-slate-500 dark:text-neutral-400 font-medium">
              {t("personalDashboard.totalIncome")} ({currentMonth})
            </span>
            <p className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-neutral-100 mt-0.5">
              <span className="text-emerald-500 mr-0.5">+</span>
              {balanceHidden ? "••••" : money(totalIncome)}
            </p>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">
            {t("personalDashboard.incomeSub")}
          </span>
        </div>

        {/* Expense Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-neutral-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowUpRight size={16} />
            </div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
              35% {t("personalDashboard.used")}
            </span>
          </div>

          <div>
            <span className="text-[12px] text-slate-500 dark:text-neutral-400 font-medium">
              {t("personalDashboard.totalExpense")} ({currentMonth})
            </span>
            <p className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-neutral-100 mt-0.5">
              <span className="text-rose-500 mr-0.5">-</span>
              {balanceHidden ? "••••" : money(totalExpense)}
            </p>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">
            {t("personalDashboard.expenseSub")}
          </span>
        </div>
      </section>

      {/* 4. Streamlined 4 Quick Action Handlers */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[14px] text-slate-900 dark:text-neutral-100 font-bold">
            {t("personalDashboard.quickActions")}
          </h2>
          <span className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold">
            {t("personalDashboard.actionsCount", { count: num(4) })}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Add Income */}
          <button
            type="button"
            onClick={() => handleOpenTxn("income")}
            className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <PlusCircle size={22} />
            </div>
            <span className="text-[12px] font-semibold text-slate-800 dark:text-neutral-200 text-center">
              {t("personalDashboard.addIncome")}
            </span>
          </button>

          {/* Add Expense */}
          <button
            type="button"
            onClick={() => handleOpenTxn("expense")}
            className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <MinusCircle size={22} />
            </div>
            <span className="text-[12px] font-semibold text-slate-800 dark:text-neutral-200 text-center">
              {t("personalDashboard.addExpense")}
            </span>
          </button>

          {/* Transfer */}
          <button
            type="button"
            onClick={() => handleOpenTxn("transfer")}
            className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <ArrowLeftRight size={22} />
            </div>
            <span className="text-[12px] font-semibold text-slate-800 dark:text-neutral-200 text-center">
              {t("personalDashboard.transfer")}
            </span>
          </button>

          {/* Dues */}
          <button
            type="button"
            onClick={() => {
              haptic("light");
              navigate("/baki");
            }}
            className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Users size={22} />
            </div>
            <span className="text-[12px] font-semibold text-slate-800 dark:text-neutral-200 text-center">
              {t("personalDashboard.dues")}
            </span>
          </button>
        </div>
      </section>

      {/* 5. Minimalist Savings Target Widget */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PiggyBank size={18} />
            </div>
            <div>
              <span className="text-[13px] font-bold text-slate-900 dark:text-neutral-100 block">
                {t("personalDashboard.savingsGoal")}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                {t("personalDashboard.savingsSub")}
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
            {num(savingsPercent)}% {t("personalDashboard.completed")}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${savingsPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
          <span>
            {t("personalDashboard.currentSaved")}:{" "}
            <strong className="text-slate-900 dark:text-neutral-100 font-mono font-bold">
              {money(currentSaved)}
            </strong>
          </span>
          <span>
            {t("personalDashboard.target")}:{" "}
            <strong className="text-slate-900 dark:text-neutral-100 font-mono font-bold">
              {money(savingsTarget)}
            </strong>
          </span>
        </div>
      </section>

      {/* 6. Personal Dues & Receivables (ধার-দেনা) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] text-slate-900 dark:text-neutral-100 font-bold">
              {t("personalDashboard.personalDues")}
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("light");
              navigate("/baki");
            }}
            className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            {t("personalDashboard.viewDetails")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* I will get (Receivable) */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                  {t("personalDashboard.iWillGet")}
                </span>
                <ArrowDownLeft size={15} className="text-emerald-500" />
              </div>
              <p className="text-[16px] sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {money(receivableTotal)}
              </p>
              <div className="space-y-1 text-[11px] text-slate-700 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800 pt-2 mt-2">
                <div className="flex justify-between">
                  <span>ফারহান</span>
                  <span className="font-mono font-semibold">৳ ২,০০০</span>
                </div>
                <div className="flex justify-between">
                  <span>তানভীর</span>
                  <span className="font-mono font-semibold">৳ ১,৫০০</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic("light");
                navigate("/baki?tab=receive");
              }}
              className="w-full mt-2 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors active:scale-95"
            >
              {t("personalDashboard.sendReminder")}
            </button>
          </div>

          {/* I will give (Payable) */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                  {t("personalDashboard.iWillGive")}
                </span>
                <ArrowUpRight size={15} className="text-rose-500" />
              </div>
              <p className="text-[16px] sm:text-lg font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">
                {money(payableTotal)}
              </p>
              <div className="space-y-1 text-[11px] text-slate-700 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800 pt-2 mt-2">
                <div className="flex justify-between">
                  <span>সিয়াম (লাঞ্চ)</span>
                  <span className="font-mono font-semibold">৳ ১,২০০</span>
                </div>
                <div className="flex justify-between text-slate-400 dark:text-neutral-500">
                  <span>অন্য কেউ নেই</span>
                  <span className="font-mono font-semibold">৳ ০</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic("light");
                navigate("/baki?tab=pay");
              }}
              className="w-full mt-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors active:scale-95"
            >
              {t("personalDashboard.payNow")}
            </button>
          </div>
        </div>
      </section>

      {/* 7. Expense Categories Breakdown (মাসিক খরচের খাত) */}
      <section className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] font-bold text-slate-900 dark:text-neutral-100">
              {t("personalDashboard.expenseCategories")}
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400">({currentMonth})</span>
          </div>
          <span className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold">
            {t("personalDashboard.analysis")}
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-neutral-800 flex overflow-hidden gap-0.5">
          <div className="h-full bg-blue-600 dark:bg-blue-500" style={{ width: "53%" }} title="Rent 53%" />
          <div className="h-full bg-sky-400 dark:bg-sky-500" style={{ width: "29%" }} title="Food 29%" />
          <div className="h-full bg-amber-400 dark:bg-amber-500" style={{ width: "9%" }} title="Transport 9%" />
          <div className="h-full bg-slate-300 dark:bg-neutral-600" style={{ width: "9%" }} title="Others 9%" />
        </div>

        {/* 2-col Category Grid */}
        <div className="grid grid-cols-2 gap-2 text-[12px] pt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0"></span>
            <span className="text-slate-500 dark:text-neutral-400 truncate">
              {t("personalDashboard.rent")}:
            </span>
            <strong className="text-slate-900 dark:text-neutral-100 font-mono font-bold shrink-0">
              {money(12000)}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 dark:bg-sky-500 shrink-0"></span>
            <span className="text-slate-500 dark:text-neutral-400 truncate">
              {t("personalDashboard.grocery")}:
            </span>
            <strong className="text-slate-900 dark:text-neutral-100 font-mono font-bold shrink-0">
              {money(6500)}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500 shrink-0"></span>
            <span className="text-slate-500 dark:text-neutral-400 truncate">
              {t("personalDashboard.transport")}:
            </span>
            <strong className="text-slate-900 dark:text-neutral-100 font-mono font-bold shrink-0">
              {money(2000)}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-neutral-600 shrink-0"></span>
            <span className="text-slate-500 dark:text-neutral-400 truncate">
              {t("personalDashboard.others")}:
            </span>
            <strong className="text-slate-900 dark:text-neutral-100 font-mono font-bold shrink-0">
              {money(2000)}
            </strong>
          </div>
        </div>
      </section>

      {/* 8. Recent Transactions Feed (সাম্প্রতিক লেনদেন) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] font-bold text-slate-900 dark:text-neutral-100">
              {t("personalDashboard.recentTxns")}
            </h2>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 font-semibold text-slate-600 dark:text-neutral-300">
              {num(displayTxns.length)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic("light");
              navigate("/transactions");
            }}
            className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            {t("personalDashboard.allTxns")}
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-neutral-800 overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
          {displayTxns.map((tx: any) => {
            const isIncome = tx.type === "income";
            const Icon = tx.icon || (isIncome ? TrendingUp : TrendingDown);

            return (
              <div
                key={tx._id}
                onClick={() => {
                  haptic("light");
                  navigate("/transactions");
                }}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-neutral-100 truncate">
                      {tx.category?.name || tx.title || tx.note || "Transaction"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                      {tx.paymentMethod || tx.account || "Cash"} •{" "}
                      {typeof tx.date === "string" ? fmtDate(tx.date, "short") : tx.date}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[14px] font-mono font-bold ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {money(tx.amount)}
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                    {isIncome ? t("txn.income") : t("txn.expense")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Floating / Sticky Quick Action Dock */}
      <div className="fixed bottom-16 lg:bottom-6 left-0 right-0 z-40 px-4 pb-2 pt-2 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-slate-200/80 dark:border-neutral-800 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOpenTxn("income")}
            className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center gap-1.5 text-[13px] font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus size={18} />
            {t("personalDashboard.receivedMoney")}
          </button>

          <button
            type="button"
            onClick={() => handleOpenTxn("expense")}
            className="h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center gap-1.5 text-[13px] font-bold shadow-md shadow-rose-500/20 transition-all"
          >
            <Minus size={18} />
            {t("personalDashboard.paidMoney")}
          </button>
        </div>
      </div>

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
