import React from "react";
import { cn } from "../../utils/cn";
import { haptic } from "../../native/bridge";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

/**
 * SegmentedControl — Android/iOS native segmented tab control.
 * Replaces disconnected web button tabs with a unified tactile switch.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  const handleSelect = (val: T) => {
    if (val !== value) {
      haptic("selection");
      onChange(val);
    }
  };

  const heightClass = size === "sm" ? "h-9 p-0.5" : "h-11 p-1";
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      role="tablist"
      className={cn(
        "relative flex items-center bg-neutral-100 dark:bg-neutral-800/80 rounded-xl select-none",
        heightClass,
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "flex-1 h-full rounded-[10px] flex items-center justify-center gap-1.5 font-medium transition-all duration-150 ease-out select-none",
              textClass,
              isSelected
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 active:scale-[0.98]"
            )}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isSelected
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
