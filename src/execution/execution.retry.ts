import { DEFAULT_RETRY_MAX_ATTEMPTS } from './execution.constants';
import type { RetryExecutionContext, RetryExecutionOptions } from './execution.types';
import { validateRetryDelay, validateRetryExecutionOptions } from './execution.validation';

/**
 * Waits for a retry delay while preserving cooperative caller cancellation.
 * Zero-duration delays resolve immediately without allocating a timer.
 */
export async function waitForRetry(delayMilliseconds: number, signal?: AbortSignal): Promise<void> {
  validateRetryDelay(delayMilliseconds);
  signal?.throwIfAborted();

  if (delayMilliseconds === 0) return;

  await new Promise<void>((resolve, reject) => {
    // ↓ Keep the timer and abort listener mutually disposable.

    const onAbort = () => {
      clearTimeout(timeout);
      reject(signal?.reason);
    };

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMilliseconds);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Repeats a failed operation under explicit attempt, delay, and filtering policies.
 * Exhaustion, rejected filtering, and cancellation preserve the original failure.
 */
export async function retryExecution<TData>(
  execution: (context: RetryExecutionContext) => TData | Promise<TData>,
  options: RetryExecutionOptions = {}
): Promise<TData> {
  const { shouldRetry, signal } = options;
  const { maxAttempts = DEFAULT_RETRY_MAX_ATTEMPTS, delayMilliseconds = 0 } = options;

  validateRetryExecutionOptions(options, maxAttempts);

  for (let attempt = 1; ; attempt += 1) {
    signal?.throwIfAborted();

    try {
      return await execution({ attempt, signal });
    } catch (error) {
      const isMaxAttempts = attempt === maxAttempts;
      const isRetryRejected =
        // Reject the retry if the attempt limit is reached or the retry filter returns false.
        isMaxAttempts === false && shouldRetry ? (await shouldRetry(error, attempt)) === false : false;

      // ↓ Preserve the latest failure when no further attempt is allowed.

      const isRetryUnavailable = isMaxAttempts || isRetryRejected;
      if (isRetryUnavailable) throw error;

      signal?.throwIfAborted();

      // ↓ Resolve and validate the delay before allocating its timer.

      const resolvedDelay =
        // Delay resolution may be asynchronous if a delay function is provided.
        typeof delayMilliseconds === 'function' ? await delayMilliseconds(error, attempt) : delayMilliseconds;

      await waitForRetry(resolvedDelay, signal);
    }
  }
}
