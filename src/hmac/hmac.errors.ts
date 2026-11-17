// Specific errors describing failure scenarios for `HMAC`-related operations.
// Used by the owning module to communicate stable and machine-readable failures.

export const hmacErrors = {
  invalidSignatureAlgorithm: () => new TypeError('invalidSignatureAlgorithm'),
  invalidSignatureEncoding: () => new TypeError('invalidSignatureEncoding'),
  incompatibleCryptoKey: () => new TypeError('incompatibleCryptoKey'),
  invalidHexSignature: () => new TypeError('invalidHexSignature'),
  invalidBase64Signature: () => new TypeError('invalidBase64Signature'),
  invalidBase64UrlSignature: () => new TypeError('invalidBase64UrlSignature'),
};

// Inferred literal union of error codes from `hmacErrors`.
export type HMACErrorCode = keyof typeof hmacErrors;
