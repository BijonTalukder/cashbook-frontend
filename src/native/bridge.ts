/**
 * Bridge to the Android WebView wrapper.
 *
 * The app ships as a hosted PWA *and* as a Play Store WebView build, so every
 * call here degrades to a web equivalent (or a no-op) when the native side is
 * absent. Nothing in the UI may assume the bridge exists.
 *
 * Native → web contract lives on `window.__hisab` (see `installNativeHooks`);
 * web → native lives on `window.AndroidBridge`, injected by the wrapper with
 * `addJavascriptInterface(new WebAppInterface(), "AndroidBridge")`.
 */

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "success"
  | "warning"
  | "error";

interface AndroidBridgeApi {
  haptic?: (type: string) => void;
  setStatusBarColor?: (color: string, darkIcons: boolean) => void;
  setNavBarColor?: (color: string, darkIcons: boolean) => void;
  share?: (title: string, text: string, url: string) => void;
  toast?: (message: string) => void;
  exitApp?: () => void;
  openExternal?: (url: string) => void;
  getInsets?: () => string;
  setKeepAwake?: (on: boolean) => void;
  appVersion?: () => string;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeApi;
    __hisab?: {
      onBackPressed: () => boolean;
      applyInsets: (top: number, right: number, bottom: number, left: number) => void;
      onNetworkChange: (online: boolean) => void;
      onResume: () => void;
      version: string;
    };
  }
}

const android = (): AndroidBridgeApi | undefined =>
  typeof window !== "undefined" ? window.AndroidBridge : undefined;

/** True inside the Play Store wrapper. Drives native-only affordances. */
export const isNativeApp = (): boolean =>
  !!android() ||
  (typeof navigator !== "undefined" && /HisabBoiApp/i.test(navigator.userAgent));

/** True when running as an installed PWA or the native shell — i.e. no browser chrome. */
export const isStandalone = (): boolean =>
  isNativeApp() ||
  (typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari's non-standard flag
      (navigator as unknown as { standalone?: boolean }).standalone === true));

/* ── Haptics ──────────────────────────────────────────────
   Falls back to the Vibration API, which Android WebView supports.
   Durations mirror Android's HapticFeedbackConstants feel. */
const VIBRATE_MS: Record<HapticType, number | number[]> = {
  light: 8,
  medium: 16,
  heavy: 28,
  selection: 6,
  success: [0, 14, 60, 14],
  warning: [0, 20, 70, 20],
  error: [0, 30, 80, 30, 80, 30],
};

export const haptic = (type: HapticType = "light"): void => {
  const bridge = android();
  if (bridge?.haptic) {
    try {
      bridge.haptic(type);
      return;
    } catch {
      /* fall through to the web path */
    }
  }
  try {
    navigator.vibrate?.(VIBRATE_MS[type]);
  } catch {
    /* vibration unsupported or blocked — silent by design */
  }
};

/* ── System bars ──────────────────────────────────────────
   Keeps the status/navigation bars in step with the in-app theme so the
   app never shows a mismatched strip at the top on theme switch. */
export const setSystemBars = (background: string, isDark: boolean): void => {
  const bridge = android();
  try {
    bridge?.setStatusBarColor?.(background, !isDark);
    bridge?.setNavBarColor?.(background, !isDark);
  } catch {
    /* older wrapper build without these methods */
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", background);
};

/* ── Share ────────────────────────────────────────────────
   Prefers the real Android share sheet; `navigator.share` is unreliable
   inside a WebView unless the wrapper explicitly grants it. */
export const nativeShare = async (opts: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  const bridge = android();
  if (bridge?.share) {
    try {
      bridge.share(opts.title ?? "", opts.text ?? "", opts.url ?? "");
      return true;
    } catch {
      /* fall through */
    }
  }
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(opts);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

/** Android toast — used for transient confirmations that should survive a route change. */
export const nativeToast = (message: string): boolean => {
  const bridge = android();
  if (!bridge?.toast) return false;
  try {
    bridge.toast(message);
    return true;
  } catch {
    return false;
  }
};

/** Opens a URL in the system browser rather than hijacking the WebView. */
export const openExternal = (url: string): void => {
  const bridge = android();
  if (bridge?.openExternal) {
    try {
      bridge.openExternal(url);
      return;
    } catch {
      /* fall through */
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
};

/** Closes the app. Only meaningful natively; a no-op on the web. */
export const exitApp = (): void => {
  try {
    android()?.exitApp?.();
  } catch {
    /* no-op on web */
  }
};

/* ── Back-button stack ────────────────────────────────────
   Android's hardware/gesture back must dismiss the topmost transient UI
   (sheet, drawer, dropdown) before it navigates — otherwise the app feels
   like a web page. Handlers register LIFO; the first one to return true
   consumes the press. */
type BackHandler = () => boolean;
const backHandlers: BackHandler[] = [];

export const pushBackHandler = (fn: BackHandler): (() => void) => {
  backHandlers.push(fn);
  return () => {
    const i = backHandlers.indexOf(fn);
    if (i !== -1) backHandlers.splice(i, 1);
  };
};

/** Runs the stack top-down. Returns true when a handler consumed the press. */
export const runBackHandlers = (): boolean => {
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    try {
      if (backHandlers[i]()) return true;
    } catch {
      /* a throwing handler must not trap the user in the app */
    }
  }
  return false;
};

/* ── Insets ───────────────────────────────────────────────
   Android 15 forces edge-to-edge for targetSdk 35, so `env(safe-area-inset-*)`
   is not always populated inside a WebView. The wrapper measures the real
   WindowInsets and pushes them here in CSS pixels. */
export const applyInsets = (
  top: number,
  right: number,
  bottom: number,
  left: number,
): void => {
  const root = document.documentElement.style;
  root.setProperty("--safe-top", `${Math.max(0, top)}px`);
  root.setProperty("--safe-right", `${Math.max(0, right)}px`);
  root.setProperty("--safe-bottom", `${Math.max(0, bottom)}px`);
  root.setProperty("--safe-left", `${Math.max(0, left)}px`);
};

/**
 * Installs the native → web entry points. Call once, as early as possible,
 * so the wrapper never fires into an undefined object during cold start.
 */
export const installNativeHooks = (opts: {
  onNetworkChange?: (online: boolean) => void;
  onResume?: () => void;
}): void => {
  if (typeof window === "undefined") return;

  window.__hisab = {
    onBackPressed: () => runBackHandlers(),
    applyInsets,
    onNetworkChange: (online: boolean) => opts.onNetworkChange?.(online),
    onResume: () => opts.onResume?.(),
    version: "1",
  };

  if (isNativeApp()) {
    document.documentElement.setAttribute("data-native", "true");
    // Pull insets synchronously too: the wrapper's push can land after
    // first paint on slow devices, which would flash an unpadded header.
    try {
      const raw = android()?.getInsets?.();
      if (raw) {
        const i = JSON.parse(raw) as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        };
        applyInsets(i.top, i.right, i.bottom, i.left);
      }
    } catch {
      /* keep the env() fallback */
    }
  }
};
