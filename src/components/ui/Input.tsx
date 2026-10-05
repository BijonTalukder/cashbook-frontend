import React, { forwardRef, useId, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { haptic } from "../../native/bridge";

export interface NativeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label displayed above the input */
  label?: string;
  /** Floating label style (inside input container) */
  floating?: boolean;
  /** Subtext or instructions displayed below the input */
  helperText?: string;
  /** Error message. When present, toggles error styling and aria-invalid */
  error?: string;
  /** Success message or indicator */
  success?: string;
  /** Leading icon or adornment (e.g. currency symbol, search icon) */
  leadingIcon?: React.ReactNode;
  /** Trailing icon or adornment */
  trailingIcon?: React.ReactNode;
  /** Shows a quick clear button when input has value */
  clearable?: boolean;
  /** Callback fired when clear button is pressed */
  onClear?: () => void;
  /** Container CSS classes */
  containerClassName?: string;
  /** Explicit touch size: 'md' (48px standard M3) or 'lg' (54px prominent) */
  touchSize?: "md" | "lg";
}

/**
 * NativeInput — Mobile-first, Material 3 compliant touch input.
 *
 * Ergonomics & Android WebView Specs:
 * - Touch target: min 48px to 54px thumb height.
 * - Auto-zoom prevention: enforces >= 16px font-size on touch screens.
 * - Virtual keyboard hygiene: supports inputMode, enterKeyHint, and scroll-margin-bottom.
 * - Focus rings: replaces default browser blue outlines with subtle ambient ring tokens.
 * - Haptic integration: triggers light haptics on clear button tap.
 */
export const NativeInput = forwardRef<HTMLInputElement, NativeInputProps>(
  (
    {
      label,
      floating = false,
      helperText,
      error,
      success,
      leadingIcon,
      trailingIcon,
      clearable = false,
      onClear,
      touchSize = "md",
      type = "text",
      inputMode,
      enterKeyHint,
      id: customId,
      required,
      disabled,
      readOnly,
      className,
      containerClassName,
      value,
      defaultValue,
      onChange,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || `native-input-${generatedId}`;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [innerValue, setInnerValue] = useState(value ?? defaultValue ?? "");

    // Determine effective type for password toggle
    const effectiveType =
      type === "password" ? (isPasswordVisible ? "text" : "password") : type;

    // Infer best inputMode if not explicitly provided
    const resolvedInputMode =
      inputMode ||
      (type === "number"
        ? "decimal"
        : type === "tel"
          ? "tel"
          : type === "email"
            ? "email"
            : undefined);

    const hasValue =
      value !== undefined
        ? String(value).length > 0
        : String(innerValue).length > 0;

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      haptic("light");
      setInnerValue("");
      if (onClear) {
        onClear();
      }
      if (onChange) {
        const syntheticEvent = {
          target: { value: "" },
          currentTarget: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInnerValue(e.target.value);
      onChange?.(e);
    };

    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;

    // Height profiles strictly adhering to thumb targets (>= 48px)
    const heightClass = touchSize === "lg" ? "h-[54px]" : "h-[48px]";

    return (
      <div
        className={cn(
          "w-full flex flex-col gap-1.5",
          disabled && "opacity-60 pointer-events-none",
          containerClassName
        )}
      >
        {/* Standard top label */}
        {label && !floating && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 select-none flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        )}

        {/* Input Wrapper with Border, Focus, and Elevation state */}
        <div
          className={cn(
            "relative w-full rounded-xl transition-all duration-150 ease-out",
            "flex items-center bg-white dark:bg-neutral-900",
            "border shadow-xs",
            heightClass,
            // Border state
            hasError
              ? "border-red-500/90 dark:border-red-500"
              : hasSuccess
                ? "border-emerald-500/90 dark:border-emerald-500"
                : isFocused
                  ? "border-emerald-500 dark:border-emerald-400"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700",
            // Focus ring (soft ambient glow, zero default blue outlines)
            isFocused &&
            (hasError
              ? "ring-3 ring-red-500/15"
              : hasSuccess
                ? "ring-3 ring-emerald-500/15"
                : "ring-3 ring-emerald-500/15")
          )}
        >
          {/* Leading Icon slot */}
          {leadingIcon && (
            <div className="pl-3.5 pr-1.5 flex items-center justify-center text-neutral-400 dark:text-neutral-500 select-none shrink-0">
              {leadingIcon}
            </div>
          )}

          {/* Floating Label overlay */}
          {label && floating && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-3.5 transition-all duration-150 pointer-events-none select-none",
                leadingIcon && "left-10",
                isFocused || hasValue
                  ? "top-1.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  : "top-1/2 -translate-y-1/2 text-[15px] text-neutral-400 dark:text-neutral-500"
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}

          {/* Actual Input Element */}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            inputMode={resolvedInputMode}
            enterKeyHint={enterKeyHint}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              rest.onBlur?.(e);
            }}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "w-full h-full bg-transparent px-3.5 text-neutral-900 dark:text-neutral-100",
              // Prevent virtual keyboard auto-zoom by enforcing >= 16px text
              "text-[16px] font-normal leading-normal",
              "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
              "focus:outline-none select-text",
              // Keyboard shift breathing room
              "scroll-mb-24",
              floating && (isFocused || hasValue) && "pt-3.5 pb-1",
              leadingIcon && "pl-1.5",
              (trailingIcon || clearable || type === "password") && "pr-1.5",
              className
            )}
            {...rest}
          />

          {/* Clear button */}
          {clearable && hasValue && !disabled && !readOnly && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1.5 mr-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg active:scale-95 transition-transform"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Password toggle button */}
          {type === "password" && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                haptic("selection");
                setIsPasswordVisible((prev) => !prev);
              }}
              className="p-1.5 mr-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg active:scale-95 transition-transform"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Trailing Icon or status indicator */}
          {hasError ? (
            <div className="pr-3 text-red-500 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : hasSuccess ? (
            <div className="pr-3 text-emerald-500 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : trailingIcon ? (
            <div className="pr-3 text-neutral-400 dark:text-neutral-500 shrink-0 select-none">
              {trailingIcon}
            </div>
          ) : null}
        </div>

        {/* Inline Helper / Error Message */}
        {hasError ? (
          <p
            id={errorId}
            className="text-[12px] font-medium text-red-500 flex items-center gap-1 select-none animate-fadeIn"
          >
            {error}
          </p>
        ) : success ? (
          <p
            className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 select-none"
          >
            {success}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="text-[12px] text-neutral-500 dark:text-neutral-400 select-none"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

NativeInput.displayName = "NativeInput";
export const Input = NativeInput;
export default NativeInput;

