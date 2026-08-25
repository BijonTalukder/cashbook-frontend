/**
 * The durable outbox. Every local write that has to reach the backend lands
 * here first and stays until the backend confirms it — nothing is ever marked
 * synced on optimism, and a reload picks the queue up exactly where it was.
 */
import { idbGet, idbGetAll, idbPut, idbDelete, tx, idbRequest } from "./idb";
import { STORES } from "./schema";
import { newOperationId } from "./ids";

export type SyncEntityType =
  | "customer"
  | "product"
  | "sale"
  | "payment"
  | "stockAdjustment";

export type SyncOperationType = "CREATE" | "UPDATE" | "DELETE";

export type SyncOperationStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  /** Transport/server failure, retried automatically until MAX_RETRIES. */
  | "FAILED"
  /** The server rejected the data itself — needs a person, not another retry. */
  | "CONFLICT";

export interface SyncOperation {
  operationId: string;
  /**
   * Who queued it. A shared counter terminal may see several logins; queued
   * work is only ever pushed with the credentials of the user who created it.
   */
  userId: string;
  /** Monotonic insert order — the queue drains FIFO so creates precede their dependents. */
  seq: number;
  businessId: string;
  entityType: SyncEntityType;
  entityId: string;
  operationType: SyncOperationType;
  payload: Record<string, unknown>;
  /** Entity ids that must be on the server before this operation can run. */
  dependsOn: string[];
  status: SyncOperationStatus;
  retryCount: number;
  nextAttemptAt: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MAX_RETRIES = 8;
const BASE_BACKOFF_MS = 5000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;
const SEQ_KEY = "syncQueue.seq";
/** Successful operations linger briefly so the UI can show "just synced". */
const SUCCESS_TTL_MS = 60 * 60 * 1000;

export const backoffFor = (retryCount: number) =>
  Math.min(BASE_BACKOFF_MS * 2 ** retryCount, MAX_BACKOFF_MS);

export interface EnqueueInput {
  businessId: string;
  userId: string;
  entityType: SyncEntityType;
  entityId: string;
  operationType: SyncOperationType;
  payload: Record<string, unknown>;
  dependsOn?: string[];
  /** Supply when the caller already minted the id (so it can be sent as `operationId`). */
  operationId?: string;
}

/**
 * Append an operation. The sequence counter is allocated in the same
 * transaction as the insert, so two writes racing from different tabs can never
 * share a seq and reorder each other.
 */
export const enqueue = async (input: EnqueueInput): Promise<SyncOperation> => {
  const now = new Date().toISOString();
  const operationId = input.operationId ?? newOperationId();

  return tx([STORES.syncQueue, STORES.appMeta], "readwrite", async (store) => {
    const meta = store(STORES.appMeta);
    const row = await idbRequest<{ key: string; value: number } | undefined>(
      meta.get(SEQ_KEY),
    );
    const seq = (row?.value ?? 0) + 1;
    await idbRequest(meta.put({ key: SEQ_KEY, value: seq }));

    const operation: SyncOperation = {
      operationId,
      userId: input.userId,
      seq,
      businessId: input.businessId,
      entityType: input.entityType,
      entityId: input.entityId,
      operationType: input.operationType,
      payload: input.payload,
      dependsOn: input.dependsOn ?? [],
      status: "PENDING",
      retryCount: 0,
      nextAttemptAt: 0,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };
    await idbRequest(store(STORES.syncQueue).put(operation));
    return operation;
  });
};

export const allOperations = (): Promise<SyncOperation[]> =>
  idbGetAll<SyncOperation>(STORES.syncQueue);

export const getOperation = (operationId: string) =>
  idbGet<SyncOperation>(STORES.syncQueue, operationId);

const save = async (operation: SyncOperation) => {
  await idbPut(STORES.syncQueue, {
    ...operation,
    updatedAt: new Date().toISOString(),
  });
};

export const markProcessing = (operation: SyncOperation) =>
  save({ ...operation, status: "PROCESSING" });

export const markSuccess = (operation: SyncOperation) =>
  save({ ...operation, status: "SUCCESS", lastError: null });

/** Transport or 5xx failure — schedule another attempt with exponential backoff. */
export const markRetry = (operation: SyncOperation, error: string) => {
  const retryCount = operation.retryCount + 1;
  const exhausted = retryCount >= MAX_RETRIES;
  return save({
    ...operation,
    status: exhausted ? "FAILED" : "PENDING",
    retryCount,
    nextAttemptAt: Date.now() + backoffFor(retryCount),
    lastError: error,
  });
};

/** The server refused the payload; retrying it verbatim can only fail again. */
export const markConflict = (operation: SyncOperation, error: string) =>
  save({ ...operation, status: "CONFLICT", lastError: error });

export const removeOperation = (operationId: string) =>
  idbDelete(STORES.syncQueue, operationId);

/**
 * A `PROCESSING` row can only be a request that was in flight when the tab
 * closed. It is safe to re-run: the backend deduplicates on `operationId`.
 */
export const recoverInterrupted = async (): Promise<number> => {
  const rows = await idbGetAll<SyncOperation>(STORES.syncQueue, "status", "PROCESSING");
  await Promise.all(
    rows.map((op) => save({ ...op, status: "PENDING", nextAttemptAt: 0 })),
  );
  return rows.length;
};

export const pruneCompleted = async (): Promise<void> => {
  const rows = await idbGetAll<SyncOperation>(STORES.syncQueue, "status", "SUCCESS");
  const cutoff = Date.now() - SUCCESS_TTL_MS;
  await Promise.all(
    rows
      .filter((op) => new Date(op.updatedAt).getTime() < cutoff)
      .map((op) => removeOperation(op.operationId)),
  );
};

/**
 * What "Sync now" means: give every operation still waiting one more chance
 * right away. That covers work sitting out an exponential backoff, work that
 * exhausted its retries, and conflicts — a person pressing the button *is* the
 * manual intervention a parked conflict was waiting for.
 */
export const requeueForManualSync = async (): Promise<number> => {
  const rows = await allOperations();
  const stuck = rows.filter((op) => op.status !== "SUCCESS" && op.status !== "PROCESSING");
  await Promise.all(
    stuck.map((op) => save({ ...op, status: "PENDING", retryCount: 0, nextAttemptAt: 0 })),
  );
  return stuck.length;
};

export interface QueueCounts {
  pending: number;
  failed: number;
  conflicts: number;
}

/** Scoped to one user by default — the indicator must not count another account's queue. */
export const queueCounts = async (userId?: string): Promise<QueueCounts> => {
  const rows = await allOperations();
  const scoped = userId ? rows.filter((op) => op.userId === userId) : rows;
  return {
    pending: scoped.filter((op) => op.status === "PENDING" || op.status === "PROCESSING").length,
    failed: scoped.filter((op) => op.status === "FAILED").length,
    conflicts: scoped.filter((op) => op.status === "CONFLICT").length,
  };
};

/** Entity ids still carrying unfinished work — used for dependency gating. */
export const unresolvedEntityIds = (operations: SyncOperation[]): Set<string> =>
  new Set(
    operations
      .filter((op) => op.status !== "SUCCESS")
      .map((op) => op.entityId),
  );

/**
 * The next batch to attempt, in insert order. Operations whose dependencies are
 * still unresolved are left in place: a sale must not be pushed before the
 * customer it references exists on the server.
 */
export const dueOperations = (operations: SyncOperation[], now = Date.now()): SyncOperation[] => {
  const ordered = [...operations].sort((a, b) => a.seq - b.seq);
  const blocked = new Set<string>();
  const due: SyncOperation[] = [];

  for (const op of ordered) {
    const unfinished = op.status !== "SUCCESS";
    const dependencyBlocked = op.dependsOn.some((id) => blocked.has(id));

    if (unfinished && (op.status !== "PENDING" || dependencyBlocked || op.nextAttemptAt > now)) {
      // Anything this operation would have produced stays unavailable downstream.
      blocked.add(op.entityId);
      continue;
    }
    if (!unfinished) continue;

    due.push(op);
  }
  return due;
};
