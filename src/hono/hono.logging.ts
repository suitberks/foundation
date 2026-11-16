import type { MiddlewareHandler } from 'hono';

import {
  createHTTPRequestBodyPreview,
  formatHTTPRequestLog,
  log,
  loggingErrors,
  redactSensitiveSearchParams,
} from '@/logging';

import { HONO_LOGGING_SERVICE, HONO_REQUEST_ID_HEADER } from './hono.constants';
import { getHonoRequestId } from './hono.request-id';
import type { HonoLoggingMiddlewareOptions } from './hono.types';

/**
 * Writes one completed request line through the shared informational logger.
 * The logger resolves per call so replaced or observed methods stay effective.
 */
function writeHonoRequestLog(message: string, service: string): void {
  log.info(message, service);
}

/**
 * Creates Hono middleware with configurable body capture, correlation, and output.
 * Sensitive values are redacted before the completed request line reaches its writer.
 */
export function createLoggingMiddleware(options: HonoLoggingMiddlewareOptions = {}): MiddlewareHandler {
  const { bodyPreviewEdgeLength, includeBody = true, service = HONO_LOGGING_SERVICE, ...outputOptions } = options;
  const { requestIdHeader = HONO_REQUEST_ID_HEADER, write = writeHonoRequestLog } = outputOptions;

  const hasValidBodyPreviewEdgeLength =
    // Reject invalid static policy while constructing middleware instead of during a request.
    bodyPreviewEdgeLength === undefined || (Number.isInteger(bodyPreviewEdgeLength) && bodyPreviewEdgeLength >= 1);

  if (hasValidBodyPreviewEdgeLength === false) {
    throw loggingErrors.invalidBodyPreviewEdgeLength();
  }

  return async (context, next) => {
    const contentType = context.req.header('content-type');
    const searchParams = redactSensitiveSearchParams(new URL(context.req.url).searchParams).toString();
    const bodyPreview = includeBody
      ? await createHTTPRequestBodyPreview(context.req.raw, contentType, bodyPreviewEdgeLength)
      : undefined;

    // ↓ Measure only processing so the final response status and duration share one boundary.

    const startTime = performance.now();
    await next();
    const duration = Math.round(performance.now() - startTime);

    const message = formatHTTPRequestLog({
      method: context.req.method,
      status: context.res.status,
      duration,
      path: context.req.path,
      searchParams,
      bodyPreview,
      requestId: getHonoRequestId(context, requestIdHeader),
    });

    write(message, service);
  };
}

/**
 * Ready-to-use Hono request logger backed by the shared default logging policy.
 * Applications may use the factory when request capture or output needs changes.
 */
export const loggingMiddleware = createLoggingMiddleware();
