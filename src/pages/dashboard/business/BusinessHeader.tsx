import React from "react";
import { RefreshCw } from "lucide-react";
import type { IBusiness } from "../../../services/business.service";
import { haptic } from "../../../native/bridge";

export type DatePeriod = "today" | "7days" | "30days";

interface BusinessHeaderProps {
  business: IBusiness;
  selectedPeriod: DatePeriod;
  onSelectPeriod: (period: DatePeriod) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

import { useTranslation } from "../../../i18n/useTranslation";

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  business,
  selectedPeriod,
  onSelectPeriod,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const branchName = business.address || business.phone;

  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
      {/* Live Sync Status Pill */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          {t("bizDashboard.liveCalculation")}
        </span>
        {branchName && (
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium truncate hidden sm:inline">
            {branchName}
          </span>
        )}
      </div>

      {/* Date Filter Segment & Refresh Action */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="flex items-center bg-slate-100 dark:bg-neutral-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-neutral-700/60 shrink-0"
          role="tablist"
        >
          {(
            [
              { key: "today", label: t("personalDashboard.today") },
              { key: "7days", label: t("personalDashboard.days7") },
              { key: "30days", label: t("personalDashboard.days30") },
            ] as const
          ).map(({ key, label }) => {
            const active = selectedPeriod === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  haptic("selection");
                  onSelectPeriod(key);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all select-none active:scale-95 ${
                  active
                    ? "bg-white dark:bg-neutral-900 text-slate-900 dark:text-neutral-100 shadow-xs"
                    : "text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            haptic("light");
            onRefresh();
          }}
          className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 active:scale-95 transition-all select-none shadow-xs"
          aria-label="Refresh data"
          title="Refresh"
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""}
          />
        </button>
      </div>
    </div>
  );
};

export default BusinessHeader;
