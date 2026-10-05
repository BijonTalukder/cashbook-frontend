import React from "react";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useFormat } from "../../../i18n/useFormat";

export interface IMealTrendPoint {
  dayLabelKey: string;
  count: number;
}

interface MealTrendsChartCardProps {
  trendData?: IMealTrendPoint[];
  avgPerDay?: number;
}

export const MealTrendsChartCard: React.FC<MealTrendsChartCardProps> = ({
  trendData = [
    { dayLabelKey: "daySat", count: 18 },
    { dayLabelKey: "daySun", count: 17.5 },
    { dayLabelKey: "dayMon", count: 19 },
    { dayLabelKey: "dayTue", count: 18.5 },
    { dayLabelKey: "dayWed", count: 20 },
    { dayLabelKey: "dayThu", count: 19 },
    { dayLabelKey: "dayFri", count: 22.5 },
  ],
  avgPerDay = 19.2,
}) => {
  const { t } = useTranslation();
  const { num } = useFormat();

  // Normalize counts to SVG heights (0 to 60)
  const maxVal = Math.max(...trendData.map((d) => d.count), 25);
  const minVal = Math.min(...trendData.map((d) => d.count), 10);
  const range = maxVal - minVal || 1;

  const points = trendData.map((d, index) => {
    const x = (index / (trendData.length - 1)) * 300 + 10;
    const y = 48 - ((d.count - minVal) / range) * 36;
    return { x, y, ...d };
  });

  // Build SVG path
  const pathD = points.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x},${curr.y}`;
    const prev = arr[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},58 L ${points[0].x},58 Z`;

  // Find peak point for pulse highlight
  const peakPoint = points.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), points[0]);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            {t("messDashboard.last7DaysTrends")}
          </h2>
        </div>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
          {t("messDashboard.avgPerDay", {
            avg: num(avgPerDay, { maximumFractionDigits: 1 }),
          })}
        </span>
      </div>

      {/* SVG Curve Sparkline */}
      <div className="pt-2">
        <svg
          className="w-full h-16 overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 320 60"
        >
          <defs>
            <linearGradient id="messMealGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill="url(#messMealGradient)" />

          {/* Smooth line */}
          <path
            d={pathD}
            fill="none"
            stroke="#4f46e5"
            strokeLinecap="round"
            strokeWidth="2.5"
          />

          {/* Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={p === peakPoint ? 4.5 : 2.5}
              fill="#4f46e5"
              className={p === peakPoint ? "animate-pulse" : ""}
            />
          ))}
        </svg>

        {/* Day Labels Axis */}
        <div className="flex justify-between text-slate-400 dark:text-neutral-500 text-[10px] font-medium mt-1 select-none px-1">
          {trendData.map((d, i) => (
            <span
              key={i}
              className={i === trendData.length - 1 ? "font-bold text-indigo-600 dark:text-indigo-400" : ""}
            >
              {t(`messDashboard.${d.dayLabelKey}`)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
