import { executionErrors } from './execution.errors';
import type { RetryExecutionOptions } from './execution.types';

/**
 * Validates static retry policy values before the first operation attempt.
 * Dynamic delay values remain validated after their resolver completes.
 */
export function validateRetryExecutionOptions(options: RetryExecutionOptions, maxAttempts: number): void {
  if (Number.isInteger(maxAttempts) === false || maxAttempts < 1) {
    throw executionErrors.invalidMaxAttempts();
  }

  if (typeof options.delayMilliseconds === 'number') {
    validateRetryDelay(options.delayMilliseconds);
  }
}

/**
 * Validates one resolved delay before a retry timer is allocated.
 * Only finite non-negative millisecond durations are accepted.
 */
export function validateRetryDelay(delayMilliseconds: number): void {
  if (Number.isFinite(delayMilliseconds) === false || delayMilliseconds < 0) {
    throw executionErrors.invalidRetryDelay();
  }
}

/**
 * Validates the duration used to bound an execution with a timeout.
 * Only finite non-negative millisecond durations are accepted.
 */
export function validateExecutionTimeout(timeoutMilliseconds: number): void {
  if (Number.isFinite(timeoutMilliseconds) === false || timeoutMilliseconds < 0) {
    throw executionErrors.invalidTimeout();
  }
}
