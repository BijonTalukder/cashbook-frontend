import React from "react";
import { Eye, EyeOff, Wallet, Landmark, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";
import { haptic } from "../../../native/bridge";

interface BusinessHeroBalanceCardProps {
  totalCash: number;
  cashInDrawer: number;
  bankBalance: number;
  currency?: string;
  growthPercentage?: number;
  balanceHidden: boolean;
  onToggleHide: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const BusinessHeroBalanceCard: React.FC<BusinessHeroBalanceCardProps> = ({
  totalCash,
  cashInDrawer,
  bankBalance,
  currency,
  growthPercentage,
  balanceHidden,
  onToggleHide,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { money, num } = useFormat(toCurrency(currency));

  const hasGrowth = growthPercentage !== undefined;
  const isPositiveGrowth = (growthPercentage ?? 0) >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-5 shadow-xs transition-all space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
            <span className="text-xs uppercase tracking-wider font-semibold">
              {t("bizDashboard.totalCashInHand")}
            </span>
            <button
              type="button"
              onClick={() => {
                haptic("light");
                onToggleHide();
              }}
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 active:scale-95 transition-all text-slate-500 dark:text-neutral-400"
              aria-label="Toggle balance privacy"
            >
              {balanceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="mt-1 flex items-baseline gap-2.5">
            {balanceHidden ? (
              <span className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-slate-400 dark:text-neutral-600 select-none">
                ••••••••
              </span>
            ) : (
              <span className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
                {money(totalCash)}
              </span>
            )}

            {hasGrowth && (
              <span
                className={`inline-flex items-center text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                  isPositiveGrowth
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60"
                }`}
              >
                {isPositiveGrowth ? (
                  <ArrowUpRight size={14} className="mr-0.5" />
                ) : (
                  <ArrowDownRight size={14} className="mr-0.5" />
                )}
                {isPositiveGrowth ? "+" : ""}
                {num(growthPercentage, { maximumFractionDigits: 1 })}%
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic("light");
            onRefresh();
          }}
          className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center active:scale-90 transition-transform shadow-xs shrink-0"
          title={t("bizDashboard.refreshSummary")}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin text-blue-600" : ""}
          />
        </button>
      </div>

      {/* In-card Sub-ledger Strip */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 p-3 rounded-2xl">
        {/* Cash Drawer */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
            <Wallet size={14} className="text-emerald-500 shrink-0" />
            {t("bizDashboard.cashDrawer")}
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 truncate">
            {balanceHidden ? "••••" : money(cashInDrawer)}
          </span>
        </div>

        {/* Bank / Electronic balance */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
            <Landmark size={14} className="text-blue-500 shrink-0" />
            {t("bizDashboard.bankDeposit")}
          </span>
          <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-neutral-100 mt-1 truncate">
            {balanceHidden ? "••••" : money(bankBalance)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BusinessHeroBalanceCard;
