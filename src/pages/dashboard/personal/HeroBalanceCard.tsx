import React from "react";
import { Eye, EyeOff, Wallet, Smartphone, Landmark } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";

interface HeroBalanceCardProps {
  totalBalance: number;
  cashBalance: number;
  mfsBalance: number;
  bankBalance: number;
  currency?: string;
  balanceHidden: boolean;
  onToggleHide: () => void;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  totalBalance,
  cashBalance,
  mfsBalance,
  bankBalance,
  currency,
  balanceHidden,
  onToggleHide,
}) => {
  const { t } = useTranslation();
  const { money } = useFormat(toCurrency(currency));

  return (
    <section className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-4">
      {/* Top indicator & Hide toggle button */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {t("personalDashboard.totalBalance")}
        </span>

        <button
          type="button"
          onClick={onToggleHide}
          className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 transition-colors active:scale-95"
        >
          {balanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="font-medium">
            {balanceHidden ? t("personalDashboard.show") : t("personalDashboard.hide")}
          </span>
        </button>
      </div>

      {/* Big Balance Amount */}
      <div className="flex items-baseline gap-1 py-1">
        {balanceHidden ? (
          <span className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-slate-400 dark:text-neutral-600 select-none">
            ••••••••
          </span>
        ) : (
          <span className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            {money(totalBalance)}
          </span>
        )}
      </div>

      {/* Account Breakdown Strip */}
      <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 grid grid-cols-3 gap-2">
        {/* Cash */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
            <Wallet size={13} className="text-emerald-500" />
            {t("personalDashboard.cash")}
          </span>
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-neutral-200 mt-0.5 truncate">
            {balanceHidden ? "••••" : money(cashBalance)}
          </span>
        </div>

        {/* bKash / Nagad */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
            <Smartphone size={13} className="text-blue-500" />
            {t("personalDashboard.mfs")}
          </span>
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-neutral-200 mt-0.5 truncate">
            {balanceHidden ? "••••" : money(mfsBalance)}
          </span>
        </div>

        {/* Bank */}
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
            <Landmark size={13} className="text-purple-500" />
            {t("personalDashboard.bank")}
          </span>
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-neutral-200 mt-0.5 truncate">
            {balanceHidden ? "••••" : money(bankBalance)}
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroBalanceCard;
