import { describe, expect, test } from 'bun:test';

import {
  type APIContractData,
  type APIContractError,
  type APIContractResult,
  type APIError,
  type APISuccess,
  EXCEPTION_STATUS_CODES,
  type ExceptionStatusCode,
  type FetchResult,
  SUCCESS_STATUS_CODES,
  type SuccessStatusCode,
  failure,
  fetchAndThrow,
  fetchSafely,
  success,
} from '@/index';

// =====================================================================================================================
// COMPILE-TIME PUBLIC TYPE CONTRACTS
// =====================================================================================================================

/**
 * Compares public types in both assignability directions for exactness.
 * Compile-time assertions use it to detect widened contract branches.
 */
type IsExact<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2
    ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends Actual ? 1 : 2
      ? true
      : false
    : false;

/** Constrains one compile-time proposition to `true`. */
type Assert<Condition extends true> = Condition;

type ExampleContract = APISuccess<{ id: string }> | APIError;
type _SuccessStatusContract = Assert<IsExact<SuccessStatusCode, 200 | 201 | 202 | 307>>;
type _ExceptionStatusContract = Assert<IsExact<ExceptionStatusCode, 400 | 401 | 403 | 404 | 405 | 409 | 500>>;
type _ContractDataExtraction = Assert<IsExact<APIContractData<ExampleContract>, { id: string }>>;
type _ContractErrorExtraction = Assert<IsExact<APIContractError<ExampleContract>, APIError>>;
type _FetchResultContract = Assert<
  IsExact<FetchResult<{ id: string }>, { error: null; data: { id: string } } | { error: string; data: null }>
>;

/**
 * Resolves both discriminated branches through the public fields consumers use for narrowing.
 * Keeping this helper typed also makes accidental changes to the union discriminator fail typecheck.
 */
function describeContractResult(result: APIContractResult<{ id: string }>): string {
  return result.kind === 'data' ? result.data.id : result.error;
}

/**
 * Captures a rejected value without relying on matcher-specific asynchronous typing.
 * A resolved promise is itself a test failure because these call sites must reject.
 */
async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error('Expected the promise to reject');
}

// =====================================================================================================================
// STATUS CONSTANTS AND RESPONSE FACTORIES
// =====================================================================================================================

describe('HTTP status constants', () => {
  test('publishes the complete supported success and exception status sets', () => {
    expect(SUCCESS_STATUS_CODES).toEqual([200, 201, 202, 307]);
    expect(EXCEPTION_STATUS_CODES).toEqual([400, 401, 403, 404, 405, 409, 500]);
  });
});

describe('HTTP response factories', () => {
  test('creates a successful data result without cloning its payload', () => {
    const data = { id: 'user-1', roles: ['admin'] };
    const response = success({ status: 201, data });

    expect(response).toEqual({ kind: 'data', status: 201, data });
    expect(response.data).toBe(data);
    expect(describeContractResult(response)).toBe('user-1');
  });

  test('creates an error result with the requested public shape', () => {
    const response = failure({ status: 404, error: 'User not found' });

    expect(response).toEqual({ kind: 'error', status: 404, error: 'User not found' });
    expect(describeContractResult(response)).toBe('User not found');
  });
});

// =====================================================================================================================
// SAFE RESULT RESOLUTION
// =====================================================================================================================

describe('fetchSafely', () => {
  test('unwraps successful contract data and invokes the fetcher once', async () => {
    const data = { id: 'user-1' };
    let invocations = 0;

    const result = await fetchSafely(() => {
      invocations += 1;
      return Promise.resolve(success({ status: 200, data }));
    });

    expect(invocations).toBe(1);
    expect(result).toEqual({ error: null, data });
    expect(result.data).toBe(data);
  });

  test('turns a contract error into the mutually exclusive `FetchResult` branch', async () => {
    const result = await fetchSafely(() => Promise.resolve(failure({ status: 409, error: 'Already exists' })));

    expect(result).toEqual({ error: 'Already exists', data: null });
  });

  test('does not hide rejections that happen before an API contract result exists', async () => {
    const transportError = new Error('Connection reset');

    // `fetchSafely` normalizes APIError values; transport and programming failures remain observable rejections.
    const rejection = await captureRejection(fetchSafely(() => Promise.reject(transportError)));

    expect(rejection).toBe(transportError);
  });
});

// =====================================================================================================================
// THROWING RESULT RESOLUTION
// =====================================================================================================================

describe('fetchAndThrow', () => {
  test('returns successful contract data unchanged', async () => {
    const data = { id: 'user-2' };
    const result = await fetchAndThrow(() => Promise.resolve(success({ status: 202, data })));

    expect(result).toBe(data);
  });

  test('throws an `Error` carrying the contract error message', async () => {
    const rejection = await captureRejection(
      fetchAndThrow(() => Promise.resolve(failure({ status: 401, error: 'Authentication required' })))
    );

    expect(rejection).toBeInstanceOf(Error);
    expect((rejection as Error).message).toBe('Authentication required');
  });

  test('preserves an unexpected fetcher rejection instead of wrapping it', async () => {
    const unexpectedError = new TypeError('Invalid response');
    const rejection = await captureRejection(fetchAndThrow(() => Promise.reject(unexpectedError)));

    expect(rejection).toBe(unexpectedError);
  });
});
