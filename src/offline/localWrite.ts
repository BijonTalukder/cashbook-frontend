/**
 * The write path every offline-capable service call goes through.
 *
 *   update local state → save to IndexedDB → append to the sync queue
 *   → push now if the API is reachable, otherwise leave it pending
 *
 * The push is awaited only briefly: online, that means the caller still gets the
 * server's version back (real invoice number and all) and nothing about the UX
 * changes; offline, the write is already durable and the queue takes over.
 */
import { useAuthStore } from "../store/authStore";
import { enqueue, getOperation, type EnqueueInput } from "./syncQueue";
import { runSync, scheduleSync } from "./syncManager";
import { isApiReachable } from "./network";
import { newOperationId } from "./ids";

const FLUSH_TIMEOUT_MS = 7000;

export const currentUserId = (): string => useAuthStore.getState().user?._id ?? "anonymous";

export class OfflineUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfflineUnavailableError";
  }
}

/**
 * Queue an operation and, when the API is up, wait for this one to be pushed.
 * Returns whether it reached the backend — the caller can then re-read the
 * record to pick up server-assigned fields.
 */
export const enqueueAndFlush = async (
  input: Omit<EnqueueInput, "userId" | "operationId">,
): Promise<boolean> => {
  const operationId = newOperationId();
  await enqueue({ ...input, userId: currentUserId(), operationId });

  if (!(await isApiReachable())) {
    scheduleSync(0);
    return false;
  }

  const timeout = new Promise<void>((resolve) => setTimeout(resolve, FLUSH_TIMEOUT_MS));
  await Promise.race([runSync(), timeout]);

  const operation = await getOperation(operationId);
  return operation?.status === "SUCCESS";
};
