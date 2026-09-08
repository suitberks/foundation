import type { EXCEPTION_STATUS_CODES, SUCCESS_STATUS_CODES } from './http.constants';

export type SuccessStatusCode = (typeof SUCCESS_STATUS_CODES)[number];
export type ExceptionStatusCode = (typeof EXCEPTION_STATUS_CODES)[number];

// Unified contracts describe API responses shared across services in the same space;
// Their discriminated shapes keep successful data separate from reported failures;

export type APISuccess<TData = void> = {
  kind: 'data';
  status: SuccessStatusCode;
  data: TData;
};

export type APIError<TErrorCode extends string = string> = {
  kind: 'error';
  status: ExceptionStatusCode;
  error: TErrorCode;
};

export type APIContractResult<TData = void, TErrorCode extends string = string> =
  | APISuccess<TData>
  | APIError<TErrorCode>;

// Contract helpers extract individual branches and describe safe resolution results;
// Derived types preserve the original response data without duplicating its contract;

export type APIContractData<TResult extends APIContractResult<unknown>> =
  TResult extends APISuccess<infer TData> ? TData : never;

export type APIContractError<TResult extends APIContractResult<unknown>> = Extract<TResult, APIError>;
export type APIContractErrorCode<TResult extends APIContractResult<unknown>> = APIContractError<TResult>['error'];
export type ErrorCodeOf<TErrorFactories extends Record<string, unknown>> = keyof TErrorFactories & string;

export type FetchResult<TData, TErrorCode extends string = string> =
  | { error: null; data: TData }
  | { error: TErrorCode; data: null };
