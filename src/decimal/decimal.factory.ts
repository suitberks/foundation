import { isBoolean } from '@/type';

import { decimalErrors } from './decimal.errors';
import type { DecimalFormat, DecimalFormatOptions } from './decimal.types';

/**
 * Defines a validated format for canonical decimal-string recognition.
 * The frozen result resolves optional sign and zero policies to stable defaults.
 */
export function defineDecimalFormat(options: DecimalFormatOptions): DecimalFormat {
  const { precision, scale, signed = false, zeroAllowed = true } = options;

  const hasValidPrecision = Number.isSafeInteger(precision) && precision > 0;

  if (hasValidPrecision === false) {
    throw decimalErrors.invalidDecimalPrecision();
  }

  const hasValidScale = Number.isSafeInteger(scale) && scale >= 0 && scale < precision;

  if (hasValidScale === false) {
    throw decimalErrors.invalidDecimalScale();
  }

  if (isBoolean(signed) === false) {
    throw decimalErrors.invalidDecimalSignedPolicy();
  }

  if (isBoolean(zeroAllowed) === false) {
    throw decimalErrors.invalidDecimalZeroPolicy();
  }

  return Object.freeze({ precision, scale, signed, zeroAllowed });
}
