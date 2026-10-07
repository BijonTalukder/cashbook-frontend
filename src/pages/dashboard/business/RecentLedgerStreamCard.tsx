import React from "react";
import { History, ChevronRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { ITransaction } from "../../../services/transaction.service";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";
import { paymentMethodLabel } from "../../../i18n/labels";
import { haptic } from "../../../native/bridge";

interface RecentLedgerStreamCardProps {
  transactions: ITransaction[];
  currency?: string;
  onViewAll: () => void;
  onSelectTxn?: (txn: ITransaction) => void;
}

export const RecentLedgerStreamCard: React.FC<RecentLedgerStreamCardProps> = ({
  transactions,
  currency,
  onViewAll,
  onSelectTxn,
}) => {
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat(toCurrency(currency));

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3">
      {/* Header with View All link */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <History size={18} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            {t("bizDashboard.recentLedger")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onViewAll();
          }}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5 select-none"
        >
          <span>{t("bizDashboard.viewAll")}</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400 dark:text-neutral-500 gap-1.5">
          <History size={24} className="text-slate-300 dark:text-neutral-600" />
          <p className="text-xs font-medium">{t("bizDashboard.noTransactionsFound")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 5).map((txn) => {
            const isIncome = txn.type === "income";
            const partyName =
              txn.customer?.name ||
              txn.supplier?.name ||
              txn.category?.name ||
              (isIncome ? t("bizDashboard.cashCredit") : t("bizDashboard.shopDebit"));

            const initial = partyName.trim().slice(0, 1) || "T";

            const method = txn.paymentMethod
              ? paymentMethodLabel(t, txn.paymentMethod)
              : t("bizDashboard.cashMethod");

            const timeLabel = fmtDate(txn.date, "short");

            return (
              <div
                key={txn._id}
                onClick={() => {
                  haptic("light");
                  onSelectTxn?.(txn);
                }}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-neutral-800/50 hover:bg-slate-100/80 dark:hover:bg-neutral-800 transition-colors select-none cursor-pointer"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                      isIncome
                        ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                        : "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
                    }`}
                  >
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate block">
                      {partyName}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded-md bg-white dark:bg-neutral-700 border border-slate-200/70 dark:border-neutral-600 text-slate-700 dark:text-neutral-300 font-semibold text-[10px]">
                        {method}
                      </span>
                      <span className="truncate">
                        {txn.note || (isIncome ? t("txn.income") : t("txn.expense"))} • {timeLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Status */}
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-mono font-bold block ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {money(isIncome ? txn.amount : -txn.amount, { signed: true })}
                  </span>
                  <span
                    className={`text-[10px] font-semibold block ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-neutral-500"
                    }`}
                  >
                    {isIncome ? t("bizDashboard.settledStatus") : t("bizDashboard.cashInvoice")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentLedgerStreamCard;
