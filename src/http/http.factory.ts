import type { APIError, APISuccess, ExceptionStatusCode, SuccessStatusCode } from './http.types';

/**
 * Creates a successful API envelope without cloning its data.
 * Generic inference preserves the exact supplied payload type.
 */
export function success<T = unknown>({ status, data }: { status: SuccessStatusCode; data: T }): APISuccess<T> {
  return { kind: 'data', status, data };
}

/**
 * Creates a failed API envelope with one supported exception status.
 * The supplied message remains unchanged for downstream presentation.
 */
export function failure({ status, error }: { status: ExceptionStatusCode; error: string }): APIError {
  return { kind: 'error', status, error };
}
