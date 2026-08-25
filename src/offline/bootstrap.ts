/**
 * Wires the offline layer to the app lifecycle.
 *
 * Sync triggers, all funnelled through the one mutex in `syncManager`:
 *   app start · login · browser `online` event · API reachability restored ·
 *   tab becoming visible · periodic retry · after every local write · manual
 */
import { startNetworkMonitor, onConnectivityChange } from "./network";
import { runSync, scheduleSync, refreshQueueCounts } from "./syncManager";
import { isIdbAvailable } from "./idb";
import { requeueForManualSync } from "./syncQueue";
import { purgeSyncedData } from "./purge";
import { useOfflineStore } from "../store/offlineStore";
import { useAuthStore } from "../store/authStore";

const PERIODIC_RETRY_MS = 60_000;

let started = false;

export const startOfflineRuntime = () => {
  if (started || typeof window === "undefined" || !isIdbAvailable()) return;
  started = true;

  startNetworkMonitor();

  // Show the queue depth from the previous session before the first run.
  void refreshQueueCounts();

  // Connectivity restored — the trigger that matters most after a shop's wifi
  // drops mid-shift.
  onConnectivityChange((status) => {
    if (status === "online") scheduleSync(500);
  });

  // Login: a fresh token means queued work from before can finally go out.
  let hadToken = !!useAuthStore.getState().token;
  useAuthStore.subscribe((state) => {
    const hasToken = !!state.token;
    if (hasToken && !hadToken) scheduleSync(500);
    if (!hasToken && hadToken) void purgeOfflineData();
    hadToken = hasToken;
  });

  window.addEventListener("online", () => scheduleSync(500));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync(1000);
  });

  window.setInterval(() => scheduleSync(0), PERIODIC_RETRY_MS);

  scheduleSync(1000);
};

/** Manual sync — also un-parks failed and conflicted work for one more attempt. */
export const syncNow = async () => {
  await requeueForManualSync();
  return runSync();
};

/**
 * Logout drops the cached copy of everything the server already has, so the next
 * person to sign in on a shared counter terminal sees none of it. Records with
 * unsynced writes — and the queue itself — are deliberately kept: losing a sale
 * that was rung up offline would be worse than holding it until it syncs, and
 * the queue only ever replays under the account that created it.
 */
export const purgeOfflineData = async () => {
  await purgeSyncedData();
  const store = useOfflineStore.getState();
  store.reset();
  await refreshQueueCounts();
};
