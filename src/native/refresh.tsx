import React, { createContext, useContext, useEffect, useRef } from "react";

/**
 * Screen-level pull-to-refresh registration.
 *
 * The gesture belongs to the shell (one listener, one indicator, drawn under
 * the header), but only the screen knows how to reload itself. Each screen
 * registers its loader on mount; the shell calls whatever is registered when
 * the user completes the pull. Screens that register nothing simply do not
 * refresh — the gesture rubber-bands and settles, which is the correct
 * behaviour for a static page rather than a broken-looking spinner.
 */

type Handler = () => void | Promise<void>;

const RefreshContext = createContext<{
  register: (fn: Handler | null) => void;
  current: React.RefObject<Handler | null>;
} | null>(null);

export const RefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const current = useRef<Handler | null>(null);
  const register = (fn: Handler | null) => {
    current.current = fn;
  };
  return (
    <RefreshContext.Provider value={{ register, current }}>
      {children}
    </RefreshContext.Provider>
  );
};

/** Used by the shell to run whichever screen is on top. */
export const useRefreshRunner = () => {
  const ctx = useContext(RefreshContext);
  return async () => {
    await ctx?.current.current?.();
  };
};

/** Called by a screen to say "this is how you reload me". */
export const useRefreshHandler = (fn: Handler) => {
  const ctx = useContext(RefreshContext);
  const stable = useRef(fn);

  useEffect(() => {
    stable.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!ctx) return;
    ctx.register(() => stable.current());
    return () => ctx.register(null);
  }, [ctx]);
};
