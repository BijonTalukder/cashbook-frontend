import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { IProduct } from "../../../services/product.service";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { haptic } from "../../../native/bridge";

interface LowStockAlertCardProps {
  lowStockProducts: IProduct[];
  onOrderNow: () => void;
}

export const LowStockAlertCard: React.FC<LowStockAlertCardProps> = ({
  lowStockProducts,
  onOrderNow,
}) => {
  const { t } = useTranslation();
  const { num } = useFormat();

  if (lowStockProducts.length === 0) {
    return (
      <div className="rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 p-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              {t("bizDashboard.stockSufficient")}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {t("bizDashboard.noLowStock")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const itemsSummary = lowStockProducts
    .slice(0, 3)
    .map((p) => `${p.name} (${t("bizDashboard.remaining")} ${num(p.stock)} ${p.unit || ""})`)
    .join(" • ");

  return (
    <div className="rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 p-3.5 sm:p-4 flex items-start gap-3 shadow-xs">
      <div className="w-9 h-9 rounded-2xl bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-neutral-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
        <AlertTriangle size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate">
            {num(lowStockProducts.length)} {t("bizDashboard.lowStockWarning")}
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full shrink-0">
            {t("bizDashboard.orderSoon")}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 truncate">
          {itemsSummary}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          haptic("medium");
          onOrderNow();
        }}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-xs hover:bg-rose-700 active:scale-95 transition-all self-center select-none"
      >
        {t("bizDashboard.orderNow")}
      </button>
    </div>
  );
};

export default LowStockAlertCard;
