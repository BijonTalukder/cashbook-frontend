export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  backoff?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Executes an async operation with automatic retry on transient failures
 * (such as serverless cold-start timeouts, 500/502/503/504 errors, or network blips).
 *
 * Client validation errors (400, 401, 403, 404, 409, 422) are never retried
 * and fail immediately so users get accurate validation feedback without delay.
 */
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const { retries = 2, delayMs = 1500, backoff = 1.5, shouldRetry } = options;
  let attempt = 0;
  let currentDelay = delayMs;

  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;

      if (attempt > retries) {
        throw err;
      }

      if (shouldRetry) {
        if (!shouldRetry(err, attempt)) {
          throw err;
        }
      } else {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const isTransient =
          !status ||
          status === 408 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (!isTransient) {
          throw err;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay = Math.round(currentDelay * backoff);
    }
  }
};
