import { Context, TypedResponse } from 'hono';
import { z, ZodNumber } from 'zod';

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

/**
 * Type utility that recursively transforms all Date fields to string, as well as handling arrays and objects.
 * This is necessary for proper typing when working with RPC, as JSON does not support the Date type directly.
 * Example: SerializeDates<{ createdAt: Date; nested: { updatedAt: Date }; tags: Date[] }> \
 * = { createdAt: string; nested: { updatedAt: string }; tags: string[] }
 */
type SerializeDates<T> = T extends Date ? string : T extends (infer U)[] ? SerializeDates<U>[] : T extends readonly (infer U)[] ? readonly SerializeDates<U>[] : T extends object ? {
    [K in keyof T]: SerializeDates<T[K]>;
} : T;
/**
 * Transforms a string to a number (when passing query parameters).
 * Example: asQueryNumber(z.number())('123') = 123
 */
declare const asQueryNumber: <T extends ZodNumber>(schema: T) => z.ZodPreprocess<T>;
/**
 * Transforms various string representations of boolean values into actual booleans.
 * See POSITIVE_VALUES and NEGATIVE_VALUES arrays below for supported inputs.
 */
declare const asQueryBoolean: <T extends z.ZodTypeAny>(schema: T) => z.ZodPreprocess<T>;

/**
 * Wraps c.json with a typed success payload & possible APIError.
 * When no data is provided, responds with an empty object {}.
 */
declare function respond<T extends object = Record<string, never>, S extends SuccessStatusCode = SuccessStatusCode>(c: Context, options: {
    status: S;
    data?: T;
}): Response & TypedResponse<APISuccess<SerializeDates<T>> | APIError, S, 'json'>;

export { type APIContractData, type APIContractError, type APIContractResult, type APIError, type APISuccess, EXCEPTION_STATUS_CODES, type ExceptionStatusCode, type FetchResult, SUCCESS_STATUS_CODES, type SerializeDates, type SuccessStatusCode, asQueryBoolean, asQueryNumber, failure, fetchAndThrow, fetchSafely, respond, success };
