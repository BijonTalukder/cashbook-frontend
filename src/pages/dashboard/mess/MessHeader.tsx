import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Home,
} from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";
import { haptic } from "../../../native/bridge";

interface MessHeaderProps {
  businessName: string;
  branchName?: string;
  managerName?: string;
  activeMembersCount: number;
  selectedDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const MessHeader: React.FC<MessHeaderProps> = ({
  businessName,
  branchName,
  managerName,
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
    <section className="space-y-3">
      {/* Top Mess Identity & Quick Refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <Home size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-neutral-100 truncate leading-tight">
                {businessName || t("messDashboard.defaultMessName")}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                {t("messDashboard.badge")}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
              {branchName || t("messDashboard.defaultBranch")}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={() => {
              haptic("light");
              onRefresh();
            }}
            disabled={refreshing}
            className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800/80 shadow-xs active:scale-95 transition-all select-none shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin text-indigo-600" : ""}
            />
          </button>
        )}
      </div>

      {/* Month Selector & Active Members Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-2 shadow-xs">
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

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800/90 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-neutral-200">
            {t("messDashboard.activeMembers", { count: num(activeMembersCount) })}
          </span>
        </div>
      </div>

      {/* Manager Metadata Row */}
      <div className="flex items-center justify-between px-1 text-slate-500 dark:text-neutral-400 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate">
            {t("messDashboard.manager")}:{" "}
            <span className="font-semibold text-slate-800 dark:text-neutral-200">
              {managerName || "Admin"}
            </span>
          </span>
        </div>
        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 px-2 py-0.5 rounded-full shrink-0">
          {branchName || t("messDashboard.defaultBranch")}
        </span>
      </div>
    </section>
  );
};
