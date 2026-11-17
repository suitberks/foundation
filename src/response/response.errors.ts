import type { ErrorResponseStatus } from './response.enums';

// Specific errors describing failure scenarios for `Response`-related operations.
// Used by the owning module to communicate stable and machine-readable failures.

export const responseErrors = {
  invalidSuccessResponseStatus: () => new RangeError('invalidSuccessResponseStatus'),
  invalidErrorResponseStatus: () => new RangeError('invalidErrorResponseStatus'),
  invalidResponseErrorCode: () => new TypeError('invalidResponseErrorCode'),
};

// Inferred literal union of error codes from `responseErrors`.
export type ResponseErrorCode = keyof typeof responseErrors;

/**
 * Represents a failed response rejected while unwrapping a remote operation.
 * The original machine-readable code and response status remain available.
 */
export class ResponseError<TErrorCode extends string = string> extends Error {
  public readonly code: TErrorCode;
  public readonly status: ErrorResponseStatus;

  public constructor(status: ErrorResponseStatus, code: TErrorCode) {
    super(code);
    this.name = 'ResponseError';
    this.code = code;
    this.status = status;
  }
}
