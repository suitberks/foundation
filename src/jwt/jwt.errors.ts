// Specific errors describing failure scenarios for `JWT`-related operations;
// Used by the owning module to communicate stable and machine-readable failures;

export const jwtErrors = {
  invalidExpirationSeconds: () => new RangeError('invalidExpirationSeconds'),
};

// ↓ Inferred literal union of error codes from `jwtErrors`;
export type JWTErrorCode = keyof typeof jwtErrors;
