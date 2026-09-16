import { responseKind } from './response.enums';
import { ResponseError } from './response.errors';
import type { ResolvedResponse, ResponseData, ResponseFailureCode, ResponseResult } from './response.types';

/**
 * Resolves a response envelope into a status-preserving discriminated result.
 * Transport and programming failures remain observable promise rejections.
 */
export async function resolveResponse<TResult extends ResponseResult<unknown>>(
  operation: () => Promise<TResult>
): Promise<ResolvedResponse<ResponseData<TResult>, ResponseFailureCode<TResult>>> {
  const response = await operation();

  if (response.kind === responseKind.ERROR) {
    return {
      success: false,
      status: response.status,
      data: null,
      error: response.error,
    };
  }

  return {
    success: true,
    status: response.status,
    data: response.data as ResponseData<TResult>,
    error: null,
  };
}

/**
 * Unwraps successful response data and throws `ResponseError` for a failed envelope.
 * Transport and programming failures propagate without replacement or normalization.
 */
export async function unwrapResponse<TResult extends ResponseResult<unknown>>(
  operation: () => Promise<TResult>
): Promise<ResponseData<TResult>> {
  const response = await operation();

  if (response.kind === responseKind.ERROR) {
    throw new ResponseError(response.status, response.error);
  }

  return response.data as ResponseData<TResult>;
}
