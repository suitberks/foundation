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
 * Creates Hono middleware with configurable body capture, correlation, and output.
 * Sensitive values are redacted before the completed request line reaches its writer.
 */
export function createLoggingMiddleware(options: HonoLoggingMiddlewareOptions = {}): MiddlewareHandler {
  const { bodyPreviewEdgeLength } = options;

  // ↓ Reject invalid static policy while constructing middleware instead of during a request.

  const isInvalidBodyPreviewEdgeLength =
    bodyPreviewEdgeLength !== undefined &&
    (Number.isInteger(bodyPreviewEdgeLength) === false || bodyPreviewEdgeLength < 1);

  if (isInvalidBodyPreviewEdgeLength) {
    throw loggingErrors.invalidBodyPreviewEdgeLength();
  }

  const service = options.service ?? HONO_LOGGING_SERVICE;
  const includeBody = options.includeBody ?? true;
  const requestIdHeader = options.requestIdHeader ?? HONO_REQUEST_ID_HEADER;
  const write = options.write ?? ((message, serviceName) => log.info(message, serviceName));

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
 * Applications may use the factory when request capture or output needs configuration.
 */
export const loggingMiddleware = createLoggingMiddleware();
