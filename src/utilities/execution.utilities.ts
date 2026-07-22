/**
 * Resolves synchronous and asynchronous executions through one promise-based contract.
 * Failures use the supplied fallback or propagate unchanged when none is available.
 *
 * @example
 * await safeExecute(() => fetchData(), (error) => console.error(error));
 */
export async function safeExecute<T, E = never>(
  fn: () => Promise<T> | T,
  onError?: (error: unknown) => E | Promise<E>
): Promise<T | E> {
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
 * Result returned after measuring one successful asynchronous execution.
 * The original value is preserved beside its rounded millisecond duration.
 */
export type MeasuredExecution<T> = {
  /**
   * Value resolved by the measured execution without cloning or transformation.
   * Its generic type remains identical to the original asynchronous result.
   */
  result: T;

  /**
   * Rounded wall-clock duration of the measured execution in milliseconds.
   * The value is always collected after the supplied promise resolves.
   */
  executionTime: number;
};

/**
 * Measures an asynchronous execution while preserving its resolved result.
 * Rejected executions propagate unchanged and do not produce a measurement.
 *
 * @example
 * const { result, executionTime } = await measureExecutionTime(async () => {
 *    return await fetchData();
 * });
 * console.log(`Execution time: ${executionTime}ms`);
 */
export async function measureExecutionTime<T>(execution: () => Promise<T>): Promise<MeasuredExecution<T>> {
  const startedAt = performance.now();
  const result = await execution();
  const executionTime = performance.now() - startedAt;

  return { result, executionTime: Math.round(executionTime) };
}
