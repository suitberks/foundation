import { randomErrors } from './random.errors';

/**
 * Validates the requested random-string length before allocating random bytes.
 * Only non-negative safe integers can represent a complete output character count.
 */
export function assertRandomStringLength(length: number): void {
  const isValidLength = Number.isSafeInteger(length) && length >= 0;

  if (isValidLength === false) {
    throw randomErrors.invalidRandomStringLength();
  }
}
