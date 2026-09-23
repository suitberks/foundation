// Specific errors describing failure scenarios for `Random`-related operations.
// Used by the owning module to communicate stable and machine-readable failures.

export const randomErrors = {
  invalidRandomStringLength: () => new RangeError('invalidRandomStringLength'),
};

// ↓ Inferred literal union of error codes from `randomErrors`.
export type RandomErrorCode = keyof typeof randomErrors;
