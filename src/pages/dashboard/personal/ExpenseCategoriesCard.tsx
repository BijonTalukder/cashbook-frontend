import React from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";

interface ExpenseCategoriesCardProps {
  currency?: string;
}

export const ExpenseCategoriesCard: React.FC<ExpenseCategoriesCardProps> = ({
  currency,
}) => {
  const { t } = useTranslation();
  const { money, monthName } = useFormat(toCurrency(currency));

  const currentMonth = monthName(new Date().getMonth(), "long");

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-3xl p-4 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[14px] font-bold text-slate-900 dark:text-neutral-100">
            {t("personalDashboard.expenseCategories")}
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
            ({currentMonth})
          </span>
        </div>
        <span className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold">
          {t("personalDashboard.analysis")}
        </span>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-neutral-800 flex overflow-hidden gap-0.5">
        <div
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
          style={{ width: "53%" }}
          title="Rent 53%"
        />
        <div
          className="h-full bg-sky-400 dark:bg-sky-500 transition-all duration-300"
          style={{ width: "29%" }}
          title="Food 29%"
        />
        <div
          className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-300"
          style={{ width: "9%" }}
          title="Transport 9%"
        />
        <div
          className="h-full bg-slate-300 dark:bg-neutral-600 transition-all duration-300"
          style={{ width: "9%" }}
          title="Others 9%"
        />
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
  );
};

export default ExpenseCategoriesCard;
