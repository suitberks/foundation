import { ErrorHandler, Context, TypedResponse } from 'hono';
import { z, ZodNumber } from 'zod';
import { Locale } from 'date-fns';

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
 * Global error handler for Hono framework. Catches all exceptions thrown in route handlers and middlewares.
 * Distinguishes between expected HTTPExceptions (mapped to their status codes) and unexpected errors (500).
 */
declare const onHandlerError: ErrorHandler;

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

/**
 * Returns the current time in the specified timezone.
 * Example: getZonedTime({ tz: 'America/New_York' }) = new Date('2026-03-15T12:00:00Z')
 */
declare const getZonedTime: ({ tz }?: {
    tz?: string;
}) => Date;
/**
 * Returns the timezone offset in the format (+4 UTC) / (-5 UTC).
 * Example: getUTCOffset(new Date('2026-03-15T12:00:00Z'), 'America/New_York') = '(-4 UTC)'
 */
declare const getUTCOffset: (date: Date, tz: string) => string;
/**
 * Returns the current time in the specified timezone, formatted as HH:mm:ss (+X UTC).
 * Example: getFormattedTime({ tz: 'America/New_York' }) = '12:00:00 (-4 UTC)'
 */
declare const getFormattedTime: ({ tz }?: {
    tz?: string;
}) => string;
/**
 * Returns the current date in the specified timezone, formatted as dd.MM.yyyy.
 * By default, it also includes time (HH:mm:ss) and timezone offset.
 * Example: getFormattedDate({ tz: 'America/New_York' }) = '03.15.2026 12:00:00 (-4 UTC)'
 */
declare const getFormattedDate: ({ tz, withTime, }?: {
    tz?: string;
    withTime?: boolean;
}) => string;
/**
 * Formats the given time in the specified timezone, using the provided locale for date formatting.
 * Example: formatTime(new Date('2026-03-15T12:00:00Z'), { tz: 'America/New_York' }) = '12:00:00, March 15, 2026 (-4 UTC)'
 */
declare const formatTime: (time: Date, { locale, tz }?: {
    locale?: Locale;
    tz?: string;
}) => string;

/**
 * Safely executes functions and handles errors without using try/catch in the calling code.
 * Example: safeExecute(() => fetchData(), (error) => console.error(error));
 */
declare function safeExecute<T, E = never>(fn: () => Promise<T> | T, onError?: (error?: unknown) => E | Promise<E>): Promise<T | E>;

/**
 * Creates a random string of the specified length using characters from DEFAULT_CHARACTERS.
 * Example: generateRandomString(5) = 'aZ3fG' / generateRandomString() = 'G5kLm2P9sQ' (default 10 characters)
 */
declare function generateRandomString(length?: number): string;

/**
 * HTTP status colors for better visual parsing in logs:
 * 2xx - green, 4xx - yellow, 5xx - red, others - default color.
 */
declare function getColoredHTTPStatus(status: number): (text: string) => string;
/**
 * Unified logging interface for different levels (info, warn, error)
 * with optional service name and stack trace for errors.
 */
declare const log: {
    info: (message: string, service?: string) => void;
    warn: (message: string, service?: string) => void;
    error: (message: string, service?: string, stack?: string) => void;
};

export { type APIContractData, type APIContractError, type APIContractResult, type APIError, type APISuccess, EXCEPTION_STATUS_CODES, type ExceptionStatusCode, type FetchResult, SUCCESS_STATUS_CODES, type SerializeDates, type SuccessStatusCode, asQueryBoolean, asQueryNumber, failure, fetchAndThrow, fetchSafely, formatTime, generateRandomString, getColoredHTTPStatus, getFormattedDate, getFormattedTime, getUTCOffset, getZonedTime, log, onHandlerError, respond, safeExecute, success };
