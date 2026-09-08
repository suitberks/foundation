import { APIRequestError } from './http.errors';
import type { APIContractData, APIContractErrorCode, APIContractResult, FetchResult } from './http.types';

/**
 * Converts an API contract envelope into a mutually exclusive safe result.
 * Only `APIError` values are normalized; rejected fetchers still reject.
 */
export async function fetchSafely<TResult extends APIContractResult<unknown>>(
  fetcher: () => Promise<TResult>
): Promise<FetchResult<APIContractData<TResult>, APIContractErrorCode<TResult>>> {
  const response = await fetcher();

  if (response.kind === 'error') return { error: response.error, data: null };
  return { error: null, data: response.data as APIContractData<TResult> };
}

/**
 * Returns successful API data and throws `APIRequestError` for a failed envelope.
 * Transport and programming rejections propagate without replacement.
 */
export async function fetchAndThrow<TResult extends APIContractResult<unknown>>(
  fetcher: () => Promise<TResult>
): Promise<APIContractData<TResult>> {
  const response = await fetcher();

  if (response.kind === 'error') throw new APIRequestError(response.status, response.error);
  return response.data as APIContractData<TResult>;
}
