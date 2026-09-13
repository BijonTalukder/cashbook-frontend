/**
 * Shared read/write helpers for the cached entity stores.
 *
 * The rules encoded here are the ones that keep offline data honest:
 *  - a record with unsynced local writes is never overwritten by a server pull
 *  - numeric columns the client moves optimistically (stock, balances) are kept
 *    as `server value + pending delta`, so a pull can rebase without losing the
 *    local movement or double-counting it once the queue drains
 */
import { idbGet, idbGetAll, idbPut, idbPutMany, idbDelete, tx, idbRequest } from "../idb";
import type { OfflineMeta, StoreName, SyncStatus } from "../schema";
import { bumpDataVersion } from "../../store/offlineStore";

export type Cached<T> = T & { _id: string; business: string } & OfflineMeta;

const nowIso = () => new Date().toISOString();

export const withMeta = <T extends { _id: string; business: string }>(
  row: T,
  status: SyncStatus = "synced",
  extra: Partial<OfflineMeta> = {},
): Cached<T> => ({
  ...row,
  syncStatus: status,
  localUpdatedAt: nowIso(),
  syncError: null,
  ...extra,
});

/** Visible value of a delta-tracked field = last server value + unsynced local movement. */
const recompute = <T>(record: Cached<T>, field: string) => {
  const server = record.serverValues?.[field] ?? 0;
  const pending = record.pendingDeltas?.[field] ?? 0;
  (record as Record<string, unknown>)[field] = server + pending;
};

/** Record an optimistic local change to a numeric field (e.g. stock -3). */
export const applyLocalDelta = <T>(
  record: Cached<T>,
  field: string,
  delta: number,
): Cached<T> => {
  const next: Cached<T> = {
    ...record,
    serverValues: { ...(record.serverValues ?? {}) },
    pendingDeltas: { ...(record.pendingDeltas ?? {}) },
  };
  if (next.serverValues![field] === undefined) {
    next.serverValues![field] = Number((record as Record<string, unknown>)[field] ?? 0);
  }
  next.pendingDeltas![field] = (next.pendingDeltas![field] ?? 0) + delta;
  recompute(next, field);
  return next;
};

/**
 * The backend has now applied `delta` too: move it from the pending column to
 * the server column. The visible value does not change.
 */
export const settleLocalDelta = <T>(
  record: Cached<T>,
  field: string,
  delta: number,
): Cached<T> => {
  const next: Cached<T> = {
    ...record,
    serverValues: { ...(record.serverValues ?? {}) },
    pendingDeltas: { ...(record.pendingDeltas ?? {}) },
  };
  next.serverValues![field] = (next.serverValues![field] ?? 0) + delta;
  next.pendingDeltas![field] = (next.pendingDeltas![field] ?? 0) - delta;
  if (next.pendingDeltas![field] === 0) delete next.pendingDeltas![field];
  recompute(next, field);
  return next;
};

const stripMeta = <T>(record: Cached<T>): T => {
  const { syncStatus, localUpdatedAt, pendingDeltas, serverValues, syncError, ...rest } = record;
  void syncStatus; void localUpdatedAt; void pendingDeltas; void serverValues; void syncError;
  return rest as unknown as T;
};

/**
 * Rebase a cached record onto a fresh server row.
 *
 * A record with queued local writes keeps its own field values — the server
 * copy is stale by definition until the queue drains — while delta-tracked
 * numbers still re-baseline on the server figure so the pending movement is
 * neither lost nor counted twice.
 */
export const rebaseFromServer = <T extends { _id: string; business: string }>(
  local: Cached<T> | undefined,
  server: T,
  deltaFields: string[],
): Cached<T> => {
  const unsynced = !!local && local.syncStatus !== "synced";
  const merged = withMeta(
    unsynced ? ({ ...server, ...stripMeta(local!) } as T) : server,
    unsynced ? local!.syncStatus : "synced",
    { syncError: local?.syncError ?? null },
  );

  if (deltaFields.length === 0) return merged;

  merged.serverValues = {};
  merged.pendingDeltas = {};
  for (const field of deltaFields) {
    const serverValue = Number((server as Record<string, unknown>)[field] ?? 0);
    const pending = local?.pendingDeltas?.[field] ?? 0;
    merged.serverValues[field] = serverValue;
    if (pending !== 0) merged.pendingDeltas[field] = pending;
    recompute(merged, field);
  }
  return merged;
};

export interface RepoOptions {
  /** Numeric fields tracked as `server + pending` (product stock, customer totals). */
  deltaFields?: string[];
}

export const createRepo = <T extends { _id: string; business: string }>(
  store: StoreName,
  options: RepoOptions = {},
) => {
  const deltaFields = options.deltaFields ?? [];

  const list = async (businessId: string): Promise<Cached<T>[]> =>
    idbGetAll<Cached<T>>(store, "business", businessId);

  const get = (id: string) => idbGet<Cached<T>>(store, id);

  const put = async (record: Cached<T>) => {
    await idbPut(store, record);
    bumpDataVersion();
    return record;
  };

  const remove = async (id: string) => {
    await idbDelete(store, id);
    bumpDataVersion();
  };

  /** Read-modify-write inside one transaction so concurrent updates cannot clobber. */
  const update = async (
    id: string,
    mutate: (record: Cached<T>) => Cached<T>,
  ): Promise<Cached<T> | undefined> => {
    const result = await tx([store], "readwrite", async (s) => {
      const target = s(store);
      const current = await idbRequest<Cached<T> | undefined>(target.get(id));
      if (!current) return undefined;
      const next = { ...mutate(current), localUpdatedAt: nowIso() };
      await idbRequest(target.put(next));
      return next;
    });
    if (result) bumpDataVersion();
    return result;
  };

  /**
   * Fold a server response into the cache.
   *
   * `prune` deletes cached rows the server no longer returns — only safe for an
   * unfiltered full listing, never for a search or a paginated page. Rows with
   * pending local writes are always kept.
   */
  const mergeFromServer = async (
    businessId: string,
    serverRows: T[],
    prune = false,
  ): Promise<Cached<T>[]> => {
    const existing = await list(businessId);
    const byId = new Map(existing.map((row) => [row._id, row]));
    const merged = serverRows.map((row) =>
      rebaseFromServer(byId.get(row._id), row, deltaFields),
    );

    const seen = new Set(serverRows.map((row) => row._id));
    const stale = prune
      ? existing.filter((row) => !seen.has(row._id) && row.syncStatus === "synced")
      : [];

    // Skip the version bump when nothing actually changed — otherwise the
    // fire-and-forget refresh that `getAll` kicks off after a warm cache
    // loops forever against any page that lists `dataVersion` in its deps.
    const changed =
      stale.length > 0 ||
      merged.some((row) => {
        const prev = byId.get(row._id);
        if (!prev) return true;
        // Status flips (e.g. pending → synced after the queue drains) are
        // exactly the signal subscribers want, so they trigger a bump even
        // when the visible payload is unchanged.
        return (
          JSON.stringify(stripMeta(prev)) !== JSON.stringify(stripMeta(row)) ||
          prev.syncStatus !== row.syncStatus ||
          prev.syncError !== row.syncError
        );
      });

    await idbPutMany(store, merged);
    await Promise.all(stale.map((row) => idbDelete(store, row._id)));
    if (changed) bumpDataVersion();

    // Rows the server did not return but that still have unsynced work — a
    // sale rung up offline, a product created moments ago — stay in the result.
    const kept = existing.filter((row) => !seen.has(row._id) && row.syncStatus !== "synced");
    return [...merged, ...kept];
  };

  const pending = async (businessId: string) =>
    (await list(businessId)).filter((row) => row.syncStatus !== "synced");

  return { store, list, get, put, remove, update, mergeFromServer, pending, deltaFields };
};

export type Repo<T extends { _id: string; business: string }> = ReturnType<
  typeof createRepo<T>
>;
