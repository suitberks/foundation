import type { Execution, ExecutionResult } from './execution.types';

/**
 * Resolves synchronous and asynchronous operations through one promise-based contract.
 * Failures use the supplied fallback or propagate unchanged when none is available.
 *
 * @example
 * await safeExecute(() => fetchData(), (error) => console.error(error));
 */
export async function safeExecute<TData, TErrorResult = never>(
  fn: Execution<TData>,
  onError?: (error: unknown) => TErrorResult | Promise<TErrorResult>
): Promise<TData | TErrorResult> {
  try {
    return await fn();
  } catch (error) {
    if (onError) return await onError(error);

    // Without a fallback, the original failure remains observable to the caller;
    // Preserving its identity avoids hiding stack traces and domain error details;

    throw error;
  }
}

/**
 * Captures a synchronous or asynchronous operation in a discriminated result.
 * Successful values and original unknown failures remain available unchanged.
 */
export async function captureExecution<TData>(execution: Execution<TData>): Promise<ExecutionResult<TData>> {
  try {
    return {
      success: true,
      data: await execution(),
    };
  } catch (error) {
    return { success: false, error };
  }
}
