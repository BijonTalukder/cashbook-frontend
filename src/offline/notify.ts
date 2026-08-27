import { toast } from "sonner";
import { useOfflineStore } from "../store/offlineStore";

/**
 * Report a failed screen load — but stay quiet when the cause is simply that
 * the device is offline.
 *
 * Going offline is already announced once by `OfflineAnnouncer`, and the screen
 * itself now renders `LoadFailedState` explaining what it needs. A third,
 * red "Failed to load expenses" on top of that reads as an error the user
 * caused. A genuine server failure while online still deserves the toast.
 */
export const toastLoadFailure = (message: string) => {
  if (useOfflineStore.getState().connectivity === "offline") return;
  toast.error(message);
};
