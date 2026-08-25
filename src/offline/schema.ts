/**
 * IndexedDB schema for offline-first Business Mode.
 *
 * Only the POS path is mirrored locally: the entities a shopkeeper has to read
 * and write with no network (products, customers, sales, payments, the sale in
 * progress) plus the queue and bookkeeping that make those writes durable.
 * Suppliers, purchases, expenses, reports and mess data stay online-only —
 * they are back-office flows, not counter flows.
 */

export const DB_NAME = "hisabboi-offline";
export const DB_VERSION = 1;

export const STORES = {
  products: "products",
  customers: "customers",
  sales: "sales",
  payments: "payments",
  carts: "carts",
  syncQueue: "syncQueue",
  appMeta: "appMeta",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

interface StoreSpec {
  keyPath: string;
  indexes: { name: string; keyPath: string }[];
}

export const STORE_SPECS: Record<StoreName, StoreSpec> = {
  products: {
    keyPath: "_id",
    indexes: [
      { name: "business", keyPath: "business" },
      { name: "syncStatus", keyPath: "syncStatus" },
    ],
  },
  customers: {
    keyPath: "_id",
    indexes: [
      { name: "business", keyPath: "business" },
      { name: "syncStatus", keyPath: "syncStatus" },
    ],
  },
  sales: {
    keyPath: "_id",
    indexes: [
      { name: "business", keyPath: "business" },
      { name: "date", keyPath: "date" },
      { name: "customer", keyPath: "customerId" },
      { name: "syncStatus", keyPath: "syncStatus" },
    ],
  },
  payments: {
    keyPath: "_id",
    indexes: [
      { name: "business", keyPath: "business" },
      { name: "syncStatus", keyPath: "syncStatus" },
    ],
  },
  // The sale being rung up, one draft per business — local only, never synced.
  carts: { keyPath: "businessId", indexes: [] },
  syncQueue: {
    keyPath: "operationId",
    indexes: [
      { name: "status", keyPath: "status" },
      { name: "seq", keyPath: "seq" },
      { name: "business", keyPath: "businessId" },
      { name: "entityId", keyPath: "entityId" },
    ],
  },
  // Free-form key/value: queue sequence counter, per-entity last-pull markers.
  appMeta: { keyPath: "key", indexes: [] },
};

/** `synced` = matches the server. `pending` = has queued local writes. */
export type SyncStatus = "synced" | "pending" | "conflict";

/**
 * Fields every cached entity carries on top of its server shape.
 *
 * `pendingDeltas`/`serverValues` keep numeric columns the client mutates
 * optimistically (product stock, customer balances) reconcilable: the visible
 * value is always `serverValues[field] + pendingDeltas[field]`, so a refresh
 * from the server can rebase without discarding unsynced local movement.
 */
export interface OfflineMeta {
  syncStatus: SyncStatus;
  localUpdatedAt: string;
  pendingDeltas?: Record<string, number>;
  serverValues?: Record<string, number>;
  syncError?: string | null;
}

export type OfflineRecord<T> = T & { _id: string; business: string } & OfflineMeta;

export interface MetaRow {
  key: string;
  value: unknown;
}
