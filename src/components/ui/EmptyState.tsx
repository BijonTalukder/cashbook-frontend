import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";
import { haptic } from "../../native/bridge";

export interface EmptyStateProps {
  /** Lucide icon to display */
  icon: LucideIcon;
  /** Primary title message */
  title: string;
  /** Secondary contextual explanation or call-to-action prompt */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Convenience shortcut for primary action */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Container custom classes */
  className?: string;
}

/**
 * EmptyState — Mobile-native contextual empty state container.
 * Replaces generic "No data" text with actionable, thumb-friendly guidance.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  secondaryAction,
  className,
}: EmptyStateProps) => {
  const primaryAction =
    action ||
    (actionLabel && onAction
      ? { label: actionLabel, onClick: onAction }
      : undefined);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-14 px-6 text-center select-none animate-fadeIn",
        className
      )}
    >
      {/* Icon circle surface */}
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-3.5 shadow-xs">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>

      {/* Title */}
      <h3 className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight max-w-xs">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5 w-full max-w-xs justify-center">
          {primaryAction && (
            <Button
              variant="primary"
              size="md"
              block
              onClick={() => {
                haptic("medium");
                primaryAction.onClick();
              }}
              className="gap-2"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              {primaryAction.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              variant="ghost"
              size="md"
              block
              onClick={() => {
                haptic("light");
                secondaryAction.onClick();
              }}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
