import type { MiddlewareHandler } from 'hono';

import { createHTTPRequestBodyPreview, formatHTTPRequestLog, log, redactSensitiveSearchParams } from '@/logging';

/**
 * Logs Hono request metadata with query parameters and a normalized body preview.
 * Sensitive values are redacted by partial key match before output is written.
 */
export const loggingMiddleware: MiddlewareHandler = async (c, next) => {
  const contentType = c.req.header('content-type');
  const searchParams = redactSensitiveSearchParams(new URL(c.req.url).searchParams).toString();
  const bodyPreview = await createHTTPRequestBodyPreview(c.req.raw, contentType);

  // ↓ Measure only processing so the final response status and duration share one boundary.

  const startTime = performance.now();
  await next();
  const duration = Math.round(performance.now() - startTime);

  const message = formatHTTPRequestLog({
    method: c.req.method,
    status: c.res.status,
    duration,
    path: c.req.path,
    searchParams,
    bodyPreview,
  });

  log.info(message, 'hono');
};
