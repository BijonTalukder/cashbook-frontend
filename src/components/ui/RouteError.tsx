import { useRouteError, useNavigate, isRouteErrorResponse } from "react-router-dom";
import { RotateCcw, Home, TriangleAlert } from "lucide-react";
import { useTranslation } from "../../i18n/useTranslation";
import { haptic } from "../../native/bridge";

/**
 * What the user sees when a screen throws.
 *
 * Without an `errorElement`, react-router renders its own developer screen — a
 * raw stack trace on a white page. Inside a WebView that reads as the app
 * having crashed, with no way out but killing it from the recents list. This
 * gives the same two escapes a native app would: retry, or go home.
 *
 * The underlying message is only surfaced in dev; users get a stable,
 * translated line instead of a minified `Cannot read properties of undefined`.
 */
const RouteError = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error ?? "");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4"
      style={{
        background: "var(--bg)",
        paddingTop: "calc(1.5rem + var(--safe-top))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom))",
      }}
    >
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: "rgba(239,68,68,0.12)" }}
      >
        <TriangleAlert size={28} style={{ color: "#ef4444" }} />
      </div>

      <div className="space-y-1.5">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "'DM Serif Display', serif", color: "var(--text-primary)" }}
        >
          {t("error.title")}
        </h1>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--text-muted)" }}>
          {t("error.body")}
        </p>
      </div>

      {import.meta.env.DEV && detail && (
        <pre
          className="selectable text-[11px] text-left w-full max-w-sm p-3 rounded-xl overflow-x-auto"
          style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}
        >
          {detail}
        </pre>
      )}

      <div className="flex gap-2.5 w-full max-w-xs pt-2">
        <button
          onClick={() => { haptic("medium"); navigate("/dashboard", { replace: true }); }}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-semibold press"
          style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
        >
          <Home size={16} /> {t("error.goHome")}
        </button>
        <button
          onClick={() => { haptic("medium"); window.location.reload(); }}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-semibold press"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
        >
          <RotateCcw size={16} /> {t("error.retry")}
        </button>
      </div>
    </div>
  );
};

export default RouteError;
