import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { createErrorResponse, isErrorResponseStatus, isResponseErrorCode } from '@/response';
import type { ErrorResponse, ErrorResponseStatus } from '@/response';

import { honoErrors } from './hono.errors';
import { getHonoRequestId } from './hono.request-id';
import type { HonoErrorHandlerOptions } from './hono.types';

/**
 * Identifies client HTTP exceptions safe to expose through the shared response envelope.
 * Both status membership and camelCase error-code syntax must satisfy the contract.
 */
function isExpectedHTTPException(error: unknown): error is HTTPException & { status: ErrorResponseStatus } {
  // ↓ Exclude unknown failures and server-side exceptions before inspecting public fields.

  const isHTTPException = error instanceof HTTPException;
  if (isHTTPException === false) return false;

  const isServerError = error.status >= 500;
  if (isServerError) return false;

  // ↓ Enforce the closed status catalog and machine-readable error-code format together.

  const isSupportedStatus = isErrorResponseStatus(error.status);
  const isMachineReadableCode = isResponseErrorCode(error.message);

  return isSupportedStatus && isMachineReadableCode;
}

/**
 * Creates a Hono error handler that preserves expected machine-readable exceptions.
 * Unexpected failures invoke application reporting before returning a stable fallback.
 */
export function createHonoErrorHandler(options: HonoErrorHandlerOptions): ErrorHandler {
  return (error, context) => {
    if (isExpectedHTTPException(error)) {
      const response = createErrorResponse(error.status, error.message);

      // Hono represents concrete unofficial statuses through its `-1` type-level escape hatch.
      return context.json(response, response.status as ContentfulStatusCode);
    }

    options.onUnexpectedError(error, context, getHonoRequestId(context));

    const fallback = honoErrors.internalServerError();

    // Hono's `HTTPException` type erases the literal status supplied to its constructor.
    const status = fallback.status as 500;
    const response: ErrorResponse = createErrorResponse(status, fallback.message);

    return context.json(response, status);
  };
}
