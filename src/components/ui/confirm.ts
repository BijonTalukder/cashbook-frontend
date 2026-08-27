import { haptic } from "../../native/bridge";

/**
 * Promise-based replacement for `window.confirm`.
 *
 * The browser dialog is the loudest "this is a web page" tell there is: it
 * shows the origin URL, ignores the app theme, and inside an Android WebView it
 * is either ugly or suppressed outright. `<ConfirmHost />` renders the same
 * decision as a themed bottom sheet; call sites stay straight-line code:
 *
 *   if (!(await confirmAction({ title: t("..."), danger: true }))) return;
 */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button — deletes and other irreversible actions. */
  danger?: boolean;
}

export type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

let emit: ((p: PendingConfirm | null) => void) | null = null;

/** Wired up by `<ConfirmHost />` on mount. */
export const registerConfirmHost = (
  fn: ((p: PendingConfirm | null) => void) | null,
) => {
  emit = fn;
};

export const confirmAction = (opts: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    if (!emit) {
      // Host not mounted (a test, or a call before first paint) — fail closed
      // rather than silently performing a destructive action.
      resolve(false);
      return;
    }
    haptic("warning");
    emit({ ...opts, resolve });
  });
