import React from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";

interface DailyPerformanceStripProps {
  cashSales: number;
  dueSales: number;
  totalProfit: number;
  currency?: string;
  dateStr?: string;
}

export const DailyPerformanceStrip: React.FC<DailyPerformanceStripProps> = ({
  cashSales,
  dueSales,
  totalProfit,
  currency,
  dateStr,
}) => {
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat(toCurrency(currency));

  const displayDate = dateStr || fmtDate(new Date(), "long");
  const isPositiveProfit = totalProfit >= 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-4 rounded-3xl shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 dark:text-neutral-100">
          আজকের কার্যবিবরণী সারাংশ
        </span>
        <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
          {displayDate}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Cash Sales */}
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 p-2.5 rounded-2xl flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 block font-medium truncate">
            নগদ বিক্রি
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-neutral-100 block mt-0.5 truncate">
            {money(cashSales)}
          </span>
        </div>

        {/* Due Sales */}
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 p-2.5 rounded-2xl flex flex-col justify-center">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 block font-medium truncate">
            বাকি বিক্রি
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-neutral-100 block mt-0.5 truncate">
            {money(dueSales)}
          </span>
        </div>

        {/* Total Profit */}
        <div
          className={`border p-2.5 rounded-2xl flex flex-col justify-center ${
            isPositiveProfit
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-300"
          }`}
        >
          <span className="text-[11px] block font-medium truncate">
            মোট লাভ
          </span>
          <span className="text-sm sm:text-base font-bold font-mono block mt-0.5 truncate">
            {money(totalProfit, { signed: true })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyPerformanceStrip;
