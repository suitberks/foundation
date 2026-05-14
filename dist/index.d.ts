declare const SUCCESS_STATUS_CODES: readonly [200, 201, 202, 307];
declare const EXCEPTION_STATUS_CODES: readonly [400, 401, 403, 404, 405, 409, 500];

type SuccessStatusCode = (typeof SUCCESS_STATUS_CODES)[number];
type ExceptionStatusCode = (typeof EXCEPTION_STATUS_CODES)[number];
type APISuccess<T = void> = {
    kind: 'data';
    status: SuccessStatusCode;
    data: T;
};
type APIError = {
    kind: 'error';
    status: ExceptionStatusCode;
    error: string;
};
type APIContractResult<TData = void> = APISuccess<TData> | APIError;
type APIContractData<TResult extends APIContractResult<unknown>> = TResult extends APISuccess<infer TData> ? TData : never;
type APIContractError<TResult extends APIContractResult<unknown>> = Extract<TResult, APIError>;
/** Discriminated union result of a fetch operation. If `error` is set, `data` is null and vice versa. */
type FetchResult<T> = {
    error: null;
    data: T;
} | {
    error: Error;
    data: null;
};

/** Factory for creating successful API responses with serializable data. */
declare function success<T = unknown>({ status, data }: {
    status: SuccessStatusCode;
    data: T;
}): APISuccess<T>;
/** Factory for creating API error responses, including the error message. */
declare function failure({ status, error }: {
    status: ExceptionStatusCode;
    error: string;
}): APIError;

/** Resolves an APIContractResult fetcher into a FetchResult discriminated union. */
declare function fetchSafely<TResult extends APIContractResult<unknown>>(fetcher: () => Promise<TResult>): Promise<FetchResult<APIContractData<TResult>>>;
/** Resolves an APIContractResult fetcher, throwing an error if the result is an APIError. */
declare function fetchAndThrow<TResult extends APIContractResult<unknown>>(fetcher: () => Promise<TResult>): Promise<APIContractData<TResult>>;

export { type APIContractData, type APIContractError, type APIContractResult, type APIError, type APISuccess, EXCEPTION_STATUS_CODES, type ExceptionStatusCode, type FetchResult, SUCCESS_STATUS_CODES, type SuccessStatusCode, failure, fetchAndThrow, fetchSafely, success };
