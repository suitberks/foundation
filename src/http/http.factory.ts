import type { APIError, APISuccess, ExceptionStatusCode, SuccessStatusCode } from './http.schemas';

/**
 * Factory for creating successful API responses with serializable data.
 * Example usage: `success({ status: 200, data: { message: 'Operation successful' } })`
 */
export function success<T = unknown>({ status, data }: { status: SuccessStatusCode; data: T }): APISuccess<T> {
  return { kind: 'data', status, data };
}

/**
 * Factory for creating API error responses, including the error message.
 * Example usage: `failure({ status: 404, error: 'User not found' })`
 */
export function failure({ status, error }: { status: ExceptionStatusCode; error: string }): APIError {
  return { kind: 'error', status, error };
}
