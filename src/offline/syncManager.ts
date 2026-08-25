/**
 * Drains the outbox.
 *
 * Contract, in order of importance:
 *  1. an operation is marked synced only after the backend confirms it
 *  2. a retry can never create a second record — every request carries the
 *     `operationId` the backend deduplicates on
 *  3. only one run at a time, whatever fires the trigger
 *  4. an operation that the server *rejected* is parked as a conflict for a
 *     person to resolve, not retried into the ground
 */
import { AxiosError } from "axios";
import api from "../services/api";
import { useOfflineStore } from "../store/offlineStore";
import { useAuthStore } from "../store/authStore";
import { reportRequestOutcome, isApiReachable } from "./network";
import {
  allOperations,
  dueOperations,
  markConflict,
  markProcessing,
  markRetry,
  markSuccess,
  pruneCompleted,
  queueCounts,
  recoverInterrupted,
  type SyncOperation,
} from "./syncQueue";
import { customerRepo, paymentRepo, productRepo, saleRepo } from "./repositories";
import { settleLocalDelta, withMeta, type Cached, type Repo } from "./repositories/base";
import { metaRepo, LAST_SYNC_AT } from "./repositories/meta.repo";
import type { IProduct } from "../services/product.service";
import type { ICustomer } from "../services/customer.service";
import type { ISale } from "../services/sale.service";
import type { IPayment } from "../services/payment.service";

export interface SyncResult {
  ran: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  reason?: "offline" | "unauthenticated" | "empty";
}

/* ── Failure classification ──────────────────────────────
   A transport error means "try again later". A 4xx means the server looked at
   the payload and said no — retrying it byte-for-byte cannot help.
   409/429/408 are the exceptions: they explicitly invite a retry.
──────────────────────────────────────────────────────── */
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

interface Classified {
  retryable: boolean;
  message: string;
  transport: boolean;
}

const classify = (error: unknown): Classified => {
  const axiosError = error as AxiosError<{ message?: string }>;
  if (axiosError?.isAxiosError && !axiosError.response) {
    return { retryable: true, transport: true, message: axiosError.message || "Network error" };
  }
  const status = axiosError?.response?.status;
  const message =
    axiosError?.response?.data?.message ?? (error as Error)?.message ?? "Sync failed";
  if (status === undefined) return { retryable: true, transport: false, message };
  return { retryable: RETRYABLE_STATUSES.has(status), transport: false, message };
};

/* ── Per-entity handlers ─────────────────────────────────
   Each pushes one operation and folds the confirmed server record back into the
   cache: server ids, server-assigned invoice numbers, and the delta settlement
   that moves optimistic local movement into the "server knows" column.
──────────────────────────────────────────────────────── */

const handleCustomerCreate = async (op: SyncOperation) => {
  const { data } = await api.post("/customers", {
    ...op.payload,
    clientId: op.entityId,
    operationId: op.operationId,
  });
  // The opening balance was already counted locally; rebase onto the server row
  // while keeping whatever sale/payment deltas are still queued.
  await storeConfirmed(customerRepo, op.entityId, data.data as ICustomer);
};

const handleCustomerUpdate = async (op: SyncOperation) => {
  const { data } = await api.patch(`/customers/${op.entityId}`, op.payload);
  await storeConfirmed(customerRepo, op.entityId, data.data as ICustomer);
};

const handleCustomerDelete = async (op: SyncOperation) => {
  try {
    await api.delete(`/customers/${op.entityId}`);
  } catch (error) {
    if ((error as AxiosError)?.response?.status !== 404) throw error;
  }
  await customerRepo.remove(op.entityId);
};

const handleProductCreate = async (op: SyncOperation) => {
  const { data } = await api.post("/products", {
    ...op.payload,
    clientId: op.entityId,
    operationId: op.operationId,
  });
  await storeConfirmed(productRepo, op.entityId, data.data as IProduct);
};

const handleProductUpdate = async (op: SyncOperation) => {
  const { data } = await api.patch(`/products/${op.entityId}`, op.payload);
  await storeConfirmed(productRepo, op.entityId, data.data as IProduct);
};

const handleProductDelete = async (op: SyncOperation) => {
  try {
    await api.delete(`/products/${op.entityId}`);
  } catch (error) {
    // Already gone server-side is the outcome we wanted.
    if ((error as AxiosError)?.response?.status !== 404) throw error;
  }
  await productRepo.remove(op.entityId);
};

const handleStockAdjustment = async (op: SyncOperation) => {
  const { type, quantity, delta } = op.payload as {
    type: "increase" | "decrease" | "set";
    quantity: number;
    delta: number;
  };
  const { data } = await api.post(`/products/${op.entityId}/adjust-stock`, {
    type,
    quantity,
    operationId: op.operationId,
  });
  const server = data.data as IProduct;
  const local = await productRepo.get(op.entityId);
  if (!local) {
    await productRepo.put(withMeta(server));
    return;
  }
  // The delta is on the server now: move it out of the pending column, then
  // rebase on the authoritative stock figure the server just returned. For a
  // "set" adjustment those two can differ — the server's number wins.
  const settled = settleLocalDelta(local, "stock", delta);
  await productRepo.put(rebase(settled, server, productRepo.deltaFields));
};

const handleSaleCreate = async (op: SyncOperation) => {
  const { data } = await api.post("/sales", {
    ...op.payload,
    clientId: op.entityId,
    operationId: op.operationId,
  });
  const server = data.data as ISale;
  const local = await saleRepo.get(op.entityId);

  // The server assigns the real invoice number; the local placeholder goes away.
  await saleRepo.put(
    withMeta({
      ...(local ?? ({} as ISale)),
      ...server,
      _id: op.entityId,
      customerId: server.customer?._id ?? null,
    } as ISale & { _id: string; business: string; customerId?: string | null }),
  );

  await settleSaleDeltas(op);
};

const handlePaymentCreate = async (op: SyncOperation) => {
  const { direction } = op.payload as { direction: "in" | "out" };
  const url = direction === "out" ? "/payments/pay" : "/payments/receive";
  const { data } = await api.post(url, {
    ...op.payload,
    direction: undefined,
    clientId: op.entityId,
    operationId: op.operationId,
  });
  const server = data.data as IPayment;
  await paymentRepo.put(withMeta({ ...server, _id: op.entityId }));

  const { customerId, amount } = op.payload as { customerId?: string; amount: number };
  if (direction === "in" && customerId) {
    const customer = await customerRepo.get(customerId);
    if (customer) {
      let next = settleLocalDelta(customer, "totalPaid", amount);
      next = settleLocalDelta(next, "totalDue", -amount);
      next.syncStatus = hasPendingDeltas(next) ? "pending" : "synced";
      await customerRepo.put(next);
    }
  }
};

/** Move a synced sale's stock and balance movement from pending to server-known. */
const settleSaleDeltas = async (op: SyncOperation) => {
  const { items, customerId, total, paidAmount, dueAmount } = op.payload as {
    items: { product: string; quantity: number }[];
    customerId?: string;
    total: number;
    paidAmount: number;
    dueAmount: number;
  };

  for (const item of items) {
    const product = await productRepo.get(item.product);
    if (!product) continue;
    const settled = settleLocalDelta(product, "stock", -item.quantity);
    settled.syncStatus = hasPendingDeltas(settled) ? "pending" : "synced";
    await productRepo.put(settled);
  }

  if (customerId) {
    const customer = await customerRepo.get(customerId);
    if (customer) {
      let next = settleLocalDelta(customer, "totalSales", total);
      next = settleLocalDelta(next, "totalPaid", paidAmount);
      next = settleLocalDelta(next, "totalDue", dueAmount);
      next.syncStatus = hasPendingDeltas(next) ? "pending" : "synced";
      await customerRepo.put(next);
    }
  }
};

const hasPendingDeltas = (record: { pendingDeltas?: Record<string, number> }) =>
  Object.values(record.pendingDeltas ?? {}).some((v) => v !== 0);

/**
 * Fold a confirmed server row onto a cached record: server values become the
 * new baseline, still-queued deltas are re-applied on top, and the record only
 * counts as synced once nothing local is outstanding.
 */
const rebase = <T extends { _id: string; business: string }>(
  local: Cached<T> | undefined,
  server: T,
  deltaFields: string[],
): Cached<T> => {
  const pendingDeltas = { ...(local?.pendingDeltas ?? {}) };
  const serverValues: Record<string, number> = {};
  const row = server as Record<string, unknown>;
  const merged = withMeta(server) as Cached<T>;

  for (const field of deltaFields) {
    const serverValue = Number(row[field] ?? 0);
    serverValues[field] = serverValue;
    (merged as unknown as Record<string, unknown>)[field] =
      serverValue + (pendingDeltas[field] ?? 0);
  }

  merged.serverValues = serverValues;
  merged.pendingDeltas = pendingDeltas;
  merged.syncStatus = hasPendingDeltas(merged) ? "pending" : "synced";
  return merged;
};

const storeConfirmed = async <T extends { _id: string; business: string }>(
  repo: Repo<T>,
  entityId: string,
  server: T,
) => {
  const local = await repo.get(entityId);
  await repo.put(rebase(local, server, repo.deltaFields));
};

type Handler = (op: SyncOperation) => Promise<void>;

const handlers: Record<string, Handler> = {
  "customer:CREATE": handleCustomerCreate,
  "customer:UPDATE": handleCustomerUpdate,
  "customer:DELETE": handleCustomerDelete,
  "product:CREATE": handleProductCreate,
  "product:UPDATE": handleProductUpdate,
  "product:DELETE": handleProductDelete,
  "stockAdjustment:CREATE": handleStockAdjustment,
  "sale:CREATE": handleSaleCreate,
  "payment:CREATE": handlePaymentCreate,
};

/* ── The run loop ────────────────────────────────────── */

let running: Promise<SyncResult> | null = null;

const refreshCounts = async (userId = activeUserId() ?? undefined) => {
  const counts = await queueCounts(userId);
  useOfflineStore.getState().setQueueCounts(counts);
  return counts;
};

/** Null when signed out — queued work then simply waits for the next login. */
const activeUserId = (): string | null => {
  const { token, user } = useAuthStore.getState();
  return token ? (user?._id ?? "anonymous") : null;
};

const runOnce = async (): Promise<SyncResult> => {
  const store = useOfflineStore.getState();

  const userId = activeUserId();
  if (!userId) {
    return { ran: false, synced: 0, failed: 0, conflicts: 0, reason: "unauthenticated" };
  }

  // A row left PROCESSING is a request that died mid-flight; the backend's
  // operationId check makes re-sending it safe.
  await recoverInterrupted();
  await pruneCompleted();

  // Only this user's queued work — another account's pending sales must never
  // be pushed under the credentials currently signed in.
  const operations = (await allOperations()).filter((op) => op.userId === userId);
  const counts = await refreshCounts(userId);
  if (counts.pending === 0) {
    return { ran: false, synced: 0, failed: 0, conflicts: 0, reason: "empty" };
  }

  if (!(await isApiReachable())) {
    return { ran: false, synced: 0, failed: 0, conflicts: 0, reason: "offline" };
  }

  store.setSyncing(true);
  let synced = 0;
  let failed = 0;
  let conflicts = 0;
  // Entities whose write failed in this run — dependents must not be attempted.
  const blocked = new Set<string>();

  try {
    for (const op of dueOperations(operations)) {
      if (op.dependsOn.some((id) => blocked.has(id))) continue;

      const handler = handlers[`${op.entityType}:${op.operationType}`];
      if (!handler) {
        await markConflict(op, `No handler for ${op.entityType}:${op.operationType}`);
        conflicts += 1;
        blocked.add(op.entityId);
        continue;
      }

      await markProcessing(op);
      try {
        await handler(op);
        await markSuccess(op);
        reportRequestOutcome(true);
        synced += 1;
      } catch (error) {
        const { retryable, transport, message } = classify(error);
        blocked.add(op.entityId);
        if (retryable) {
          await markRetry(op, message);
          failed += 1;
          if (transport) {
            // The API went away mid-run — stop rather than burn retry budget.
            reportRequestOutcome(false);
            break;
          }
        } else {
          await markConflict(op, message);
          conflicts += 1;
          await flagConflict(op, message);
        }
      }
    }
  } finally {
    store.setSyncing(false);
    await refreshCounts();
  }

  const at = new Date().toISOString();
  await metaRepo.set(LAST_SYNC_AT, at);
  store.setLastSync(at, conflicts > 0 || failed > 0 ? "sync.partial" : null);

  return { ran: true, synced, failed, conflicts };
};

/** Mark the underlying record so the UI can point at what needs attention. */
const flagConflict = async (op: SyncOperation, message: string) => {
  const mark = <T extends { _id: string; business: string }>(record: Cached<T>): Cached<T> => ({
    ...record,
    syncStatus: "conflict",
    syncError: message,
  });
  switch (op.entityType) {
    case "sale":
      await saleRepo.update(op.entityId, mark);
      break;
    case "customer":
      await customerRepo.update(op.entityId, mark);
      break;
    case "payment":
      await paymentRepo.update(op.entityId, mark);
      break;
    default:
      await productRepo.update(op.entityId, mark);
  }
};

/**
 * Run the queue. Concurrent callers share the in-flight run — the mutex that
 * stops a login, an `online` event and the interval from racing each other.
 */
export const runSync = (): Promise<SyncResult> => {
  if (running) return running;
  running = runOnce()
    .catch((error): SyncResult => {
      useOfflineStore.getState().setLastSync(null, (error as Error)?.message ?? "Sync failed");
      return { ran: false, synced: 0, failed: 0, conflicts: 0 };
    })
    .finally(() => {
      running = null;
    }) as Promise<SyncResult>;
  return running;
};

export const isSyncRunning = () => running !== null;

let scheduled: number | null = null;

/** Coalesce the burst of triggers that follows a local write. */
export const scheduleSync = (delayMs = 300) => {
  if (typeof window === "undefined" || scheduled !== null) return;
  scheduled = window.setTimeout(() => {
    scheduled = null;
    void runSync();
  }, delayMs);
};

export { refreshCounts as refreshQueueCounts };
