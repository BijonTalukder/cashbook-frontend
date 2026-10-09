import React from "react";
import { ShoppingCart, Package, Receipt, BookOpen } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { haptic } from "../../../native/bridge";

interface BusinessQuickActionGridProps {
  onNewSale: () => void;
  onNewPurchase: () => void;
  onNewExpense: () => void;
  onOpenBaki: () => void;
}

export const BusinessQuickActionGrid: React.FC<BusinessQuickActionGridProps> = ({
  onNewSale,
  onNewPurchase,
  onNewExpense,
  onOpenBaki,
}) => {
  const { t } = useTranslation();

  const ACTIONS = [
    {
      key: "sale",
      label: t("bizDashboard.newSale"),
      icon: ShoppingCart,
      colorClass:
        "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
      onClick: () => {
        haptic("selection");
        onNewSale();
      },
    },
    {
      key: "purchase",
      label: t("bizDashboard.purchaseGoods"),
      icon: Package,
      colorClass:
        "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
      onClick: () => {
        haptic("selection");
        onNewPurchase();
      },
    },
    {
      key: "expense",
      label: t("bizDashboard.dailyExpense"),
      icon: Receipt,
      colorClass:
        "bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white",
      onClick: () => {
        haptic("selection");
        onNewExpense();
      },
    },
    {
      key: "baki",
      label: t("bizDashboard.dueBook"),
      icon: BookOpen,
      colorClass:
        "bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white",
      onClick: () => {
        haptic("selection");
        onOpenBaki();
      },
    },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
          {t("bizDashboard.quickActions")}
        </h2>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
          {t("bizDashboard.shortcuts")}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ key, label, icon: Icon, colorClass, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className="group bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-2.5 sm:p-3 rounded-2xl shadow-xs flex flex-col items-center text-center active:scale-95 transition-all select-none hover:shadow-sm"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${colorClass}`}
            >
              <Icon size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 mt-2 leading-tight">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BusinessQuickActionGrid;
