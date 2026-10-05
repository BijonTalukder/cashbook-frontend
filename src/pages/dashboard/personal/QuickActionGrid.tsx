import React from "react";
import { PlusCircle, MinusCircle, ArrowLeftRight, Users } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { haptic } from "../../../native/bridge";

interface QuickActionGridProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onTransfer: () => void;
  onOpenDues: () => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onAddIncome,
  onAddExpense,
  onTransfer,
  onOpenDues,
}) => {
  const { t } = useTranslation();
  const { num } = useFormat();

  return (
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
          onClick={() => {
            haptic("selection");
            onAddIncome();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group select-none"
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
          onClick={() => {
            haptic("selection");
            onAddExpense();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group select-none"
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
          onClick={() => {
            haptic("selection");
            onTransfer();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group select-none"
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
            onOpenDues();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-800 shadow-xs active:scale-95 transition-all group select-none"
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
  );
};

export default QuickActionGrid;
