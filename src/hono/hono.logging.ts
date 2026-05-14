import type { MiddlewareHandler } from 'hono';
import { blue, bold, dim, white } from 'kleur/colors';

import { getColoredHTTPStatus, log } from '@/utilities/logging.utilities';

/**
 * Request logging middleware for Hono, providing detailed logs for each incoming request.
 * Example log output: [12:12:12 (+4 UTC)] hono     | POST 200  123ms /api/v1/users (search=term)
 */
export const honoLoggingHandler: MiddlewareHandler = async (c, next) => {
  const requestUrl = new URL(c.req.url);
  const searchParams = requestUrl.searchParams.toString();

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

  log.info(`${coloredMethod} ${coloredStatus} ${coloredTime} ${coloredPath}${coloredSearchParams}`, 'hono');
};
