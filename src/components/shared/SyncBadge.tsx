import { AlertTriangle, UploadCloud } from "lucide-react";
import type { SyncStatus } from "../../offline/schema";
import { useTranslation } from "../../i18n/useTranslation";

/**
 * Row-level marker for a record that has not reached the server yet. Renders
 * nothing for synced records, so it can be dropped into any list unconditionally.
 */
const SyncBadge = ({ status, className = "" }: { status?: SyncStatus; className?: string }) => {
  const { t } = useTranslation();
  if (!status || status === "synced") return null;

  const conflict = status === "conflict";
  const color = conflict ? "#ef4444" : "#f59e0b";
  const Icon = conflict ? AlertTriangle : UploadCloud;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${className}`}
      style={{ background: `${color}1a`, color }}
      title={t(conflict ? "offline.conflictBadge" : "offline.pendingBadge")}
    >
      <Icon size={9} />
      {t(conflict ? "offline.conflictBadge" : "offline.pendingBadge")}
    </span>
  );
};

export default SyncBadge;
