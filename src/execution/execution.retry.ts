import { DEFAULT_RETRY_MAX_ATTEMPTS } from './execution.constants';
import type { RetryExecutionContext, RetryExecutionOptions } from './execution.types';
import { validateRetryDelay, validateRetryExecutionOptions } from './execution.validation';

/**
 * Waits for a retry delay while preserving cooperative caller cancellation.
 * Zero-duration delays resolve immediately without allocating a timer.
 */
export async function waitForRetry(delayMilliseconds: number, signal?: AbortSignal): Promise<void> {
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
      const shouldRetryResult = shouldRetry ? await shouldRetry(error, attempt) : true;

      // Preserve the latest failure when no further attempt is allowed.
      if (isMaxAttempts || (shouldRetry && shouldRetryResult === false)) throw error;

      signal?.throwIfAborted();

      // ↓ Resolve and validate the delay before allocating its timer.

      const resolvedDelay =
        typeof delayMilliseconds === 'function' ? await delayMilliseconds(error, attempt) : delayMilliseconds;

      validateRetryDelay(resolvedDelay);
      await waitForRetry(resolvedDelay, signal);
    }
  }
}
