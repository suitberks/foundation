import type { ErrorResponseStatus, SuccessResponseStatus, responseKind } from './response.enums';

// ↓ Response envelopes preserve payloads, error codes, and their supported HTTP statuses.
// ↓ Discriminated branches keep successful data separate from machine-readable failures.

export type SuccessResponse<TData = void> = {
  kind: typeof responseKind.SUCCESS;
  status: SuccessResponseStatus;
  data: TData;
};

export type ErrorResponse<TErrorCode extends string = string> = {
  kind: typeof responseKind.ERROR;
  status: ErrorResponseStatus;
  error: TErrorCode;
};

export type ResponseResult<TData = void, TErrorCode extends string = string> =
  | SuccessResponse<TData>
  | ErrorResponse<TErrorCode>;

// ↓ Derived helpers extract response branches and describe resolution without losing status context.
// ↓ Registry keys remain the authoritative source for application-owned machine-readable error codes.

export type ResponseData<TResult extends ResponseResult<unknown>> =
  TResult extends SuccessResponse<infer TData> ? TData : never;

export type ResponseFailure<TResult extends ResponseResult<unknown>> = Extract<TResult, ErrorResponse>;
export type ResponseFailureCode<TResult extends ResponseResult<unknown>> = ResponseFailure<TResult>['error'];
export type ErrorCodeOf<TErrorFactories extends Record<string, unknown>> = keyof TErrorFactories & string;

export type ResolvedResponse<TData, TErrorCode extends string = string> =
  | { success: true; status: SuccessResponseStatus; data: TData; error: null }
  | { success: false; status: ErrorResponseStatus; data: null; error: TErrorCode };
