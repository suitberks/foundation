import type { Execution, MeasuredExecution } from './execution.types';

/**
 * Measures a synchronous or async execution while preserving its resolved result.
 * Rejected operations propagate unchanged and never produce a measurement result.
 *
 * @example
 * const { result, executionTime } = await measureExecutionTime(async () => {
 *   return await fetchData();
 * });
 * console.log(`Execution time: ${executionTime}ms`);
 */
export async function measureExecutionTime<TData>(fn: Execution<TData>): Promise<MeasuredExecution<TData>> {
  const startedAt = performance.now();
  const result = await fn();
  const executionTime = performance.now() - startedAt;

  return { result, executionTime: Math.round(executionTime) };
}
