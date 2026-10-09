import { useState, useEffect } from "react";

export const DESKTOP_BREAKPOINT = 768;
export const DESKTOP_MEDIA_QUERY = `(min-width: ${DESKTOP_BREAKPOINT}px)`;

/**
 * Returns true if the viewport width is >= 768px (Desktop / Web interface),
 * and false if the viewport width is <= 767px (Mobile interface).
 *
 * Reliably handles initial viewport, window resizes, and orientation changes.
 */
export const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    setIsDesktop(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
};

/**
 * Returns true if the viewport width is <= 767px (Mobile interface).
 */
export const useIsMobile = (): boolean => {
  return !useIsDesktop();
};
