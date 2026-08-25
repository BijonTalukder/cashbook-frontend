import { AlertTriangle, Check, CloudOff, RefreshCw, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useOfflineStore } from "../../store/offlineStore";
import { syncNow } from "../../offline/bootstrap";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";
import { plural } from "../../i18n/labels";

interface Props {
  variant?: "icon" | "row";
  className?: string;
}

/**
 * The single place the user learns whether their work has left the device.
 * States, in priority order: something needs attention → syncing → offline →
 * changes waiting → everything synced.
 */
const SyncStatusIndicator = ({ variant = "icon", className = "" }: Props) => {
  const { t } = useTranslation();
  const { num, date: fmtDate } = useFormat();
  const [busy, setBusy] = useState(false);

  const connectivity = useOfflineStore((s) => s.connectivity);
  const syncing = useOfflineStore((s) => s.syncing);
  const pending = useOfflineStore((s) => s.pending);
  const failed = useOfflineStore((s) => s.failed);
  const conflicts = useOfflineStore((s) => s.conflicts);
  const lastSyncAt = useOfflineStore((s) => s.lastSyncAt);

  const attention = failed + conflicts;
  const offline = connectivity === "offline";

  const state = attention > 0
    ? "attention"
    : syncing || busy
      ? "syncing"
      : offline
        ? "offline"
        : pending > 0
          ? "pending"
          : "synced";

  const META = {
    attention: {
      color: "#ef4444",
      icon: AlertTriangle,
      label:
        conflicts > 0
          ? plural(t, "offline.conflict", conflicts, { count: num(conflicts) })
          : plural(t, "offline.failed", failed, { count: num(failed) }),
    },
    syncing: { color: "#3b82f6", icon: RefreshCw, label: t("offline.syncing") },
    offline: { color: "#f59e0b", icon: CloudOff, label: t("offline.offline") },
    pending: {
      color: "#f59e0b",
      icon: UploadCloud,
      label: plural(t, "offline.pending", pending, { count: num(pending) }),
    },
    synced: { color: "#10b981", icon: Check, label: t("offline.allSynced") },
  }[state];

  const Icon = META.icon;
  const spinning = state === "syncing";

  const detail = offline
    ? t("offline.offlineHint")
    : lastSyncAt
      ? t("offline.lastSynced", { time: fmtDate(lastSyncAt, "short") })
      : t("offline.neverSynced");

  const handleSync = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await syncNow();
      if (result.reason === "offline") toast.error(t("offline.offlineHint"));
      else if (result.conflicts > 0)
        toast.error(t("offline.syncConflict", { count: num(result.conflicts) }));
      else if (result.failed > 0) toast.error(t("offline.syncFailed"));
      else if (result.synced > 0) toast.success(t("offline.syncComplete"));
    } finally {
      setBusy(false);
    }
  };

  if (variant === "row") {
    return (
      <button
        onClick={handleSync}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors ${className}`}
        style={{ background: "var(--surface-2)" }}
        title={detail}
      >
        <span className="flex items-center gap-3 text-sm min-w-0" style={{ color: "var(--text-primary)" }}>
          <Icon size={16} style={{ color: META.color }} className={spinning ? "animate-spin" : ""} />
          <span className="truncate">{META.label}</span>
        </span>
        {state !== "synced" && state !== "syncing" && (
          <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>
            {t("offline.syncNow")}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      aria-label={`${META.label} — ${detail}`}
      title={`${META.label} — ${detail}`}
      className={`h-9 flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 ${
        state === "synced" ? "w-9" : "px-2.5"
      } ${className}`}
      style={{ background: "var(--surface-3)", color: META.color }}
    >
      <Icon size={16} className={spinning ? "animate-spin" : ""} />
      {(state === "pending" || state === "attention") && (
        <span className="text-[11px] font-semibold">
          {num(state === "attention" ? attention : pending)}
        </span>
      )}
    </button>
  );
};

export default SyncStatusIndicator;
