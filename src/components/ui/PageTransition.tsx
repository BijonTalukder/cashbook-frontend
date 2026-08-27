import React, { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Screen-to-screen motion.
 *
 * Without it, route changes repaint instantly — correct for a website, wrong
 * for an app, where every screen change carries a direction. Forward pushes
 * slide in from the right; back pops slide in from the left, matching the
 * hardware-back and edge-swipe gestures the shell already supports.
 *
 * Keyed on the pathname alone, deliberately: keying on `location.key` would
 * also remount on `setSearchParams({ replace: true })`, which several pages use
 * to strip a deep-link flag right after mount — and that would throw away the
 * state the flag just set.
 */

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navType = useNavigationType(); // PUSH | POP | REPLACE

  // Every screen starts at its top, the way a pushed Activity does.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  const anim = navType === "POP" ? "anim-page-back" : "anim-page-forward";

  return (
    <div key={location.pathname} className={anim} style={{ minHeight: "100%" }}>
      {children}
    </div>
  );
};

export default PageTransition;
