import { create } from "zustand";

/** `offline` = the API is not answering, whatever the browser thinks of the link. */
export type ConnectivityStatus = "online" | "offline" | "checking";

interface OfflineState {
  /** Browser link status — a fast negative signal, never a positive one. */
  browserOnline: boolean;
  /** Whether the API itself answered recently. */
  connectivity: ConnectivityStatus;
  syncing: boolean;
  pending: number;
  failed: number;
  conflicts: number;
  lastSyncAt: string | null;
  lastError: string | null;
  /**
   * Bumped whenever the local cache changes. Pages list it in their effect deps
   * so a background sync re-renders them without any extra plumbing.
   */
  dataVersion: number;

  setBrowserOnline: (value: boolean) => void;
  setConnectivity: (value: ConnectivityStatus) => void;
  setSyncing: (value: boolean) => void;
  setQueueCounts: (counts: { pending: number; failed: number; conflicts: number }) => void;
  setLastSync: (at: string | null, error?: string | null) => void;
  bumpDataVersion: () => void;
  reset: () => void;
}

const initial = {
  browserOnline: typeof navigator === "undefined" ? true : navigator.onLine,
  connectivity: "checking" as ConnectivityStatus,
  syncing: false,
  pending: 0,
  failed: 0,
  conflicts: 0,
  lastSyncAt: null as string | null,
  lastError: null as string | null,
  dataVersion: 0,
};

export const useOfflineStore = create<OfflineState>()((set) => ({
  ...initial,
  setBrowserOnline: (browserOnline) => set({ browserOnline }),
  setConnectivity: (connectivity) => set({ connectivity }),
  setSyncing: (syncing) => set({ syncing }),
  setQueueCounts: (counts) => set(counts),
  setLastSync: (lastSyncAt, lastError = null) => set({ lastSyncAt, lastError }),
  bumpDataVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
  reset: () => set({ ...initial, dataVersion: 0 }),
}));

/** Subscribe a component to local-cache changes without re-rendering on unrelated state. */
export const useDataVersion = () => useOfflineStore((s) => s.dataVersion);

export const bumpDataVersion = () => useOfflineStore.getState().bumpDataVersion();
