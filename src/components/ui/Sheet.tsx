import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBackHandler, useBodyScrollLock, useMediaQuery } from "../../native/hooks";
import { haptic } from "../../native/bridge";

/**
 * The app's one overlay primitive.
 *
 * Phones get a bottom sheet — grabbed by the handle, dragged down to dismiss,
 * springing off the bottom edge — because that is what an Android user expects
 * a form to do. Desktop gets a centered dialog. Same component, same props;
 * only the presentation differs, so pages never branch on viewport.
 *
 * Handles, in order: exit animation before unmount, background scroll lock,
 * hardware back, Escape, scrim tap, and safe-area padding for the gesture bar.
 */

const DISMISS_DISTANCE = 110; // px dragged before release closes the sheet
const DISMISS_VELOCITY = 0.55; // px/ms — a quick flick closes from anywhere
const EXIT_MS = 220;

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Small line under the title — context such as the record being edited. */
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned to the bottom, outside the scroll area — put the submit button here. */
  footer?: React.ReactNode;
  /** Desktop max width. Ignored on phones, where sheets are always full-bleed. */
  size?: "sm" | "md" | "lg";
  /** Hides the × so a required decision cannot be dismissed by accident. */
  hideClose?: boolean;
  /** Blocks scrim-tap and back-to-dismiss. Use for destructive confirmations. */
  dismissible?: boolean;
  /** Drops the default padding when the body renders its own full-bleed list. */
  bare?: boolean;
}

const MAX_W = { sm: "24rem", md: "28rem", lg: "36rem" };

const Sheet = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  hideClose = false,
  dismissible = true,
  bare = false,
}: SheetProps) => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, startY: 0, startT: 0, lastY: 0 });

  /* Keep the panel mounted through its exit animation. */
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      setDragY(0);
    } else if (mounted) {
      setClosing(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, EXIT_MS);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const requestClose = useCallback(() => {
    if (!dismissible) return;
    haptic("light");
    onClose();
  }, [dismissible, onClose]);

  useBodyScrollLock(mounted);
  useBackHandler(open, requestClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  /* ── Drag-to-dismiss ────────────────────────────────────
     Only from the grab area, and only while the body is scrolled to the
     top — otherwise a downward flick inside a long form would close the
     sheet instead of scrolling it. */
  const canDrag = () => !isDesktop && dismissible;

  const thresholdPassed = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canDrag()) return;
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return;
    thresholdPassed.current = false;
    drag.current = {
      active: true,
      startY: e.clientY,
      startT: e.timeStamp,
      lastY: e.clientY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dy = e.clientY - drag.current.startY;
    drag.current.lastY = e.clientY;
    if (dy >= DISMISS_DISTANCE && !thresholdPassed.current) {
      thresholdPassed.current = true;
      haptic("selection");
    } else if (dy < DISMISS_DISTANCE && thresholdPassed.current) {
      thresholdPassed.current = false;
    }
    // Resist upward drags instead of letting the sheet fly off the top.
    setDragY(dy > 0 ? dy : dy / 6);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dy = e.clientY - drag.current.startY;
    const dt = Math.max(1, e.timeStamp - drag.current.startT);
    drag.current.active = false;
    thresholdPassed.current = false;

    if (dy > DISMISS_DISTANCE || dy / dt > DISMISS_VELOCITY) {
      setDragY(0);
      requestClose();
    } else {
      setDragY(0);
    }
  };

  if (!mounted) return null;

  const dragging = drag.current.active;
  const scrimOpacity = dragY > 0 ? Math.max(0, 1 - dragY / 420) : 1;

  /* Portalled to <body> on purpose.
     `position: fixed` resolves against the nearest ancestor carrying a
     transform, filter or backdrop-filter — and the app bar has
     `backdrop-filter: blur(20px)`. A sheet opened from the app bar was
     anchoring to the 56px header instead of the viewport. */
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex lg:items-center lg:justify-center items-end"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      {/* Scrim */}
      <div
        className={`absolute inset-0 ${closing ? "anim-scrim-out" : "anim-scrim-in"}`}
        style={{
          background: "var(--overlay-scrim)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: scrimOpacity,
        }}
        onClick={requestClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          "relative w-full flex flex-col",
          "rounded-t-3xl lg:rounded-3xl",
          "lg:max-h-[85vh] max-h-[92dvh]",
          closing
            ? isDesktop
              ? "anim-dialog-out"
              : "anim-sheet-down"
            : isDesktop
              ? "anim-dialog-in"
              : "anim-sheet-up",
        ].join(" ")}
        style={{
          background: "var(--bg-elevated)",
          borderTop: "1px solid var(--border)",
          boxShadow: "var(--shadow-sheet)",
          maxWidth: isDesktop ? MAX_W[size] : undefined,
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging
            ? "none"
            : "transform var(--dur-base) var(--ease-decelerate)",
          willChange: "transform",
        }}
      >
        {/* Grab area — handle + header drag the sheet as one unit,
            the way Android's ModalBottomSheet behaves. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: canDrag() ? "none" : undefined }}
          className="flex-shrink-0"
        >
          <div className="lg:hidden flex justify-center pt-3 pb-1">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: "var(--border-strong)" }}
            />
          </div>

          {(title || !hideClose) && (
            <div
              className="flex items-start justify-between gap-3 px-5 pt-3 pb-3.5"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    className="text-base font-semibold truncate"
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      color: "var(--text-primary)",
                    }}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p
                    className="text-xs truncate mt-0.5"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              {!hideClose && (
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label="Close"
                  className="w-9 h-9 -mr-1 flex items-center justify-center rounded-full flex-shrink-0 press"
                  style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className={`scroll-y flex-1 min-h-0 ${bare ? "" : "px-5 py-4"}`}
        >
          {children}
        </div>

        {/* Footer — outside the scroller so the primary action is always reachable,
            padded past the gesture bar. */}
        {footer && (
          <div
            className="flex-shrink-0 px-5 pt-3"
            style={{
              borderTop: "1px solid var(--border-light)",
              background: "var(--bg-elevated)",
              paddingBottom: "calc(0.875rem + var(--safe-bottom))",
            }}
          >
            {footer}
          </div>
        )}

        {/* No footer: the body still needs to clear the gesture bar. */}
        {!footer && (
          <div style={{ height: "var(--safe-bottom)" }} className="lg:hidden flex-shrink-0" />
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Sheet;
