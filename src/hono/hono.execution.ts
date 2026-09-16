import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { EXCEPTION_STATUS_CODES } from '@/http/http.constants';
import { failure } from '@/http/http.factory';
import type { APIError, ExceptionStatusCode } from '@/http/http.types';

import { honoErrors } from './hono.errors';
import type { HonoErrorHandlerOptions } from './hono.types';

/**
 * Identifies client HTTP exceptions safe to expose through the shared API envelope.
 * Both status membership and camelCase error-code syntax must satisfy the contract.
 */
function isExpectedHTTPException(error: unknown): error is HTTPException & { status: ExceptionStatusCode } {
  // Exclude unknown failures and server-side exceptions before inspecting public fields.
  if (!(error instanceof HTTPException) || error.status >= 500) return false;

  // ↓ Enforce the closed status catalog and machine-readable error-code format together.

  const isSupportedStatus = EXCEPTION_STATUS_CODES.some((status) => status === error.status);
  const isMachineReadableCode = /^[a-z][A-Za-z0-9]*$/.test(error.message);

  return isSupportedStatus && isMachineReadableCode;
}

/**
 * Creates a Hono error handler that preserves expected machine-readable exceptions.
 * Unexpected failures invoke application reporting before returning a stable fallback.
 */
export function createHonoErrorHandler(options: HonoErrorHandlerOptions): ErrorHandler {
  return (error, context) => {
    if (isExpectedHTTPException(error)) {
      const response: APIError = failure({ status: error.status, error: error.message });
      return context.json(response, response.status);
    }

    options.onUnexpectedError(error, context);

    const fallback = honoErrors.internalServerError();

    // Hono's `HTTPException` type erases the literal status supplied to its constructor.
    const status = fallback.status as 500;
    const response: APIError = failure({ status, error: fallback.message });

    return context.json(response, response.status);
  };
}
