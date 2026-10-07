import React from "react";
import { ShoppingCart, Truck, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";

interface BusinessKpiGridProps {
  todaySales: number;
  todayPurchases: number;
  totalReceivable: number;
  totalPayable: number;
  currency?: string;
  salesGrowth?: number;
  purchaseCount?: number;
  debtorCount?: number;
  creditorCount?: number;
  periodLabel?: string;
}

export const BusinessKpiGrid: React.FC<BusinessKpiGridProps> = ({
  todaySales,
  todayPurchases,
  totalReceivable,
  totalPayable,
  currency,
  salesGrowth,
  purchaseCount = 0,
  debtorCount = 0,
  creditorCount = 0,
  periodLabel = "আজকের লাইভ হিসাব",
}) => {
  const { t } = useTranslation();
  const { money, num } = useFormat(toCurrency(currency));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
          দোকানের পরিস্থিতি
        </h2>
        <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
          {periodLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* KPI 1: Today's Sales */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-3.5 sm:p-4 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate">
              {t("bizDashboard.todaySales")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-neutral-100 block truncate">
              {money(todaySales)}
            </span>
            <div className="mt-1 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                {salesGrowth !== undefined
                  ? `${salesGrowth >= 0 ? "+" : ""}${num(salesGrowth)}% বিক্রি`
                  : "নগদ ও বাকি"}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Today's Purchases */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-3.5 sm:p-4 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate">
              {t("bizDashboard.todayPurchases")}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-neutral-100 block truncate">
              {money(todayPurchases)}
            </span>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 truncate">
              {purchaseCount > 0
                ? `${num(purchaseCount)}টি চালান ভাউচার`
                : "ক্রয় চালান"}
            </p>
          </div>
        </div>

        {/* KPI 3: Due Receivable (Baki Paona) */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-3.5 sm:p-4 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate">
              কাস্টমার বাকি পাব
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block truncate">
              {money(totalReceivable)}
            </span>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 truncate">
              {debtorCount > 0
                ? `${num(debtorCount)} জন খরিদ্দার বাকি`
                : "কাস্টমার পাওনা"}
            </p>
          </div>
        </div>

        {/* KPI 4: Supplier Payable (Dena) */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-3.5 sm:p-4 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 truncate">
              মহাজন দেনা
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 block truncate">
              {money(totalPayable)}
            </span>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1 truncate">
              {creditorCount > 0
                ? `${num(creditorCount)} জন সাপ্লায়ার বাকি`
                : "মহাজন দেনা"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessKpiGrid;
