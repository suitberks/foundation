import { isString } from '@/guard';

import { RESPONSE_ERROR_CODE_PATTERN } from './response.constants';
import { errorResponseStatusesArray, responseKind, successResponseStatusesArray } from './response.enums';
import type { ErrorResponseStatus, SuccessResponseStatus } from './response.enums';
import type { ErrorResponse, ResponseResult, SuccessResponse } from './response.types';

/**
 * Determines whether one value is a stable camelCase response error code.
 * Human-readable text and punctuation remain excluded from public envelopes.
 */
export function isResponseErrorCode(value: unknown): value is string {
  return isString(value) && RESPONSE_ERROR_CODE_PATTERN.test(value);
}

/**
 * Determines whether a value belongs to the supported success-status catalog.
 * Runtime membership mirrors the exact union exposed by `SuccessResponseStatus`.
 */
export function isSuccessResponseStatus(value: unknown): value is SuccessResponseStatus {
  return successResponseStatusesArray.some((status) => status === value);
}

/**
 * Determines whether a value belongs to the supported error-status catalog.
 * Runtime membership mirrors the exact union exposed by `ErrorResponseStatus`.
 */
export function isErrorResponseStatus(value: unknown): value is ErrorResponseStatus {
  return errorResponseStatusesArray.some((status) => status === value);
}

/**
 * Narrows a response result to its successful branch through the shared discriminator.
 * Payload and error-code generics remain unchanged for downstream control-flow analysis.
 */
export function isSuccessResponse<TData, TErrorCode extends string>(
  response: ResponseResult<TData, TErrorCode>
): response is SuccessResponse<TData> {
  return response.kind === responseKind.SUCCESS;
}

/**
 * Narrows a response result to its unsuccessful branch through the shared discriminator.
 * Payload and error-code generics remain unchanged for downstream control-flow analysis.
 */
export function isErrorResponse<TData, TErrorCode extends string>(
  response: ResponseResult<TData, TErrorCode>
): response is ErrorResponse<TErrorCode> {
  return response.kind === responseKind.ERROR;
}
