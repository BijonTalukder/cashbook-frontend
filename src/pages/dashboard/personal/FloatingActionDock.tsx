import React from "react";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { haptic } from "../../../native/bridge";

interface FloatingActionDockProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const FloatingActionDock: React.FC<FloatingActionDockProps> = ({
  onAddIncome,
  onAddExpense,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-16 lg:bottom-6 left-0 right-0 z-40 px-4 pb-2 pt-2 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-slate-200/80 dark:border-neutral-800 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onAddIncome();
          }}
          className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center gap-1.5 text-[13px] font-bold shadow-md shadow-emerald-500/20 transition-all select-none"
        >
          <Plus size={18} />
          {t("personalDashboard.receivedMoney")}
        </button>

        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onAddExpense();
          }}
          className="h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center gap-1.5 text-[13px] font-bold shadow-md shadow-rose-500/20 transition-all select-none"
        >
          <Minus size={18} />
          {t("personalDashboard.paidMoney")}
        </button>
      </div>
    </div>
  );
};

export default FloatingActionDock;
