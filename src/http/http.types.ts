import type { EXCEPTION_STATUS_CODES, SUCCESS_STATUS_CODES } from './http.constants';

export type SuccessStatusCode = (typeof SUCCESS_STATUS_CODES)[number];
export type ExceptionStatusCode = (typeof EXCEPTION_STATUS_CODES)[number];

// Unified contracts describe API responses shared across services in the same space;
// Their discriminated shapes keep successful data separate from reported failures;

export type APISuccess<TData = void> = { kind: 'data'; status: SuccessStatusCode; data: TData };
export type APIError = { kind: 'error'; status: ExceptionStatusCode; error: string };
export type APIContractResult<TData = void> = APISuccess<TData> | APIError;

// Contract helpers extract individual branches and describe safe resolution results;
// Derived types preserve the original response data without duplicating its contract;

export type APIContractData<TResult extends APIContractResult<unknown>> =
  TResult extends APISuccess<infer TData> ? TData : never;
export type APIContractError<TResult extends APIContractResult<unknown>> = Extract<TResult, APIError>;
export type FetchResult<TData> = { error: null; data: TData } | { error: string; data: null };
