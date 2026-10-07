import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { haptic } from "../../../native/bridge";

interface MessHeaderProps {
  businessName: string;
  activeMembersCount: number;
  selectedDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const MessHeader: React.FC<MessHeaderProps> = ({
  activeMembersCount,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onRefresh,
  refreshing = false,
}) => {
  const { t } = useTranslation();
  const { num, monthName } = useFormat();

  const formattedMonth = `${monthName(selectedDate.getMonth(), "long")} ${num(selectedDate.getFullYear())}`;

  return (
    <section className="space-y-2.5">
      {/* Month Selector & Active Members Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              haptic("selection");
              onPrevMonth();
            }}
            aria-label="Previous Month"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors active:scale-90"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-slate-800 dark:text-neutral-100 select-none">
              {formattedMonth}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic("selection");
              onNextMonth();
            }}
            aria-label="Next Month"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors active:scale-90"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800/90 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-200">
              {t("messDashboard.activeMembers", { count: num(activeMembersCount) })}
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={() => {
                haptic("light");
                onRefresh();
              }}
              disabled={refreshing}
              className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700 active:scale-95 transition-all select-none shadow-xs shrink-0"
              aria-label="Refresh"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}
              />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default MessHeader;
