import { executionErrors } from './execution.errors';
import type { ExecuteWithTimeoutOptions } from './execution.types';
import { validateExecutionTimeout } from './execution.validation';

/**
 * Runs an operation with a signal controlled by timeout and caller cancellation.
 * The promise rejects promptly even when the operation ignores its abort signal.
 */
export async function executeWithTimeout<TData>(
  execution: (signal: AbortSignal) => TData | Promise<TData>,
  options: ExecuteWithTimeoutOptions
): Promise<TData> {
  const { timeoutMilliseconds, signal: callerSignal } = options;
  validateExecutionTimeout(timeoutMilliseconds);

  const controller = new AbortController();
  const forwardCallerAbort = () => controller.abort(callerSignal?.reason);
  const rejectOnAbort = () => rejectAbortedExecution?.(controller.signal.reason);
  let rejectAbortedExecution: ((reason: unknown) => void) | undefined;

  // ↓ Forward caller cancellation through the internally controlled signal.

  if (callerSignal?.aborted) controller.abort(callerSignal.reason);
  else callerSignal?.addEventListener('abort', forwardCallerAbort, { once: true });

  controller.signal.throwIfAborted();

  const timeout = setTimeout(() => {
    controller.abort(executionErrors.executionTimedOut());
  }, timeoutMilliseconds);

  // ↓ Reject promptly even when the supplied operation ignores cancellation.

  const abortedExecution = new Promise<never>((_, reject) => {
    rejectAbortedExecution = reject;

    if (controller.signal.aborted) reject(controller.signal.reason);
    else controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
  });

  try {
    const executionPromise = Promise.resolve(execution(controller.signal));
    return await Promise.race([executionPromise, abortedExecution]);
  } finally {
    // ↓ Release every timer and cross-signal listener after settlement.

    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', forwardCallerAbort);
    controller.signal.removeEventListener('abort', rejectOnAbort);
  }
}
