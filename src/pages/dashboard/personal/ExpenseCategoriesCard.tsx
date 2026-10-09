import React from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";
import { PieChart } from "lucide-react";

export interface IExpenseCategoryItem {
  name: string;
  amount: number;
  percentage: number;
  colorClass: string;
  dotColorClass: string;
}

interface ExpenseCategoriesCardProps {
  currency?: string;
  categories?: IExpenseCategoryItem[];
  periodLabel?: string;
  onViewAnalysis?: () => void;
}

export const ExpenseCategoriesCard: React.FC<ExpenseCategoriesCardProps> = ({
  currency,
  categories = [],
  periodLabel,
  onViewAnalysis,
}) => {
  const { t } = useTranslation();
  const { money, monthName, num } = useFormat(toCurrency(currency));

  const currentMonth = periodLabel || monthName(new Date().getMonth(), "long");

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[14px] font-bold text-slate-900 dark:text-neutral-100 truncate">
            {t("personalDashboard.expenseCategories")}
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
            ({currentMonth})
          </span>
        </div>
        {onViewAnalysis && (
          <button
            type="button"
            onClick={onViewAnalysis}
            className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0"
          >
            {t("personalDashboard.analysis")}
          </button>
        )}
      </div>

      {categories.length > 0 ? (
        <>
          {/* Multi-segment Dynamic Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-neutral-800 flex overflow-hidden gap-0.5">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className={`h-full ${cat.colorClass} transition-all duration-500`}
                style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                title={`${cat.name} ${cat.percentage}%`}
              />
            ))}
          </div>

          {/* Dynamic 2-col Category Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-[12px] pt-1">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between gap-1.5 min-w-0 bg-slate-50 dark:bg-neutral-800/50 p-2 rounded-xl">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.dotColorClass} shrink-0`} />
                  <span className="text-slate-600 dark:text-neutral-300 truncate font-medium">
                    {cat.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-900 dark:text-neutral-100 font-mono font-bold block text-xs">
                    {money(cat.amount, { decimals: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 block">
                    {num(cat.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-4 text-center text-slate-400 dark:text-neutral-500 text-xs flex flex-col items-center gap-1">
          <PieChart size={20} className="text-slate-300 dark:text-neutral-600" />
          <span>{t("personalDashboard.noExpensesRecorded")}</span>
        </div>
      )}
    </section>
  );
};

export default ExpenseCategoriesCard;
