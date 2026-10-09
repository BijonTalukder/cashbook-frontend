import React from "react";
import { ShoppingBag, Plus, ArrowRight, Receipt } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { haptic } from "../../../native/bridge";
import { type ITransaction } from "../../../services/transaction.service";

export interface TodayDiningBazaarCardProps {
  transactions?: ITransaction[];
  onAddBazaar: () => void;
  onViewAll?: () => void;
  // Backward compatibility alias props
  bazaarRecord?: unknown;
  todayMealsCount?: number;
  onOpenMeals?: () => void;
}

export const TodayDiningBazaarCard: React.FC<TodayDiningBazaarCardProps> = ({
  transactions = [],
  onAddBazaar,
  onViewAll,
}) => {
  const { t } = useTranslation();
  const { money, date: fmtDate } = useFormat();

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShoppingBag size={18} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            {t("messDashboard.recentBazaarExpenses")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic("medium");
            onAddBazaar();
          }}
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2.5 py-1.5 rounded-xl transition-colors active:scale-95"
        >
          <Plus size={14} />
          <span>{t("messDashboard.addBazaarExpense")}</span>
        </button>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center">
          <Receipt size={24} className="text-slate-400 dark:text-neutral-500" />
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            {t("messDashboard.noBazaarThisMonth")}
          </p>
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              onAddBazaar();
            }}
            className="mt-1 flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl shadow-xs transition-colors active:scale-95"
          >
            <Plus size={14} />
            <span>{t("messDashboard.recordBazaarNow")}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((txn) => {
            const memberName = txn.member
              ? `${txn.member.firstName || ""} ${txn.member.lastName || ""}`.trim() || txn.member.email
              : t("common.member");
            const initial = (memberName || "U").slice(0, 2).toUpperCase();
            const noteText = txn.note || txn.category?.name || t("messDashboard.bazaarExpense");

            return (
              <div
                key={txn._id}
                className="bg-slate-50/80 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate block leading-tight">
                      {memberName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate block mt-0.5">
                      {txn.date ? fmtDate(txn.date, "short") : ""} • {noteText}
                    </span>
                  </div>
                </div>

                <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 shrink-0 font-mono">
                  -{money(txn.amount, { decimals: 0 })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to all transactions */}
      {transactions.length > 0 && onViewAll && (
        <button
          type="button"
          onClick={() => {
            haptic("selection");
            onViewAll();
          }}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 pt-1 active:scale-95 transition-all select-none"
        >
          <span>{t("dashboard.recentTransactions")}</span>
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export const MessRecentBazaarCard = TodayDiningBazaarCard;
export type IBazaarRecord = unknown;
