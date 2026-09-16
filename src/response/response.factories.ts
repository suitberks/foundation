import { responseKind } from './response.enums';
import type { ErrorResponseStatus, SuccessResponseStatus } from './response.enums';
import { responseErrors } from './response.errors';
import type { ErrorResponse, SuccessResponse } from './response.types';
import { isErrorResponseStatus, isResponseErrorCode, isSuccessResponseStatus } from './response.validation';

/**
 * Creates a successful response envelope without cloning its supplied data.
 * Generic inference preserves the exact payload type for downstream contracts.
 */
export function createSuccessResponse<TData>(status: SuccessResponseStatus, data: TData): SuccessResponse<TData> {
  if (!isSuccessResponseStatus(status)) throw responseErrors.invalidSuccessResponseStatus();

  return { kind: responseKind.SUCCESS, status, data };
}

/**
 * Creates a failed response envelope from one stable machine-readable error code.
 * Human-readable or malformed values reject before crossing the response boundary.
 */
export function createErrorResponse<const TErrorCode extends string>(
  status: ErrorResponseStatus,
  error: TErrorCode
): ErrorResponse<TErrorCode> {
  if (!isErrorResponseStatus(status)) throw responseErrors.invalidErrorResponseStatus();
  if (!isResponseErrorCode(error)) throw responseErrors.invalidResponseErrorCode();

  return { kind: responseKind.ERROR, status, error };
}
