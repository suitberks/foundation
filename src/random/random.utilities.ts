import {
  DEFAULT_RANDOM_STRING_LENGTH,
  RANDOM_ALPHANUMERIC_CHARACTERS,
  RANDOM_BYTE_ACCEPTANCE_BOUNDARY,
  RANDOM_BYTE_BATCH_SIZE,
} from './random.constants';
import { assertRandomStringLength } from './random.validation';

/**
 * Creates a cryptographically sourced string from the alphanumeric collection.
 * Rejection sampling prevents modulo bias while bounded batches support long output.
 *
 * @example
 * generateRandomString(5); // `aZ3fG`
 * generateRandomString(); // `G5kLm2P9sQ`
 */
export function generateRandomString(length: number = DEFAULT_RANDOM_STRING_LENGTH): string {
  assertRandomStringLength(length);

  let result = '';

  while (result.length < length) {
    // ↓ Bound each Web Crypto request while leaving room for rejected bytes.

    const remainingLength = length - result.length;
    const batchSize = Math.min(Math.max(remainingLength * 2, 1), RANDOM_BYTE_BATCH_SIZE);
    const randomBytes = crypto.getRandomValues(new Uint8Array(batchSize));

    // ↓ Ignore the incomplete modulo range so every character stays equiprobable.

    for (const randomByte of randomBytes) {
      if (randomByte >= RANDOM_BYTE_ACCEPTANCE_BOUNDARY) continue;

      result += RANDOM_ALPHANUMERIC_CHARACTERS.charAt(randomByte % RANDOM_ALPHANUMERIC_CHARACTERS.length);
      if (result.length === length) break;
    }
  }

  return result;
}
