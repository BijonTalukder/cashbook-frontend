import React from "react";
import {
  ShoppingBag,
  Package,
  ArrowRight,
  UtensilsCrossed,
  Plus,
} from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { haptic } from "../../../native/bridge";

export interface IBazaarRecord {
  buyerName: string;
  buyerAvatarInitial: string;
  amount: number;
  itemsSummary: string;
  date?: string;
}

interface TodayDiningBazaarCardProps {
  bazaarRecord?: IBazaarRecord | null;
  todayMealsCount: number;
  onOpenMeals: () => void;
  onAddBazaar: () => void;
}

export const TodayDiningBazaarCard: React.FC<TodayDiningBazaarCardProps> = ({
  bazaarRecord,
  todayMealsCount,
  onOpenMeals,
  onAddBazaar,
}) => {
  const { t } = useTranslation();
  const { money, num } = useFormat();

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            {t("messDashboard.todaysDiningBazaar")}
          </h2>
        </div>
      </div>

      {/* Bazaar Summary Sub-card */}
      {bazaarRecord ? (
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                {bazaarRecord.buyerAvatarInitial ||
                  bazaarRecord.buyerName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-slate-800 dark:text-neutral-100 truncate block leading-tight">
                  {bazaarRecord.buyerName}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate block">
                  {t("messDashboard.bazaarInCharge")}
                </span>
              </div>
            </div>
            <span className="text-base font-extrabold text-slate-900 dark:text-neutral-100 shrink-0">
              {money(bazaarRecord.amount, { decimals: 0 })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-700/60 p-2 rounded-xl">
            <Package size={14} className="text-slate-400 dark:text-neutral-500 shrink-0" />
            <span className="truncate">{bazaarRecord.itemsSummary}</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-neutral-400">
            {t("messDashboard.noBazaarToday")}
          </span>
          <button
            type="button"
            onClick={() => {
              haptic("selection");
              onAddBazaar();
            }}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Plus size={14} />
            <span>{t("messDashboard.recordBazaarNow")}</span>
          </button>
        </div>
      )}

      {/* Real Dining Meals Status & Action */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
          <UtensilsCrossed size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            {t("messDashboard.todaysTotalMealsRecorded", {
              count: num(todayMealsCount, { maximumFractionDigits: 1 }),
            })}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onOpenMeals();
          }}
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5 active:scale-95 transition-all select-none"
        >
          <span>{t("messDashboard.viewTodayMeals")}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
