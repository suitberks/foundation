/**
 * Default total attempt count applied when `retryExecution` receives no override.
 * The value includes the initial operation and every subsequent retry attempt.
 */
export const DEFAULT_RETRY_MAX_ATTEMPTS = 3;

/**
 * Largest millisecond delay that JavaScript timers schedule without overflowing.
 * Larger values would wrap around and fire almost immediately instead of waiting.
 */
export const MAX_TIMER_DELAY_MILLISECONDS = 2_147_483_647;
