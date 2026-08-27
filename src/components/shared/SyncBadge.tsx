import { AlertTriangle, UploadCloud } from "lucide-react";
import type { SyncStatus } from "../../offline/schema";
import { useTranslation } from "../../i18n/useTranslation";

/**
 * Row-level marker for a record that has not reached the server yet. Renders
 * nothing for synced records, so it can be dropped into any list unconditionally.
 *
 * `compact` is the list-row form: the icon alone, carrying its meaning through
 * `title`/`aria-label`. The full "Pending sync" pill is ~130px wide, and on a
 * 360dp phone a row that also shows a low-stock warning and three action
 * buttons has nowhere to put it — it pushed the delete button off the card.
 */
const SyncBadge = ({
  status,
  className = "",
  compact = false,
}: {
  status?: SyncStatus;
  className?: string;
  compact?: boolean;
}) => {
  const { t } = useTranslation();
  if (!status || status === "synced") return null;

  const conflict = status === "conflict";
  const color = conflict ? "#ef4444" : "#f59e0b";
  const Icon = conflict ? AlertTriangle : UploadCloud;
  const label = t(conflict ? "offline.conflictBadge" : "offline.pendingBadge");

  if (compact) {
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-md flex-shrink-0 ${className}`}
        style={{ background: `${color}1a`, color }}
        title={label}
        aria-label={label}
        role="img"
      >
        <Icon size={11} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${className}`}
      style={{ background: `${color}1a`, color }}
      title={label}
    >
      <Icon size={9} />
      {label}
    </span>
  );
};

export default SyncBadge;
