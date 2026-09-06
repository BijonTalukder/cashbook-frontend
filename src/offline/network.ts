/**
 * Connectivity detection.
 *
 * `navigator.onLine` and the `online` event only prove the browser has a link —
 * a shop on captive wifi, or a deployed API that is down, is online by that
 * measure and unreachable in practice. Three signals are combined instead:
 *
 *   1. browser link status  — trusted only when it says *offline*
 *   2. a health probe       — GET /api/health, cheap and unauthenticated
 *   3. real request outcomes — every axios call reports back (see services/api.ts)
 */
import axios from "axios";
import { HEALTH_URL } from "../config/api";
import { useOfflineStore, type ConnectivityStatus } from "../store/offlineStore";

const PROBE_TIMEOUT_MS = 6000;
/** How long a successful probe or request is taken as proof of reachability. */
const FRESHNESS_MS = 15_000;

const probeClient = axios.create({ timeout: PROBE_TIMEOUT_MS });

let lastOkAt = 0;
/** Whether the database was warm enough to accept writes at the last probe.
 *  Gates the sync queue only — it must never decide the app's on/offline. */
let lastWritable = false;
let inFlight: Promise<boolean> | null = null;
type Listener = (status: ConnectivityStatus) => void;
const listeners = new Set<Listener>();

const setStatus = (status: ConnectivityStatus) => {
  const store = useOfflineStore.getState();
  if (store.connectivity === status) return;
  store.setConnectivity(status);
  listeners.forEach((fn) => fn(status));
};

export const getConnectivity = (): ConnectivityStatus =>
  useOfflineStore.getState().connectivity;

export const onConnectivityChange = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * Fold a completed request into the connectivity picture. A transport failure
 * (no response at all) means the API is unreachable; any HTTP status — even a
 * 500 — proves it answered.
 *
 * `trusted` is false for successful GETs, which the service worker may have
 * answered from its own cache while genuinely offline. Those can keep an
 * already-healthy status fresh but must never be what flips offline → online;
 * only the (uncached) health probe and successful writes can do that.
 */
export const reportRequestOutcome = (reachable: boolean, trusted = true) => {
  if (!reachable) {
    lastOkAt = 0;
    lastWritable = false;
    setStatus("offline");
    return;
  }
  if (!trusted && getConnectivity() === "offline") return;
  lastOkAt = Date.now();
  // A successful write proves the database accepted it — strongest evidence
  // that the DB is warm. The health probe overrides this with its own verdict.
  if (trusted) lastWritable = true;
  setStatus("online");
};

/** Hit the health endpoint. Coalesced, so concurrent callers share one probe.
 *  Returns whether the DB is writable (the sync queue's gate) while reporting
 *  online whenever the API answers — reachability and writability are decoupled. */
export const probeApi = async (): Promise<boolean> => {
  if (inFlight) return inFlight;

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    reportRequestOutcome(false);
    return false;
  }

  inFlight = (async () => {
    try {
      const { data } = await probeClient.get(HEALTH_URL);
      // The API answered — the phone is online even if MongoDB is still warming
      // up on a cold serverless lambda. That 200 is the connectivity signal;
      // `writable` only decides whether queued writes can be attempted.
      const writable = data?.data?.writable !== false;
      reportRequestOutcome(true);
      // reportRequestOutcome optimistically marks a trusted success writable;
      // the probe's own DB answer is authoritative.
      lastWritable = writable;
      return writable;
    } catch {
      reportRequestOutcome(false);
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

/** True when the DB can accept writes again; re-probes when evidence is stale. */
export const isApiReachable = async (): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    reportRequestOutcome(false);
    return false;
  }
  if (getConnectivity() === "offline") return probeApi();
  // Fresh evidence while online: reuse the last probe's writable verdict.
  if (Date.now() - lastOkAt < FRESHNESS_MS) return lastWritable;
  return probeApi();
};

/** Synchronous best guess — for render paths that cannot await a probe. */
export const isApiReachableNow = (): boolean =>
  useOfflineStore.getState().connectivity === "online";

let stopFns: (() => void)[] = [];

export const startNetworkMonitor = () => {
  if (typeof window === "undefined" || stopFns.length > 0) return;

  const store = useOfflineStore.getState();

  const handleOnline = () => {
    store.setBrowserOnline(true);
    // The link is back; only a probe can say whether the API is.
    void probeApi();
  };
  const handleOffline = () => {
    store.setBrowserOnline(false);
    reportRequestOutcome(false);
  };
  const handleVisible = () => {
    if (document.visibilityState === "visible") void probeApi();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  document.addEventListener("visibilitychange", handleVisible);

  // Poll while unreachable so recovery is noticed without user interaction;
  // while healthy the probe is just a slow heartbeat.
  const timer = window.setInterval(() => {
    if (getConnectivity() === "online" && Date.now() - lastOkAt < FRESHNESS_MS) return;
    void probeApi();
  }, 15_000);

  stopFns = [
    () => window.removeEventListener("online", handleOnline),
    () => window.removeEventListener("offline", handleOffline),
    () => document.removeEventListener("visibilitychange", handleVisible),
    () => window.clearInterval(timer),
  ];

  void probeApi();
};

export const stopNetworkMonitor = () => {
  stopFns.forEach((fn) => fn());
  stopFns = [];
};
