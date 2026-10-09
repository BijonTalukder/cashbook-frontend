import React from "react";
import {
  UtensilsCrossed,
  ShoppingCart,
  Coins,
  FileSpreadsheet,
} from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { haptic } from "../../../native/bridge";

interface MessQuickActionGridProps {
  onMealEntry: () => void;
  onBazaarExpense: () => void;
  onAcceptDeposit: () => void;
  onMealSheet: () => void;
}

export const MessQuickActionGrid: React.FC<MessQuickActionGridProps> = ({
  onMealEntry,
  onBazaarExpense,
  onAcceptDeposit,
  onMealSheet,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {/* 1. Meal Entry */}
      <button
        type="button"
        onClick={() => {
          haptic("selection");
          onMealEntry();
        }}
        className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-3 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
      >
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
          <UtensilsCrossed size={20} />
        </div>
        <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
          {t("messDashboard.mealEntry")}
        </span>
      </button>

      {/* 2. Bazaar Expense */}
      <button
        type="button"
        onClick={() => {
          haptic("selection");
          onBazaarExpense();
        }}
        className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-3 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
      >
        <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
          <ShoppingCart size={20} />
        </div>
        <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
          {t("messDashboard.bazaarExpense")}
        </span>
      </button>

      {/* 3. Accept Deposit */}
      <button
        type="button"
        onClick={() => {
          haptic("selection");
          onAcceptDeposit();
        }}
        className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-3 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
      >
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Coins size={20} />
        </div>
        <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
          {t("messDashboard.acceptDeposit")}
        </span>
      </button>

      {/* 4. Meal Sheet */}
      <button
        type="button"
        onClick={() => {
          haptic("selection");
          onMealSheet();
        }}
        className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 active:scale-95 transition-all p-3 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1.5 text-center group select-none hover:bg-slate-50 dark:hover:bg-neutral-800/60"
      >
        <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
          <FileSpreadsheet size={20} />
        </div>
        <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
          {t("messDashboard.mealSheet")}
        </span>
      </button>
    </div>
  );
};
