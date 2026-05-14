import type { APIError, APISuccess, ExceptionStatusCode, SuccessStatusCode } from './http.schemas';

/** Factory for creating successful API responses with serializable data. */
export function success<T = unknown>({ status, data }: { status: SuccessStatusCode; data: T }): APISuccess<T> {
  return { kind: 'data', status, data };
}

/** Factory for creating API error responses, including the error message. */
export function failure({ status, error }: { status: ExceptionStatusCode; error: string }): APIError {
  return { kind: 'error', status, error };
}
