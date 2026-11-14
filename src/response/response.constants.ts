/**
 * Matches stable camelCase error codes accepted by the public response envelopes.
 * Human-readable text, punctuation, and leading capitals remain outside the code.
 */
export const RESPONSE_ERROR_CODE_PATTERN = /^[a-z][A-Za-z0-9]*$/;
