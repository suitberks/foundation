import type { APIContractData, APIContractResult, APIError, FetchResult } from './http.schemas';

/** Resolves an APIContractResult fetcher into a FetchResult discriminated union. */
export async function fetchSafely<TResult extends APIContractResult<unknown>>(
  fetcher: () => Promise<TResult>
): Promise<FetchResult<APIContractData<TResult>>> {
  const response = await fetcher();
  if (response.kind === 'error') return { error: response.error, data: null };
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

/** Pure type guard for APIError responses, used to narrow the type of a response object. */
export function isErrorResponse<TResponse>(response: TResponse): response is TResponse & APIError {
  if (typeof response !== 'object' || response === null) return false;
  if (!('kind' in response) || !('status' in response)) return false;

  const { kind, status } = response as { kind?: unknown; status?: unknown };
  return kind === 'error' && (typeof status === 'number' || typeof status === 'string');
}
