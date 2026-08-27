import React, { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { haptic } from "../../native/bridge";

/**
 * Native pull-to-refresh.
 *
 * The shell disables the WebView's own overscroll refresh (it reloads the whole
 * page, which would blow away in-memory state and the offline queue). This puts
 * the gesture back under app control: the same rubber-band feel, but it calls
 * `onRefresh` and re-fetches instead of reloading.
 */

const TRIGGER = 72; // px of pull before the gesture arms
const MAX_PULL = 120; // px — resistance ceiling
const RESISTANCE = 0.5;

interface Props {
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
  /** Off on desktop by default; there is no gesture to honour there. */
  disabled?: boolean;
}

const PullToRefresh = ({ onRefresh, children, disabled = false }: Props) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const armed = useRef(false);
  const startY = useRef(0);
  const tracking = useRef(false);

  useEffect(() => {
    if (disabled) return;

    const onStart = (e: TouchEvent) => {
      // Only from a genuine top-of-page rest position, and never while a
      // sheet has locked the body.
      if (window.scrollY > 0 || refreshing) return;
      if (document.body.classList.contains("sheet-open")) return;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        tracking.current = false;
        return;
      }
      // Damped so the sheet resists the further it is pulled.
      const damped = Math.min(MAX_PULL, dy * RESISTANCE);
      setPull(damped);

      if (damped >= TRIGGER && !armed.current) {
        armed.current = true;
        haptic("selection");
      } else if (damped < TRIGGER) {
        armed.current = false;
      }
    };

    const onEnd = async () => {
      if (!tracking.current) return;
      tracking.current = false;
      const shouldRefresh = armed.current;
      armed.current = false;

      if (!shouldRefresh) {
        setPull(0);
        return;
      }

      setPull(TRIGGER);
      setRefreshing(true);
      haptic("medium");
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [disabled, onRefresh, refreshing]);

  const active = pull > 0 || refreshing;
  const progress = Math.min(1, pull / TRIGGER);

  return (
    <>
      {/* Indicator rides above the content, pinned under the header. */}
      <div
        className="lg:hidden fixed left-0 right-0 z-[45] flex justify-center pointer-events-none"
        style={{
          top: `calc(var(--safe-top) + var(--header-h))`,
          opacity: active ? 1 : 0,
          transform: `translateY(${active ? Math.max(8, pull - 24) : -8}px)`,
          transition: pull === 0 ? "all var(--dur-base) var(--ease-decelerate)" : "none",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: "var(--bg-elevated)",
            boxShadow: "var(--shadow-elevated)",
            border: "1px solid var(--border-light)",
          }}
        >
          <RefreshCw
            size={16}
            style={{
              color: "var(--brand)",
              transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
              opacity: 0.4 + progress * 0.6,
              animation: refreshing ? "spin-native 800ms linear infinite" : undefined,
            }}
          />
        </div>
      </div>

      <div
        style={{
          transform: pull ? `translateY(${pull * 0.6}px)` : undefined,
          transition: pull === 0 ? "transform var(--dur-slow) var(--ease-spring)" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
};

export default PullToRefresh;
