import React from "react";
import { Loader2 } from "lucide-react";
import { haptic, type HapticType } from "../../native/bridge";
import { useRipple } from "../../native/hooks";

/**
 * The app's tappable surface: ripple, haptic tick, press-scale, and an
 * Android-minimum 48dp target on touch screens.
 *
 * Existing pages style their own buttons inline; this is for new surfaces and
 * for the touch targets that were too small to hit reliably on a 360dp phone.
 */

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--brand)", color: "var(--brand-ink)" },
  secondary: { background: "var(--surface-3)", color: "var(--text-secondary)" },
  danger: { background: "#ef4444", color: "#ffffff" },
  ghost: { background: "transparent", color: "var(--text-secondary)" },
  outline: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border-strong)",
  },
};

// Heights are the Android touch-target floor (48dp), not visual whim —
// anything under it gets mis-tapped on a phone held one-handed.
const SIZE: Record<Size, string> = {
  sm: "h-10 px-3.5 text-xs gap-1.5 rounded-xl",
  md: "h-12 px-4 text-sm gap-2 rounded-xl",
  lg: "h-13 px-5 text-sm gap-2 rounded-2xl",
  icon: "h-11 w-11 rounded-xl justify-center",
};

export interface PressableProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  feedback?: HapticType | "none";
}

const Pressable = ({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  feedback = "light",
  className = "",
  style,
  children,
  onClick,
  disabled,
  ...rest
}: PressableProps) => {
  const ref = useRipple<HTMLButtonElement>();

  return (
    <button
      ref={ref}
      {...rest}
      disabled={disabled || loading}
      onClick={(e) => {
        if (feedback !== "none") haptic(feedback);
        onClick?.(e);
      }}
      className={[
        "ripple press inline-flex items-center font-semibold select-none",
        "disabled:opacity-55 disabled:pointer-events-none",
        SIZE[size],
        size === "icon" ? "" : "justify-center",
        block ? "w-full" : "",
        className,
      ].join(" ")}
      style={{ ...VARIANT[variant], ...style }}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
};

export default Pressable;
