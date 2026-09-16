import type { Execution } from './execution.types';

/**
 * Result returned after measuring a successful synchronous or asynchronous execution.
 * The resolved value remains available beside its rounded millisecond duration.
 */
export type MeasuredExecution<TData> = {
  /**
   * Value resolved by the measured execution without cloning or transformation.
   * Its generic type remains identical to the original operation result.
   */
  result: TData;

  /**
   * Rounded wall-clock duration of the measured execution in milliseconds.
   * The value is collected only after the supplied operation resolves.
   */
  executionTime: number;
};

/**
 * Measures a synchronous or asynchronous execution while preserving its resolved result.
 * Rejected operations propagate unchanged and never produce a measurement result.
 *
 * @example
 * const { result, executionTime } = await measureExecutionTime(async () => {
 *    return await fetchData();
 * });
 * console.log(`Execution time: ${executionTime}ms`);
 */
export async function measureExecutionTime<TData>(execution: Execution<TData>): Promise<MeasuredExecution<TData>> {
  const startedAt = performance.now();
  const result = await execution();
  const executionTime = performance.now() - startedAt;

  return { result, executionTime: Math.round(executionTime) };
}
