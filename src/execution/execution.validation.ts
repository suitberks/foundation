import { isNumber } from '@/guard';

import { MAX_TIMER_DELAY_MILLISECONDS } from './execution.constants';
import { executionErrors } from './execution.errors';
import type { RetryExecutionOptions } from './execution.types';

/**
 * Validates one resolved retry delay before its timer is allocated.
 * Only non-negative durations within the timer limit are accepted.
 */
export function validateRetryDelay(delayMilliseconds: number): void {
  const hasValidRetryDelay =
    Number.isFinite(delayMilliseconds) && delayMilliseconds >= 0 && delayMilliseconds <= MAX_TIMER_DELAY_MILLISECONDS;

  if (hasValidRetryDelay === false) {
    throw executionErrors.invalidRetryDelay();
  }
}

/**
 * Validates static retry policy values before the first operation attempt.
 * Dynamic delay values remain validated after their resolver completes.
 */
export function validateRetryExecutionOptions(options: RetryExecutionOptions, maxAttempts: number): void {
  const hasValidMaxAttempts = Number.isInteger(maxAttempts) && maxAttempts >= 1;

  if (hasValidMaxAttempts === false) {
    throw executionErrors.invalidMaxAttempts();
  }

  if (isNumber(options.delayMilliseconds)) {
    validateRetryDelay(options.delayMilliseconds);
  }
}

/**
 * Validates the duration used to bound one execution with a timeout.
 * Only non-negative durations within the timer limit are accepted.
 */
export function validateExecutionTimeout(timeoutMilliseconds: number): void {
  const hasValidExecutionTimeout =
    Number.isFinite(timeoutMilliseconds) &&
    timeoutMilliseconds >= 0 &&
    timeoutMilliseconds <= MAX_TIMER_DELAY_MILLISECONDS;

  if (hasValidExecutionTimeout === false) {
    throw executionErrors.invalidTimeout();
  }
}
