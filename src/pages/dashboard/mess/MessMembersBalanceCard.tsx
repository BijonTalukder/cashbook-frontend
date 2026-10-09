import React from "react";
import {
  Users,
  Send,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { shareViaWhatsApp } from "../../../utils/share";
import { haptic } from "../../../native/bridge";

export interface IMessMemberItem {
  memberId: string;
  name: string;
  mealsCount: number;
  totalDeposited: number;
  totalCost: number;
  balance: number; // positive = refund, negative = due
  overdueDays?: number;
  phone?: string;
}

interface MessMembersBalanceCardProps {
  members: IMessMemberItem[];
  messName: string;
  onViewAllMembers: () => void;
}

export const MessMembersBalanceCard: React.FC<MessMembersBalanceCardProps> = ({
  members,
  messName,
  onViewAllMembers,
}) => {
  const { t, language } = useTranslation();
  const { money, num } = useFormat();

  // Summary counts
  const dueCount = members.filter((m) => m.balance < -0.01).length;
  const refundCount = members.filter((m) => m.balance > 0.01).length;
  const evenCount = members.length - dueCount - refundCount;

  // Handle reminder click
  const handleWhatsAppReminder = (m: IMessMemberItem) => {
    haptic("light");
    const dueAmount = money(Math.abs(m.balance), { decimals: 0 });
    const msg =
      language === "en"
        ? `Hello ${m.name},\nYour current month's due for ${messName} is ${dueAmount}. Please deposit promptly for bazaar expenses.\nThank you!`
        : `আসসালামু আলাইকুম ${m.name},\n${messName}-এ আপনার চলতি মাসের বকেয়া ${dueAmount} টাকা। মেসের বাজার খরচের সুবিধার জন্য অনুগ্রহ করে দ্রুত জমা দিন।\nধন্যবাদ!`;
    shareViaWhatsApp(msg);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            {t("messDashboard.membersFinancialStatus")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            {t("messDashboard.membersSubtitle", { count: num(members.length) })}
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400 shrink-0">
          <Users size={16} />
        </div>
      </div>

      {/* Segment Summary Indicator Pill */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-800/70 border border-slate-100 dark:border-neutral-800 px-3 py-2 rounded-2xl text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          {t("messDashboard.dueMembers", { count: num(dueCount) })}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {t("messDashboard.refundMembers", { count: num(refundCount) })}
        </span>
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          {t("messDashboard.equalMembers", { count: num(evenCount) })}
        </span>
      </div>

      {/* Member Ledger Cards List */}
      {members.length === 0 ? (
        <div className="py-6 text-center text-slate-400 dark:text-neutral-500 text-xs flex flex-col items-center gap-1.5">
          <Users size={24} className="text-slate-300 dark:text-neutral-600" />
          <span>{t("members.emptyDesc")}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.slice(0, 4).map((m, idx) => {
          const isRefund = m.balance > 0.01;
          const isDue = m.balance < -0.01;
          const isEven = !isRefund && !isDue;

          const avatarInitials = m.name.trim().slice(0, 2);

          return (
            <div
              key={m.memberId || idx}
              className="bg-slate-50/80 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800 rounded-2xl p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                      isDue
                        ? "bg-rose-500"
                        : isRefund
                        ? "bg-indigo-600"
                        : "bg-slate-500"
                    }`}
                  >
                    {avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-neutral-100 block truncate leading-tight">
                      {m.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 block truncate mt-0.5">
                      {t("messDashboard.mealsCount", {
                        count: num(m.mealsCount, { maximumFractionDigits: 1 }),
                      })}{" "}
                      •{" "}
                      {t("messDashboard.deposit", {
                        amount: money(m.totalDeposited, { decimals: 0 }),
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isRefund ? (
                    <span className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full inline-block">
                      {t("messDashboard.refundBadge", {
                        amount: money(m.balance, { decimals: 0 }),
                      })}
                    </span>
                  ) : isDue ? (
                    <span className="bg-rose-50 dark:bg-rose-950/70 border border-rose-200/50 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-bold px-2 py-0.5 rounded-full inline-block">
                      {t("messDashboard.dueBadge", {
                        amount: money(Math.abs(m.balance), { decimals: 0 }),
                      })}
                    </span>
                  ) : (
                    <span className="bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-xs font-semibold px-2 py-0.5 rounded-full inline-block">
                      {t("messDashboard.evenBadge")}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 block mt-0.5 font-medium">
                    {t("messDashboard.cost", {
                      amount: money(m.totalCost, { decimals: 0 }),
                    })}
                  </span>
                </div>
              </div>

              {/* Inline Action for Due Members */}
              {isDue && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/40 dark:border-neutral-700/40 text-xs">
                  <span className="text-[11px] text-rose-500 font-medium">
                    {t("dues.youOwe")}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppReminder(m)}
                    className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 active:scale-95 px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shadow-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-all select-none"
                  >
                    <Send size={12} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{t("messDashboard.whatsappTagada")}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* View All Members Navigation Button */}
      <button
        type="button"
        onClick={() => {
          haptic("selection");
          onViewAllMembers();
        }}
        className="w-full py-2.5 bg-slate-50 dark:bg-neutral-800/80 hover:bg-slate-100 dark:hover:bg-neutral-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-colors active:scale-98 select-none"
      >
        <span>
          {t("messDashboard.viewAllMembers", { count: num(members.length) })}
        </span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
