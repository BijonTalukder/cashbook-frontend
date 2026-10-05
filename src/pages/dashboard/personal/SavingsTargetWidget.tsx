import React from "react";
import { PiggyBank } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";

interface SavingsTargetWidgetProps {
  currentSaved: number;
  targetAmount: number;
  currency?: string;
}

export const SavingsTargetWidget: React.FC<SavingsTargetWidgetProps> = ({
  currentSaved,
  targetAmount,
  currency,
}) => {
  const { t } = useTranslation();
  const { money, num } = useFormat(toCurrency(currency));

  const percent = Math.min(100, Math.round((currentSaved / targetAmount) * 100));

  return (
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
          {num(percent)}% {t("personalDashboard.completed")}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
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
            {money(targetAmount)}
          </strong>
        </span>
      </div>
    </section>
  );
};

export default SavingsTargetWidget;
