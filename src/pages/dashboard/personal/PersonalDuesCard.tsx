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
  onSendReminder?: () => void;
  onPayNow?: () => void;
  onViewAll?: () => void;
}

export const PersonalDuesCard: React.FC<PersonalDuesCardProps> = ({
  receivableTotal,
  payableTotal,
  topReceivables = [],
  topPayables = [],
  currency,
  onSendReminder,
  onPayNow,
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
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                {t("personalDashboard.iWillGet")}
              </span>
              <ArrowDownLeft size={15} className="text-emerald-500" />
            </div>
            <p className="text-[16px] sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {money(receivableTotal)}
            </p>
            <div className="space-y-1 text-[11px] text-slate-700 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800 pt-2 mt-2">
              {topReceivables.length === 0 ? (
                <div className="flex justify-between text-slate-400 dark:text-neutral-500">
                  <span>{t("personalDashboard.noReceivables")}</span>
                  <span className="font-mono font-semibold">৳ ০</span>
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

          <button
            type="button"
            onClick={() => {
              haptic("light");
              onSendReminder?.();
            }}
            className="w-full mt-2 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors active:scale-95"
          >
            {t("personalDashboard.sendReminder")}
          </button>
        </div>

        {/* I will give (Payable) */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-neutral-800 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                {t("personalDashboard.iWillGive")}
              </span>
              <ArrowUpRight size={15} className="text-rose-500" />
            </div>
            <p className="text-[16px] sm:text-lg font-mono font-bold text-rose-600 dark:text-rose-400 mt-1">
              {money(payableTotal)}
            </p>
            <div className="space-y-1 text-[11px] text-slate-700 dark:text-neutral-300 border-t border-slate-100 dark:border-neutral-800 pt-2 mt-2">
              {topPayables.length === 0 ? (
                <div className="flex justify-between text-slate-400 dark:text-neutral-500">
                  <span>{t("personalDashboard.noPayables")}</span>
                  <span className="font-mono font-semibold">৳ ০</span>
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

          <button
            type="button"
            onClick={() => {
              haptic("light");
              onPayNow?.();
            }}
            className="w-full mt-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors active:scale-95"
          >
            {t("personalDashboard.payNow")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PersonalDuesCard;