import { CloudOff, RotateCcw, WifiOff } from "lucide-react";
import { useOfflineStore } from "../../store/offlineStore";
import { useTranslation } from "../../i18n/useTranslation";
import { haptic } from "../../native/bridge";

/**
 * Shown when a screen's fetch failed — instead of its "you have nothing yet"
 * empty state.
 *
 * This distinction matters more here than in most apps. Reports, expenses,
 * the ledger and dues are online-only by design (only the POS path is
 * mirrored to IndexedDB), so on a shop's dropped wifi those screens used to
 * render "No expenses yet · Rent, electricity, salary — track business costs
 * here". A shopkeeper reading that is being told their books are empty, which
 * is both false and alarming. Say we could not load it, and offer the retry.
 */
const LoadFailedState = ({ onRetry }: { onRetry?: () => void }) => {
  const { t } = useTranslation();
  const offline = useOfflineStore((s) => s.connectivity === "offline");
  const Icon = offline ? WifiOff : CloudOff;

  return (
    <div className="flex flex-col items-center justify-center py-14 gap-2.5 text-center px-6">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: offline ? "rgba(245,158,11,0.12)" : "var(--surface-2)" }}
      >
        <Icon size={20} style={{ color: offline ? "#f59e0b" : "var(--text-faint)" }} />
      </div>

      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {offline ? t("offline.screenNeedsConnection") : t("offline.couldNotLoad")}
      </p>
      <p className="text-xs leading-relaxed max-w-[16rem]" style={{ color: "var(--text-faint)" }}>
        {offline ? t("offline.screenNeedsConnectionHint") : t("offline.couldNotLoadHint")}
      </p>

      {onRetry && (
        <button
          onClick={() => { haptic("light"); onRetry(); }}
          className="mt-1.5 flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-semibold press"
          style={{ background: "var(--surface-3)", color: "var(--text-secondary)" }}
        >
          <RotateCcw size={13} /> {t("error.retry")}
        </button>
      )}
    </div>
  );
};

export default LoadFailedState;
