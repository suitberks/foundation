import type { MiddlewareHandler } from 'hono';
import { blue, bold, dim, white } from 'kleur/colors';

import { getColoredHTTPStatus, log } from '@/utilities/logging.utilities';

/**
 * Request logging middleware for Hono, providing deeply detailed logs for each incoming request.
 * Example log output: [12:12:12 (+4 UTC)] hono     | POST 200  123ms /api/v1/users (search=term)
 */
export const honoLoggingHandler: MiddlewareHandler = async (c, next) => {
  const requestUrl = new URL(c.req.url);
  const searchParams = requestUrl.searchParams.toString();
  const body = c.req.header('content-type')?.includes('multipart/form-data')
    ? // If the request is multipart/form-data, we avoid reading the body
      // to prevent consuming the stream, and instead log a placeholder.
      '[multipart]'
    : // Otherwise, we read the request body as text and normalize whitespace.
      (await c.req.raw.clone().text()).replaceAll(/\s+/g, ' ').trim();

  const bodyPreview = body.length > 80 ? `${body.slice(0, 40)}…${body.slice(-40)}` : body;

  // Measuring request processing time ----------------------

  const startTime = performance.now();
  await next();
  const duration = Math.round(performance.now() - startTime);

  // --------------------------------------------------------

  const coloredMethod = bold(blue(c.req.method.padEnd(4)));
  const coloredStatus = getColoredHTTPStatus(c.res.status)(String(c.res.status).padEnd(4));
  const coloredTime = dim(`${duration}ms`.padStart(6));
  const coloredPath = white(c.req.path.padEnd(44));
  const coloredSearchParams = searchParams ? dim(` (${searchParams})`) : '';
  const coloredBody = bodyPreview ? dim(` ${bodyPreview}`) : '';

  log.info(
    `${coloredMethod} ${coloredStatus} ${coloredTime} ${coloredPath}${coloredSearchParams}${coloredBody}`,
    'hono'
  );
};
