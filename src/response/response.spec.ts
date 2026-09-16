import { describe, expect, test } from 'bun:test';

import {
  ERROR_RESPONSE_STATUSES,
  type ErrorCodeOf,
  type ErrorResponse,
  type ErrorResponseStatus,
  type ResolvedResponse,
  type ResponseData,
  ResponseError,
  type ResponseErrorCode,
  type ResponseFailure,
  type ResponseFailureCode,
  type ResponseKind,
  type ResponseResult,
  SUCCESS_RESPONSE_STATUSES,
  type SuccessResponse,
  type SuccessResponseStatus,
  createErrorResponse,
  createSuccessResponse,
  isErrorResponse,
  isErrorResponseStatus,
  isResponseErrorCode,
  isSuccessResponse,
  isSuccessResponseStatus,
  responseKind,
  responseKindsArray,
  responseKindsRecord,
  resolveResponse,
  responseErrors,
  unwrapResponse,
} from '@/index';

// These tests cover response envelopes, error-code validation, resolution, and unwrapping behavior;
// They preserve exact public types, status context, payload identity, and stable failure boundaries;

// == CompileTimeContracts ==============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type ExampleErrors = {
  productNotFound: () => Error;
  productAlreadyExists: () => Error;
};
type ExampleResponse = SuccessResponse<{ id: string }> | ErrorResponse<ErrorCodeOf<ExampleErrors>>;
type _SuccessStatusContract = Assert<IsExact<SuccessResponseStatus, (typeof SUCCESS_RESPONSE_STATUSES)[number]>>;
type _ResponseKindContract = Assert<IsExact<ResponseKind, 'success' | 'error'>>;
type _ErrorStatusContract = Assert<IsExact<ErrorResponseStatus, (typeof ERROR_RESPONSE_STATUSES)[number]>>;
type _ResponseResultContract = Assert<
  IsExact<ResponseResult<{ id: string }, ErrorCodeOf<ExampleErrors>>, ExampleResponse>
>;
type _ResponseErrorCodeContract = Assert<
  IsExact<ResponseErrorCode, 'invalidResponseErrorCode' | 'invalidSuccessResponseStatus' | 'invalidErrorResponseStatus'>
>;
type _ResponseDataContract = Assert<IsExact<ResponseData<ExampleResponse>, { id: string }>>;
type _ResponseFailureContract = Assert<
  IsExact<ResponseFailure<ExampleResponse>, ErrorResponse<ErrorCodeOf<ExampleErrors>>>
>;
type _ResponseFailureCodeContract = Assert<
  IsExact<ResponseFailureCode<ExampleResponse>, 'productNotFound' | 'productAlreadyExists'>
>;
type _ResolvedResponseContract = Assert<
  IsExact<
    ResolvedResponse<{ id: string }, ErrorCodeOf<ExampleErrors>>,
    | { success: true; status: SuccessResponseStatus; data: { id: string }; error: null }
    | {
        success: false;
        status: ErrorResponseStatus;
        data: null;
        error: 'productNotFound' | 'productAlreadyExists';
      }
  >
>;

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error('expectedRejection');
}

// == StatusCatalogs ====================================================

describe('response kind catalog', () => {
  test('keeps literal values and aliases synchronized', () => {
    expect(responseKindsArray).toEqual(['success', 'error']);
    expect(responseKindsRecord).toEqual({ SUCCESS: 'success', ERROR: 'error' });
    expect(responseKind).toBe(responseKindsRecord);
  });
});

describe('response status catalogs', () => {
  test('publishes the complete supported success and error status sets', () => {
    expect(SUCCESS_RESPONSE_STATUSES).toEqual([200, 201, 202, 206]);
    expect(ERROR_RESPONSE_STATUSES).toEqual([
      400, 401, 403, 404, 405, 406, 408, 409, 410, 413, 414, 415, 422, 425, 429, 440, 498, 500, 501, 502, 503, 504,
    ]);
  });

  test('narrows only status values owned by the corresponding catalog', () => {
    expect(isSuccessResponseStatus(201)).toBe(true);
    expect(isSuccessResponseStatus(299)).toBe(false);
    expect(isSuccessResponseStatus(204)).toBe(false);
    expect(isSuccessResponseStatus(404)).toBe(false);
    expect(isErrorResponseStatus(404)).toBe(true);
    expect(isErrorResponseStatus(425)).toBe(true);
    expect(isErrorResponseStatus(520)).toBe(false);
    expect(isErrorResponseStatus(440)).toBe(true);
    expect(isErrorResponseStatus(498)).toBe(true);
    expect(isErrorResponseStatus(200)).toBe(false);
    expect(isErrorResponseStatus('404')).toBe(false);
  });
});

// == ErrorCodes ========================================================

describe('response error codes', () => {
  test.each(['productNotFound', 'authenticationRequired', 'formBodyTooLarge'])('accepts %s', (value) => {
    expect(isResponseErrorCode(value)).toBe(true);
  });

  test.each(['', 'ProductNotFound', 'product_not_found', 'Product not found', 404, null])('rejects %p', (value) => {
    expect(isResponseErrorCode(value)).toBe(false);
  });

  test('creates typed policy failures with stable camelCase codes', () => {
    expect(responseErrors.invalidResponseErrorCode()).toMatchObject({
      name: 'TypeError',
      message: 'invalidResponseErrorCode',
    });
    expect(responseErrors.invalidSuccessResponseStatus()).toMatchObject({
      name: 'RangeError',
      message: 'invalidSuccessResponseStatus',
    });
    expect(responseErrors.invalidErrorResponseStatus()).toMatchObject({
      name: 'RangeError',
      message: 'invalidErrorResponseStatus',
    });
  });
});

// == ResponseFactories =================================================

describe('response factories', () => {
  test('creates a successful envelope without cloning its payload', () => {
    const data = { id: 'user-1', roles: ['admin'] };
    const response = createSuccessResponse(201, data);

    expect(response).toEqual({ kind: 'success', status: 201, data });
    expect(response.data).toBe(data);
  });

  test('creates a failed envelope with a stable machine-readable code', () => {
    expect(createErrorResponse(404, 'userNotFound')).toEqual({
      kind: 'error',
      status: 404,
      error: 'userNotFound',
    });
  });

  test('rejects human-readable error text before creating a public envelope', () => {
    expect(() => createErrorResponse(404, 'User not found')).toThrow('invalidResponseErrorCode');
  });

  test('rejects unsupported statuses that enter outside the static boundary', () => {
    expect(() => createSuccessResponse(500 as SuccessResponseStatus, {})).toThrow('invalidSuccessResponseStatus');
    expect(() => createErrorResponse(399 as ErrorResponseStatus, 'redirectDetected')).toThrow(
      'invalidErrorResponseStatus'
    );
  });

  test('rejects unsupported statuses even when they bypass the static contract', () => {
    expect(() => createSuccessResponse(299 as SuccessResponseStatus, {})).toThrow('invalidSuccessResponseStatus');
    expect(() => createErrorResponse(520 as ErrorResponseStatus, 'originUnavailable')).toThrow(
      'invalidErrorResponseStatus'
    );
  });
});

// == ResponseNarrowing =================================================

describe('response guards', () => {
  test('narrows successful and failed response branches by their shared discriminator', () => {
    const success: ResponseResult<{ id: string }, 'recordNotFound'> = createSuccessResponse(200, { id: 'record-1' });
    const failure: ResponseResult<{ id: string }, 'recordNotFound'> = createErrorResponse(404, 'recordNotFound');

    expect(isSuccessResponse(success)).toBe(true);
    expect(isErrorResponse(success)).toBe(false);
    expect(isSuccessResponse(failure)).toBe(false);
    expect(isErrorResponse(failure)).toBe(true);
  });
});

// == ResponseResolution ================================================

describe('resolveResponse', () => {
  test('preserves successful data identity and status context', async () => {
    const data = { id: 'user-1' };
    const result = await resolveResponse(() => Promise.resolve(createSuccessResponse(202, data)));

    expect(result).toEqual({ success: true, status: 202, data, error: null });
    expect(result.data).toBe(data);
  });

  test('preserves failed error codes and status context', async () => {
    const result = await resolveResponse(() => Promise.resolve(createErrorResponse(409, 'userAlreadyExists')));

    expect(result).toEqual({
      success: false,
      status: 409,
      data: null,
      error: 'userAlreadyExists',
    });
  });

  test('does not hide transport or programming rejections', async () => {
    const failure = new Error('connectionReset');
    const rejection = await captureRejection(resolveResponse(() => Promise.reject(failure)));

    expect(rejection).toBe(failure);
  });
});

// == ResponseUnwrapping ================================================

describe('unwrapResponse', () => {
  test('returns successful response data unchanged', async () => {
    const data = { id: 'user-2' };

    expect(await unwrapResponse(() => Promise.resolve(createSuccessResponse(200, data)))).toBe(data);
  });

  test('throws `ResponseError` with the original code and status', async () => {
    const rejection = await captureRejection(
      unwrapResponse(() => Promise.resolve(createErrorResponse(401, 'authenticationRequired')))
    );

    expect(rejection).toBeInstanceOf(ResponseError);
    expect(rejection).toMatchObject({
      name: 'ResponseError',
      message: 'authenticationRequired',
      code: 'authenticationRequired',
      status: 401,
    });
  });

  test('preserves unexpected operation rejections without wrapping them', async () => {
    const failure = new TypeError('invalidResponse');
    const rejection = await captureRejection(unwrapResponse(() => Promise.reject(failure)));

    expect(rejection).toBe(failure);
  });
});
