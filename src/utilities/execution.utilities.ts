/**
 * Safely executes functions and handles errors without using try/catch in the calling code.
 * Example usage: `safeExecute(() => fetchData(), (error) => console.error(error))`
 */
export async function safeExecute<T, E = never>(
  fn: () => Promise<T> | T,
  onError?: (error?: unknown) => E | Promise<E>
): Promise<T | E> {
  try {
    return await fn();
  } catch (err) {
    if (onError) return await onError(err);
    // If no error handler is provided, rethrow the error to be handled by the caller or global error handler.
    throw err;
  }
}

export type MeasuredExecution<T> = {
  /** The result of the executed function. */
  result: T;
  /** The time taken to execute the function, in milliseconds. */
  executionTime: number;
};

/**
 * Utility function to measure the execution time of an asynchronous function.
 * @returns An object containing the result of the execution and the time taken in milliseconds.
 *
 * ```ts
 * const { result, executionTime } = await measureExecutionTime(async () => {
 *    return await fetchData();
 * });
 * console.log(`Execution time: ${executionTime}ms`);
 * ```
 */

export async function measureExecutionTime<T>(execution: () => Promise<T>): Promise<MeasuredExecution<T>> {
  const startedAt = performance.now();
  const result = await execution();
  const executionTime = performance.now() - startedAt;

  return { result, executionTime: Math.round(executionTime) };
}
