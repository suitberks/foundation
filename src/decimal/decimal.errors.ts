// Specific errors describing failure scenarios for `Decimal`-related operations;
// Used by the owning module to communicate stable and machine-readable failures;

export const decimalErrors = {
  invalidDecimalPrecision: () => new RangeError('invalidDecimalPrecision'),
  invalidDecimalScale: () => new RangeError('invalidDecimalScale'),
  invalidDecimalSignedPolicy: () => new TypeError('invalidDecimalSignedPolicy'),
  invalidDecimalZeroPolicy: () => new TypeError('invalidDecimalZeroPolicy'),
};

// ↓ Inferred literal union of error codes from `decimalErrors`;
export type DecimalErrorCode = keyof typeof decimalErrors;
