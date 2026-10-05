import React from "react";
import { ShoppingCart, Coins } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { haptic } from "../../../native/bridge";

interface MessFloatingActionDockProps {
  onAddBazaar: () => void;
  onAddDeposit: () => void;
}

export const MessFloatingActionDock: React.FC<MessFloatingActionDockProps> = ({
  onAddBazaar,
  onAddDeposit,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-[calc(var(--bottomnav-h,56px)+var(--safe-bottom,0px)+8px)] sm:bottom-4 left-0 right-0 z-30 px-4 pointer-events-none">
      <div className="max-w-lg mx-auto flex items-center gap-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-neutral-800 p-2 rounded-2xl shadow-xl pointer-events-auto">
        {/* + Add Bazaar Expense */}
        <button
          type="button"
          onClick={() => {
            haptic("medium");
            onAddBazaar();
          }}
          className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-white font-bold text-sm shadow-md shadow-indigo-600/20 select-none"
        >
          <ShoppingCart size={18} />
          <span>{t("messDashboard.addBazaarExpense")}</span>
        </button>

        {/* + Member Deposit */}
        <button
          type="button"
          onClick={() => {
            haptic("medium");
            onAddDeposit();
          }}
          className="flex-1 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-[0.97] transition-all flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm shadow-xs select-none"
        >
          <Coins size={18} />
          <span>{t("messDashboard.addMemberDeposit")}</span>
        </button>
      </div>
    </div>
  );
};
