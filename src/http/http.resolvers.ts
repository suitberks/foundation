import type { APIContractData, APIContractResult, FetchResult } from './http.schemas';

/** Resolves an APIContractResult fetcher into a FetchResult discriminated union. */
export async function fetchSafely<TResult extends APIContractResult<unknown>>(
  fetcher: () => Promise<TResult>
): Promise<FetchResult<APIContractData<TResult>>> {
  const response = await fetcher();
  if (response.kind === 'error') return { error: new Error(response.error), data: null };
  return { error: null, data: response.data as APIContractData<TResult> };
}

/** Resolves an APIContractResult fetcher, throwing an error if the result is an APIError. */
export async function fetchAndThrow<TResult extends APIContractResult<unknown>>(
  fetcher: () => Promise<TResult>
): Promise<APIContractData<TResult>> {
  const response = await fetcher();
  if (response.kind === 'error') throw new Error(response.error);
  return response.data as APIContractData<TResult>;
}
