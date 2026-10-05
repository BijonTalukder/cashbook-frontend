import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { toCurrency } from "../../../utils/currency";
import { haptic } from "../../../native/bridge";

interface RecentTxnsListProps {
  transactions: any[];
  currency?: string;
  onViewAll?: () => void;
}

export const RecentTxnsList: React.FC<RecentTxnsListProps> = ({
  transactions,
  currency,
  onViewAll,
}) => {
  const { t } = useTranslation();
  const { money, num, date: fmtDate } = useFormat(toCurrency(currency));

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[14px] font-bold text-slate-900 dark:text-neutral-100">
            {t("personalDashboard.recentTxns")}
          </h2>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 font-semibold text-slate-600 dark:text-neutral-300">
            {num(transactions.length)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onViewAll?.();
          }}
          className="text-[12px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          {t("personalDashboard.allTxns")}
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-neutral-800 overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800/80">
        {transactions.map((tx: any) => {
          const isIncome = tx.type === "income";
          const Icon = tx.icon || (isIncome ? TrendingUp : TrendingDown);

          return (
            <div
              key={tx._id}
              onClick={() => {
                haptic("light");
                onViewAll?.();
              }}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isIncome
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-neutral-100 truncate">
                    {tx.category?.name || tx.title || tx.note || "Transaction"}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                    {tx.paymentMethod || tx.account || "Cash"} •{" "}
                    {typeof tx.date === "string" ? fmtDate(tx.date, "short") : tx.date}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-[14px] font-mono font-bold ${
                    isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {money(tx.amount)}
                </span>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                  {isIncome ? t("txn.income") : t("txn.expense")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default RecentTxnsList;
