import type { ExceptionStatusCode } from './http.types';

/**
 * Represents an error envelope rejected by an API request resolver.
 * The original status and typed code remain available for client handling.
 */
export class APIRequestError<TErrorCode extends string = string> extends Error {
  public readonly code: TErrorCode;
  public readonly status: ExceptionStatusCode;

  public constructor(status: ExceptionStatusCode, code: TErrorCode) {
    super(code);
    this.name = 'APIRequestError';
    this.code = code;
    this.status = status;
  }
}
