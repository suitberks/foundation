// Specific errors describing failure scenarios for `Base64`-related operations.
// Used by the owning module to communicate stable and machine-readable failures.

export const base64Errors = {
  invalidBase64Alphabet: () => new TypeError('invalidBase64Alphabet'),
  invalidBase64PaddingPolicy: () => new TypeError('invalidBase64PaddingPolicy'),
  invalidBase64Value: () => new TypeError('invalidBase64Value'),
};

// Inferred literal union of error codes from `base64Errors`.
export type Base64ErrorCode = keyof typeof base64Errors;
