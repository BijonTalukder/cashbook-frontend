import React from "react";
import { Store, RefreshCw, Bell } from "lucide-react";
import type { IBusiness } from "../../../services/business.service";
import { useTranslation } from "../../../i18n/useTranslation";
import { haptic } from "../../../native/bridge";

export type DatePeriod = "today" | "7days" | "30days";

interface BusinessHeaderProps {
  business: IBusiness;
  selectedPeriod: DatePeriod;
  onSelectPeriod: (period: DatePeriod) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  business,
  selectedPeriod,
  onSelectPeriod,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();

  const branchName =
    business.address || business.phone || t("businessType.business");

  const businessTypeLabel =
    business.businessType || business.type || "Retail Shop";

  return (
    <div className="space-y-3">
      {/* Top Context & Business Brand Strip */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 p-3.5 sm:p-4 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
            <Store size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <h1 className="text-base font-bold text-slate-900 dark:text-neutral-100 truncate leading-tight">
                {business.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5 font-medium">
              {businessTypeLabel} • হিসাববই
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              haptic("light");
              onRefresh();
            }}
            className="w-9 h-9 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 flex items-center justify-center text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-700/80 active:scale-95 transition-all select-none shadow-xs"
            aria-label="Refresh data"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin text-blue-600" : ""}
            />
          </button>
        </div>
      </div>

      {/* Sub-Header: Branch & Live Sync + Date Segment */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-700 dark:text-neutral-300 font-semibold truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {branchName}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            লাইভ সিঙ্ক
          </span>
        </div>

        {/* Date Filter Segment */}
        <div
          className="flex items-center bg-slate-100 dark:bg-neutral-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-neutral-700/60 shrink-0"
          role="tablist"
        >
          {(
            [
              { key: "today", label: "আজ" },
              { key: "7days", label: "৭ দিন" },
              { key: "30days", label: "৩০ দিন" },
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
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all select-none ${
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
      </div>
    </div>
  );
};

export default BusinessHeader;
