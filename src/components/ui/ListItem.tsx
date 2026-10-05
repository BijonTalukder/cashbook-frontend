import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { haptic } from "../../native/bridge";

export interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Leading icon or visual element */
  leading?: React.ReactNode;
  /** Primary label / title */
  title: React.ReactNode;
  /** Secondary subtitle or helper text */
  subtitle?: React.ReactNode;
  /** Optional metadata line below subtitle */
  meta?: React.ReactNode;
  /** Trailing content (e.g. monetary figure, status badge) */
  trailing?: React.ReactNode;
  /** Shows standard navigation chevron */
  chevron?: boolean;
  /** Enables touch active-press state and haptic click */
  clickable?: boolean;
  /** Shows subtle bottom hairline border */
  divider?: boolean;
}

/**
 * ListItem — Android/Material 3 compliant interactive list row.
 * Minimum 56px touch target height with instant micro-touch feedback.
 */
export const ListItem = ({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  chevron = false,
  clickable = false,
  divider = true,
  className,
  onClick,
  ...rest
}: ListItemProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable) {
      haptic("light");
    }
    onClick?.(e);
  };

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleClick}
      className={cn(
        "w-full min-h-[56px] px-4 py-3 flex items-center justify-between text-left select-none transition-colors duration-100 ease-out",
        clickable && [
          "cursor-pointer active:bg-neutral-100 dark:active:bg-neutral-800/70",
          "-webkit-tap-highlight-color-transparent",
        ],
        divider && "border-b border-neutral-100 dark:border-neutral-800/80 last:border-b-0",
        className
      )}
      {...rest}
    >
      {/* Leading & Content group */}
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        {leading && <div className="shrink-0 flex items-center">{leading}</div>}

        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100 leading-snug truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-normal truncate mt-0.5">
              {subtitle}
            </div>
          )}
          {meta && (
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-normal truncate mt-0.5">
              {meta}
            </div>
          )}
        </div>
      </div>

      {/* Trailing group */}
      <div className="flex items-center gap-2 shrink-0">
        {trailing && <div className="text-right">{trailing}</div>}
        {chevron && (
          <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
        )}
      </div>
    </div>
  );
};

export default ListItem;
