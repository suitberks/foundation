import { isBoolean } from '@/guard';

import { base64AlphabetsArray } from './base64.enums';
import type { Base64Alphabet } from './base64.enums';
import { base64Errors } from './base64.errors';

/**
 * Validates resolved Base64 options before any bytes or text are processed.
 * Unsupported alphabets and non-boolean padding policies reject explicitly.
 */
export function assertBase64Options(alphabet: Base64Alphabet, omitPadding: boolean): void {
  const isSupportedAlphabet = base64AlphabetsArray.some((value) => value === alphabet);

  if (isSupportedAlphabet === false) {
    throw base64Errors.invalidBase64Alphabet();
  }

  if (isBoolean(omitPadding) === false) {
    throw base64Errors.invalidBase64PaddingPolicy();
  }
}
