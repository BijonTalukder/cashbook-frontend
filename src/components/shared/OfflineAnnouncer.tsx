import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOfflineStore } from "../../store/offlineStore";
import { useTranslation } from "../../i18n/useTranslation";
import { useFormat } from "../../i18n/useFormat";

/**
 * Announces connectivity transitions through the app's existing toaster.
 * Renders nothing — the persistent state lives in SyncStatusIndicator; this
 * only fires on the moments a user needs to notice.
 */
const OfflineAnnouncer = () => {
  const { t } = useTranslation();
  const { num } = useFormat();
  const connectivity = useOfflineStore((s) => s.connectivity);
  const conflicts = useOfflineStore((s) => s.conflicts);

  const previous = useRef(connectivity);
  const announcedConflicts = useRef(0);

  useEffect(() => {
    // "checking" is the startup state, not a transition worth announcing.
    if (previous.current !== connectivity && previous.current !== "checking") {
      if (connectivity === "offline") toast.warning(t("offline.wentOffline"));
      if (connectivity === "online") toast.success(t("offline.backOnline"));
    }
    previous.current = connectivity;
  }, [connectivity, t]);

  useEffect(() => {
    if (conflicts > announcedConflicts.current) {
      toast.error(t("offline.syncConflict", { count: num(conflicts) }));
    }
    announcedConflicts.current = conflicts;
  }, [conflicts, t, num]);

  return null;
};

export default OfflineAnnouncer;
