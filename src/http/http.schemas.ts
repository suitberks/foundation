import type { EXCEPTION_STATUS_CODES, SUCCESS_STATUS_CODES } from './http.constants';

export type SuccessStatusCode = (typeof SUCCESS_STATUS_CODES)[number];
export type ExceptionStatusCode = (typeof EXCEPTION_STATUS_CODES)[number];

// Unified interface for API responses across different services in the same space
// (one project with different API applications, e.g., service-one & service-two).

export type APISuccess<T = void> = { kind: 'data'; status: SuccessStatusCode; data: T };
export type APIError = { kind: 'error'; status: ExceptionStatusCode; error: string };

// Derived types for API contract results, allowing extraction of data and error types from
// a union of success and error responses, facilitating type-safe handling of API responses.

export type APIContractResult<TData = void> = APISuccess<TData> | APIError;
export type APIContractData<TResult extends APIContractResult<unknown>> =
  TResult extends APISuccess<infer TData> ? TData : never;
export type APIContractError<TResult extends APIContractResult<unknown>> = Extract<TResult, APIError>;

/**
 * Discriminated union result of a fetch operation.
 * If `error` is set, `data` is null and vice versa.
 */
export type FetchResult<T> = { error: null; data: T } | { error: string; data: null };
