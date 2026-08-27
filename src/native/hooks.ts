import { useCallback, useEffect, useRef, useState } from "react";
import { haptic, pushBackHandler, type HapticType } from "./bridge";

/**
 * Registers a handler for the Android back gesture/button while `active`.
 * Handlers are LIFO, so the most recently opened sheet always wins.
 */
export const useBackHandler = (active: boolean, onBack: () => void): void => {
  // Held in a ref so a handler that closes over fresh state does not force the
  // subscription to tear down and re-register on every render.
  const cb = useRef(onBack);
  useEffect(() => {
    cb.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) return;
    return pushBackHandler(() => {
      cb.current();
      return true;
    });
  }, [active]);
};

/**
 * Locks background scrolling while an overlay is open, and restores the exact
 * scroll offset on close. Reference-counted so nested sheets don't fight.
 */
let lockCount = 0;
let savedScrollY = 0;

export const useBodyScrollLock = (locked: boolean): void => {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.classList.add("sheet-open");
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.classList.remove("sheet-open");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [locked]);
};

/** Stable haptic trigger for event handlers. */
export const useHaptic = () =>
  useCallback((type: HapticType = "light") => haptic(type), []);

/**
 * Attaches a Material-style ripple to a host element. The ink node is created
 * per press and removes itself, so there is nothing to clean up per render.
 */
export const useRipple = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ink = document.createElement("span");
      ink.className = "ripple-ink";
      ink.style.width = ink.style.height = `${size}px`;
      ink.style.left = `${e.clientX - rect.left - size / 2}px`;
      ink.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(ink);
      ink.addEventListener("animationend", () => ink.remove(), { once: true });
    };

    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  }, []);

  return ref;
};

/** Matches a media query reactively — used to branch sheet vs. dialog layout. */
export const useMediaQuery = (query: string): boolean => {
  const get = () =>
    typeof window !== "undefined" && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
};
