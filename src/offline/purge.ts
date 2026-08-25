/**
 * Selective cache eviction on logout.
 *
 * Everything the server already holds is dropped; anything still waiting in the
 * outbox stays, because discarding an unsynced sale destroys a business record
 * that exists nowhere else.
 */
import { idbClear, idbDelete, idbGetAll } from "./idb";
import { STORES, type StoreName } from "./schema";
import { allOperations } from "./syncQueue";
import type { OfflineMeta } from "./schema";

const ENTITY_STORES: StoreName[] = [
  STORES.products,
  STORES.customers,
  STORES.sales,
  STORES.payments,
];

export const purgeSyncedData = async (): Promise<void> => {
  const queued = await allOperations();
  // Keep anything an unfinished operation still refers to, plus the customers
  // and products a queued sale points at, or the replay would lose its context.
  const keep = new Set(
    queued
      .filter((op) => op.status !== "SUCCESS")
      .flatMap((op) => [op.entityId, ...op.dependsOn]),
  );

  for (const store of ENTITY_STORES) {
    const rows = await idbGetAll<{ _id: string } & OfflineMeta>(store);
    await Promise.all(
      rows
        .filter((row) => row.syncStatus === "synced" && !keep.has(row._id))
        .map((row) => idbDelete(store, row._id)),
    );
  }

  await idbClear(STORES.carts);
};
