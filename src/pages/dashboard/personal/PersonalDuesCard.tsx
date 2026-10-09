import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";
import { haptic } from "../../../native/bridge";

export interface IPersonalDueRow {
  name: string;
  amount: number;
}

interface PersonalDuesCardProps {
  receivableTotal: number;
  payableTotal: number;
  topReceivables?: IPersonalDueRow[];
  topPayables?: IPersonalDueRow[];
  currency?: string;
  onViewAll?: () => void;
}

export const PersonalDuesCard: React.FC<PersonalDuesCardProps> = ({
  receivableTotal,
  payableTotal,
  topReceivables = [],
  topPayables = [],
  currency,
  onViewAll,
}) => {
  const { t } = useTranslation();
  const { money } = useFormat(toCurrency(currency));

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[14px] text-slate-900 dark:text-neutral-100 font-bold">
            {t("personalDashboard.personalDues")}
          </h2>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onViewAll?.();
          }}
          className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          {t("personalDashboard.viewDetails")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* I will get (Receivable) */}
        <div
          onClick={() => {
            haptic("light");
            onViewAll?.();
          }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-2 flex flex-col justify-between cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all select-none group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                {t("personalDashboard.iWillGet")}
              </span>
              <ArrowDownLeft size={15} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[16px] sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {money(receivableTotal)}
            </p>
            <div className="space-y-1 text-[11px] text-slate-700 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800 pt-2 mt-2">
              {topReceivables.length === 0 ? (
                <div className="flex justify-between text-slate-400 dark:text-neutral-500">
                  <span>{t("personalDashboard.noReceivables")}</span>
                  <span className="font-mono font-semibold">{money(0, { decimals: 0 })}</span>
                </div>
              ) : (
                topReceivables.slice(0, 3).map((row, idx) => (
                  <div key={`${row.name}-${idx}`} className="flex justify-between">
                    <span className="truncate">{row.name}</span>
                    <span className="font-mono font-semibold">{money(row.amount, { decimals: 0 })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* I will give (Payable) */}
        <div
          onClick={() => {
            haptic("light");
            onViewAll?.();
          }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-2 flex flex-col justify-between cursor-pointer hover:border-rose-300 dark:hover:border-rose-800/80 transition-all select-none group"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                {t("personalDashboard.iWillGive")}
              </span>
              <ArrowUpRight size={15} className="text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[16px] sm:text-lg font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">
              {money(payableTotal)}
            </p>
            <div className="space-y-1 text-[11px] text-slate-700 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800 pt-2 mt-2">
              {topPayables.length === 0 ? (
                <div className="flex justify-between text-slate-400 dark:text-neutral-500">
                  <span>{t("personalDashboard.noPayables")}</span>
                  <span className="font-mono font-semibold">{money(0, { decimals: 0 })}</span>
                </div>
              ) : (
                topPayables.slice(0, 3).map((row, idx) => (
                  <div key={`${row.name}-${idx}`} className="flex justify-between">
                    <span className="truncate">{row.name}</span>
                    <span className="font-mono font-semibold">{money(row.amount, { decimals: 0 })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalDuesCard;