import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { haptic } from "../../native/bridge";
import { useBackHandler, useBodyScrollLock } from "../../native/hooks";

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface NativeSelectDrawerProps<T = string | number> {
  /** Array of options to select from */
  options: SelectOption<T>[];
  /** Currently selected value */
  value?: T;
  /** Selection callback */
  onChange: (value: T) => void;
  /** Trigger button placeholder */
  placeholder?: string;
  /** Accessible label displayed above trigger */
  label?: string;
  /** Modal sheet title */
  sheetTitle?: string;
  /** Modal sheet subtitle or prompt */
  sheetSubtitle?: string;
  /** Error message */
  error?: string;
  /** Helper instruction text */
  helperText?: string;
  /** Disables the field */
  disabled?: boolean;
  /** Marks as required */
  required?: boolean;
  /** Enables instant search filter inside the bottom sheet */
  searchable?: boolean;
  /** Placeholder text for search bar */
  searchPlaceholder?: string;
  /** Custom trigger class */
  className?: string;
  /** Container class */
  containerClassName?: string;
  /** Leading icon for the trigger button */
  leadingIcon?: React.ReactNode;
}

const DISMISS_DISTANCE = 90;
const DISMISS_VELOCITY = 0.5;

/**
 * NativeSelectDrawer — Android-native Bottom Sheet replacement for desktop <select>.
 *
 * Mobile Ergonomics:
 * - Replaces unstyled OS wheel/dialog with an elevated sliding bottom sheet.
 * - 48px to 52px thumb target on trigger and every list row.
 * - Integrated gesture drag-to-dismiss handle.
 * - Hardware back-button / gesture navigation interceptor via `useBackHandler`.
 * - Optional instant search filter with auto-clear for long lists.
 * - Haptic feedback on drawer open, drag threshold, and item selection.
 */
export function NativeSelectDrawer<T extends string | number = string | number>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  sheetTitle,
  sheetSubtitle,
  error,
  helperText,
  disabled = false,
  required = false,
  searchable,
  searchPlaceholder = "Search...",
  className,
  containerClassName,
  leadingIcon,
}: NativeSelectDrawerProps<T>) {
  const generatedId = useId();
  const triggerId = `select-trigger-${generatedId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragY, setDragY] = useState(0);

  const sheetRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dragInfo = useRef({ active: false, startY: 0, startT: 0 });
  const thresholdReached = useRef(false);

  // Selected option lookup
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Auto-enable search if option count > 7 unless explicitly configured
  const shouldEnableSearch =
    searchable !== undefined ? searchable : options.length > 7;

  // Filtered list
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  // Close with slide-down animation
  const closeDrawer = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    haptic("light");
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setDragY(0);
      setSearchQuery("");
    }, 200);
  }, [isClosing]);

  const openDrawer = () => {
    if (disabled) return;
    haptic("selection");
    setIsOpen(true);
    setIsClosing(false);
    setDragY(0);
  };

  // Wire up back button handler (hardware back consumes drawer close)
  useBackHandler(isOpen, closeDrawer);

  // Lock body scroll while open
  useBodyScrollLock(isOpen);

  // Focus search input after drawer slides up
  useEffect(() => {
    if (isOpen && shouldEnableSearch) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldEnableSearch]);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((listRef.current?.scrollTop ?? 0) > 0) return;
    thresholdReached.current = false;
    dragInfo.current = {
      active: true,
      startY: e.touches[0].clientY,
      startT: e.timeStamp,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragInfo.current.active) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragInfo.current.startY;

    if (deltaY > 0) {
      setDragY(deltaY);
      if (deltaY >= DISMISS_DISTANCE && !thresholdReached.current) {
        thresholdReached.current = true;
        haptic("selection");
      } else if (deltaY < DISMISS_DISTANCE && thresholdReached.current) {
        thresholdReached.current = false;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragInfo.current.active) return;
    const deltaY = dragY;
    const deltaTime = Math.max(1, e.timeStamp - dragInfo.current.startT);
    const velocity = deltaY / deltaTime;

    dragInfo.current.active = false;

    if (deltaY > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
      closeDrawer();
    } else {
      setDragY(0);
    }
  };

  const handleSelectOption = (optValue: T) => {
    haptic("selection");
    onChange(optValue);
    closeDrawer();
  };

  const hasError = Boolean(error);

  return (
    <div className={cn("w-full flex flex-col gap-1.5", containerClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={triggerId}
          className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        onClick={openDrawer}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "w-full h-[48px] px-3.5 rounded-xl border flex items-center justify-between text-left",
          "bg-white dark:bg-neutral-900 shadow-xs transition-all duration-100 ease-out select-none",
          "active:scale-[0.985] active:bg-neutral-50 dark:active:bg-neutral-800/60",
          hasError
            ? "border-red-500 dark:border-red-500 ring-2 ring-red-500/15"
            : isOpen
              ? "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/15"
              : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700",
          disabled && "opacity-55 pointer-events-none",
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {leadingIcon && (
            <span className="text-neutral-400 dark:text-neutral-500 shrink-0">
              {leadingIcon}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span
            className={cn(
              "text-[16px] truncate",
              selectedOption
                ? "text-neutral-900 dark:text-neutral-100 font-normal"
                : "text-neutral-400 dark:text-neutral-500"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-emerald-500"
          )}
        />
      </button>

      {/* Inline Helper / Error */}
      {hasError ? (
        <p className="text-[12px] font-medium text-red-500 select-none">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 select-none">
          {helperText}
        </p>
      ) : null}

      {/* Bottom Sheet Modal via Portal */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-end justify-center select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop Scrim */}
            <div
              onClick={closeDrawer}
              className={cn(
                "absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 ease-out",
                isClosing ? "opacity-0" : "opacity-100"
              )}
              style={{
                opacity: dragY > 0 ? Math.max(0, 1 - dragY / 300) : undefined,
              }}
            />

            {/* Sliding Bottom Sheet Container */}
            <div
              ref={sheetRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `translateY(${isClosing ? "100%" : `${dragY}px`})`,
                transition:
                  dragInfo.current.active
                    ? "none"
                    : "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
              }}
              className={cn(
                "relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[28px]",
                "border-t border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col",
                "max-h-[85vh] overflow-hidden",
                "pb-[max(1rem,env(safe-area-inset-bottom))]"
              )}
            >
              {/* Drag Handle Indicator */}
              <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>

              {/* Sheet Header */}
              <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80">
                <div className="min-w-0 pr-3">
                  <h3 className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {sheetTitle || label || placeholder}
                  </h3>
                  {sheetSubtitle && (
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {sheetSubtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 active:bg-neutral-100 dark:active:bg-neutral-800"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Instant Search Bar */}
              {shouldEnableSearch && (
                <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="relative flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 h-10">
                    <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      inputMode="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full bg-transparent text-[16px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          haptic("light");
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Options List (min-h-[52px] per row for thumb accessibility) */}
              <div
                ref={listRef}
                className="overflow-y-auto overscroll-contain py-1 max-h-[50vh] divide-y divide-neutral-100/60 dark:divide-neutral-800/40"
              >
                {filteredOptions.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <p className="text-[14px] text-neutral-400">
                      No matching options found
                    </p>
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => handleSelectOption(opt.value)}
                        className={cn(
                          "w-full min-h-[52px] px-5 py-3.5 flex items-center justify-between text-left",
                          "transition-colors duration-100 ease-out",
                          "active:bg-neutral-100 dark:active:bg-neutral-800/80",
                          isSelected
                            ? "bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-medium"
                            : "text-neutral-800 dark:text-neutral-200"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          {opt.icon && (
                            <span className="shrink-0 text-neutral-500 dark:text-neutral-400">
                              {opt.icon}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] truncate">
                                {opt.label}
                              </span>
                              {opt.badge && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            {opt.description && (
                              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {opt.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default NativeSelectDrawer;
