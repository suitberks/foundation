import type { DecimalFormat } from './decimal.types';

const DECIMAL_ZERO_PATTERN = /^-?0(?:\.0+)?$/; // ← Matches every canonical signed textual zero.
const decimalPatternCache = new WeakMap<DecimalFormat, RegExp>();

/**
 * Builds the private recognition expression for one validated decimal format.
 * Canonical strings require an integer part and reject redundant leading zeros.
 */
function createDecimalPattern(format: DecimalFormat): RegExp {
  const integerDigits = format.precision - format.scale;
  const signPattern = format.signed ? '-?' : '';
  const fractionPattern = format.scale === 0 ? '' : `(?:\\.\\d{1,${format.scale}})?`;

  return new RegExp(`^${signPattern}(?:0|[1-9]\\d{0,${integerDigits - 1}})${fractionPattern}$`);
}

/**
 * Resolves and caches the private recognition expression for one decimal format.
 * Repeated validation reuses the compiled expression without exposing regex details.
 */
function resolveDecimalPattern(format: DecimalFormat): RegExp {
  const cachedPattern = decimalPatternCache.get(format);
  if (cachedPattern !== undefined) return cachedPattern;

  const decimalPattern = createDecimalPattern(format);
  decimalPatternCache.set(format, decimalPattern);

  return decimalPattern;
}

/**
 * Recognizes a canonical decimal string under one validated format definition.
 * Accepted values remain compatible with the PostgreSQL decimal columns they model.
 */
export function isDecimalString(value: string, format: DecimalFormat): boolean {
  const decimalPattern = resolveDecimalPattern(format);

  const hasValidShape = decimalPattern.test(value);
  if (hasValidShape === false) return false;

  return format.zeroAllowed || DECIMAL_ZERO_PATTERN.test(value) === false;
}
