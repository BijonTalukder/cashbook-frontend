import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";

interface IncomeExpenseCardsProps {
  totalIncome: number;
  totalExpense: number;
  currency?: string;
  balanceHidden?: boolean;
}

export const IncomeExpenseCards: React.FC<IncomeExpenseCardsProps> = ({
  totalIncome,
  totalExpense,
  currency,
  balanceHidden = false,
}) => {
  const { t } = useTranslation();
  const { money, monthName } = useFormat(toCurrency(currency));

  const currentMonth = monthName(new Date().getMonth(), "long");

  return (
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
  );
};

export default IncomeExpenseCards;
