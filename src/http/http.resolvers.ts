import type { APIContractData, APIContractResult, FetchResult } from './http.schemas';

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

/** Pure type guard to check if a response is an APIContractResult. */
export function isAPIResponse<TResponseData extends object>(
  responseData: TResponseData
): responseData is TResponseData & APIContractResult<unknown> {
  if (!('kind' in responseData) || !('status' in responseData)) return false;

  const { kind, status } = responseData as { kind?: unknown; status?: unknown };
  return (kind === 'data' || kind === 'error') && (typeof status === 'number' || typeof status === 'string');
}
