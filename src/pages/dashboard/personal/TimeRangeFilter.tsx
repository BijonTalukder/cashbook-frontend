import React from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { haptic } from "../../../native/bridge";

export type TimeRange = "today" | "7d" | "30d" | "month" | "year";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const tabs: { key: TimeRange; label: string }[] = [
    { key: "today", label: t("personalDashboard.today") },
    { key: "7d", label: t("personalDashboard.days7") },
    { key: "30d", label: t("personalDashboard.days30") },
    { key: "month", label: t("personalDashboard.thisMonth") },
    { key: "year", label: t("personalDashboard.year") },
  ];

  return (
    <div className="flex items-center justify-between p-1 bg-slate-200/60 dark:bg-neutral-800/80 backdrop-blur-md rounded-2xl text-center select-none">
      {tabs.map((tab) => {
        const isActive = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              if (!isActive) {
                haptic("selection");
                onChange(tab.key);
              }
            }}
            className={`flex-1 py-1.5 px-1 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive
                ? "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TimeRangeFilter;
