import React from "react";
import { cn } from "../../utils/cn";
import { haptic } from "../../native/bridge";

export interface NativeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enables touch press-state scaling and haptic tap feedback */
  clickable?: boolean;
  /** Visual surface variant: 'elevated' (soft shadow), 'outlined' (border only), 'filled' (surface-2 tint) */
  variant?: "elevated" | "outlined" | "filled";
  /** Optional custom padding override */
  noPadding?: boolean;
}

/**
 * NativeCard — Material Design 3 container surface for Android WebViews.
 *
 * Mobile Touch & Visual Polish:
 * - Subtle ambient elevation (shadow-xs/sm) avoiding harsh opaque drop shadows.
 * - Instant pressed state feedback (100ms micro-spring `scale-[0.985]`) mimicking native Android.
 * - Haptic tick on touch-down/click when clickable.
 * - Clear slot composition: Header, Title, Description, Body/Content, and Footer.
 */
export const NativeCard = ({
  clickable = false,
  variant = "elevated",
  noPadding = false,
  className,
  children,
  onClick,
  ...rest
}: NativeCardProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable) {
      haptic("light");
    }
    onClick?.(e);
  };

  const variantStyles = {
    elevated:
      "bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs dark:shadow-none",
    outlined:
      "bg-transparent border border-neutral-200 dark:border-neutral-800 shadow-none",
    filled:
      "bg-neutral-50 dark:bg-neutral-900/50 border border-transparent shadow-none",
  };

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleClick}
      className={cn(
        "relative rounded-2xl transition-all duration-100 ease-out overflow-hidden text-neutral-900 dark:text-neutral-100",
        variantStyles[variant],
        clickable && [
          "cursor-pointer select-none",
          "active:scale-[0.985] active:bg-neutral-50 dark:active:bg-neutral-800/60",
          "-webkit-tap-highlight-color-transparent",
        ],
        !noPadding && "p-4 sm:p-5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-start justify-between gap-3 mb-3 select-none",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-[16px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug",
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-normal",
      className
    )}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("text-sm text-neutral-700 dark:text-neutral-300", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between gap-2 pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400 select-none",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Compound component pattern attachment
NativeCard.Header = CardHeader;
NativeCard.Title = CardTitle;
NativeCard.Description = CardDescription;
NativeCard.Content = CardContent;
NativeCard.Footer = CardFooter;

export const Card = NativeCard;
export default NativeCard;

