/**
 * Link sharing helpers.
 *
 * Invite emails can silently fail (SMTP down, rate-limited, spam-filtered), so
 * every shareable link also needs a manual path out of the app: clipboard,
 * WhatsApp, or the OS share sheet.
 */

/** Clipboard API needs a secure context — fall back to a hidden textarea. */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
};

/** Opens WhatsApp (app on mobile, web on desktop) with the message prefilled. */
export const shareViaWhatsApp = (message: string) => {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer",
  );
};

/** Opens the default mail client with the message prefilled. */
export const shareViaEmail = (subject: string, message: string) => {
  window.location.href = `mailto:?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(message)}`;
};

export const canShareNative = () => typeof navigator.share === "function";

/**
 * OS share sheet (mobile). Returns false when unavailable or cancelled, so the
 * caller can fall back to copying.
 */
export const shareNative = async (opts: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  if (!canShareNative()) return false;
  try {
    await navigator.share(opts);
    return true;
  } catch {
    // user cancelled — no-op
    return false;
  }
};
