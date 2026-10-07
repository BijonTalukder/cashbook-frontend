import React from "react";
import { Gauge, Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";

interface LiveMealRateHeroCardProps {
  mealRate: number;
  totalBazaar: number;
  totalMeals: number;
  todayMeals?: number;
  daysPassed?: number;
  cashFund: number;
}

export const LiveMealRateHeroCard: React.FC<LiveMealRateHeroCardProps> = ({
  mealRate,
  totalBazaar,
  totalMeals,
  todayMeals = 0,
  daysPassed = 0,
  cashFund,
}) => {
  const { t } = useTranslation();
  const { money, num } = useFormat();

  const isSafeFund = cashFund >= 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden">
      {/* Ambient decorative gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-500" />

      {/* Header with live rate indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Gauge size={18} />
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-neutral-400">
            {t("messDashboard.liveMealRate")}
          </span>
        </div>
        <span className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {t("messDashboard.autoCalc")}
        </span>
      </div>

      {/* Primary Rate Hero Value */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            {money(mealRate, { decimals: 2 })}
          </span>
          <span className="text-sm font-semibold text-slate-500 dark:text-neutral-400">
            {t("messDashboard.perMeal")}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/60 dark:border-neutral-700/60 px-2.5 py-1 rounded-xl self-start text-xs">
          <Calculator size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            {t("messDashboard.rateFormula", {
              bazaar: money(totalBazaar, { decimals: 0 }),
              meals: num(totalMeals, { maximumFractionDigits: 1 }),
            })}
          </span>
        </div>
      </div>

      {/* 3-Column Sub-Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-neutral-800/70">
        {/* Metric 1: Today's Meals */}
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 p-2.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
            {t("messDashboard.todaysMeals")}
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-neutral-100 mt-0.5">
            {num(todayMeals, { maximumFractionDigits: 1 })} টি
          </span>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 truncate">
            {todayMeals > 0 ? (t("mess.mealsRecordedToday") || "আজকের এন্ট্রি") : (t("mess.noMealsToday") || "আজকের হিসাব")}
          </span>
        </div>

        {/* Metric 2: Total Meals */}
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 p-2.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
            {t("messDashboard.currentTotalMeals")}
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-neutral-100 mt-0.5">
            {num(totalMeals, { maximumFractionDigits: 1 })} টি
          </span>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5 truncate">
            {t("messDashboard.daysCompleted", { days: num(daysPassed) })}
          </span>
        </div>

        {/* Metric 3: Cash Fund */}
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 p-2.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
            {t("messDashboard.cashFund")}
          </span>
          <span
            className={`text-base font-bold mt-0.5 ${
              isSafeFund
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {money(cashFund, { decimals: 0, signed: true })}
          </span>
          <span
            className={`text-[10px] font-semibold mt-0.5 truncate flex items-center gap-0.5 ${
              isSafeFund
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isSafeFund ? (
              <>
                <CheckCircle2 size={10} className="shrink-0" />
                <span>{t("messDashboard.safeFund")}</span>
              </>
            ) : (
              <>
                <AlertCircle size={10} className="shrink-0" />
                <span>{t("messDashboard.deficitFund")}</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
