/**
 * Synchronous or asynchronous operation consumed by execution utilities.
 * The resolved value remains inferred from its callback without widening.
 */
export type Execution<TData> = () => TData | Promise<TData>;

/**
 * Mutually exclusive result produced after capturing an operation outcome.
 * Successful data and unknown failures are distinguished by `success`.
 */
export type ExecutionResult<TData> = { success: true; data: TData } | { success: false; error: unknown };

/**
 * Context supplied to every operation attempt executed by `retryExecution`.
 * Attempts are one-based and share an optional caller cancellation signal.
 */
export type RetryExecutionContext = Readonly<{
  /**
   * One-based number of the attempt currently being executed.
   * The initial operation always receives the `attempt` value `1`.
   */
  attempt: number;

  /**
   * Optional signal allowing the operation to observe caller cancellation.
   * The same signal remains available across every execution attempt.
   */
  signal?: AbortSignal;
}>;

/**
 * Configuration controlling retry limits, delays, filtering, and cancellation.
 * Three immediate attempts run by default when every failure remains retryable.
 */
export type RetryExecutionOptions = Readonly<{
  /**
   * Positive total attempt count including the initial execution.
   * Omitting this option applies the default of three attempts.
   */
  maxAttempts?: number;

  /**
   * Delay before the next attempt, or a resolver returning it in milliseconds.
   * The resolver receives the failure and completed one-based attempt number.
   */
  delayMilliseconds?: number | ((error: unknown, attempt: number) => number | Promise<number>);

  /**
   * Decides whether another attempt may follow the latest operation failure.
   * Returning `false` preserves and immediately rethrows the original failure.
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean | Promise<boolean>;

  /**
   * Cancels pending delays and prevents subsequent attempts when aborted.
   * Active operations must observe the signal to stop their own work.
   */
  signal?: AbortSignal;
}>;

/**
 * Configuration for one cooperatively cancellable time-bounded execution.
 * Caller cancellation and timeout expiration retain their original reasons.
 */
export type ExecuteWithTimeoutOptions = Readonly<{
  /**
   * Non-negative finite execution duration expressed in milliseconds.
   * Expiration aborts with a standard `TimeoutError` DOM exception.
   */
  timeoutMilliseconds: number;

  /**
   * Optional caller signal combined with the internally managed timeout signal.
   * Its cancellation reason takes precedence when the signal is already aborted.
   */
  signal?: AbortSignal;
}>;
