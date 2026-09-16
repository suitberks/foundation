import type { ErrorResponseStatus, SuccessResponseStatus } from './response.enums';

/**
 * Determines whether a value is a stable camelCase response error code.
 * Human-readable text and punctuation remain excluded from public envelopes.
 */
export function isResponseErrorCode(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][A-Za-z0-9]*$/.test(value);
}

/**
 * Determines whether a value is a contentful successful response status.
 * Standard and explicitly cast unofficial values must remain within `2xx`.
 */
export function isSuccessResponseStatus(value: unknown): value is SuccessResponseStatus {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false;

  return value >= 200 && value <= 299 && value !== 204 && value !== 205;
}

/**
 * Determines whether a value is a client-side or server-side error response status.
 * Standard and explicitly cast unofficial values must remain within `4xx` or `5xx`.
 */
export function isErrorResponseStatus(value: unknown): value is ErrorResponseStatus {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false;

  return value >= 400 && value <= 599;
}
