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
 * The supplied error code remains unchanged for downstream resolution.
 */
export function failure<const TErrorCode extends string>({
  status,
  error,
}: {
  status: ExceptionStatusCode;
  error: TErrorCode;
}): APIError<TErrorCode> {
  return { kind: 'error', status, error };
}
