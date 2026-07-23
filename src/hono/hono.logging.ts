import type { MiddlewareHandler } from 'hono';
import { blue, bold, dim, white } from 'kleur/colors';

import { getColoredHTTPStatus, log } from '@/utilities/logging.utilities';

/**
 * Options controlling which request details the Hono logger may expose.
 * Secure mode excludes query parameters and body content from log output.
 */
export type HonoLoggingOptions = {
  /**
   * Prevents query parameters and request bodies from being read or logged.
   * Defaults to `false`, preserving detailed request logging.
   */
  secure?: boolean;
};

/**
 * Creates middleware that logs request metadata and an optional body preview.
 * Multipart bodies remain unread, while secure mode omits all sensitive input details.
 */
export function honoLoggingHandler(options: HonoLoggingOptions = {}): MiddlewareHandler {
  return async (c, next) => {
    const searchParams = new URL(c.req.url).searchParams.toString();
    const body = c.req.header('content-type')?.includes('multipart/form-data')
      ? // Multipart content remains unread to avoid buffering uploaded files;
        // The placeholder records its presence without exposing any fields;
        '[multipart]'
      : // Other bodies are read from a clone and normalized for one-line output;
        // The original request stream remains available to downstream handlers;
        (await c.req.raw.clone().text()).replaceAll(/\s+/g, ' ').trim();

    const bodyPreview = body.length > 60 ? `${body.slice(0, 30)}…${body.slice(-30)}` : body;

    // Downstream middleware and the route handler determine the final response status;
    // Their complete execution time becomes the duration reported for this request;

    const startTime = performance.now();
    await next();
    const duration = Math.round(performance.now() - startTime);

    const coloredMethod = bold(blue(c.req.method.padEnd(4)));
    const coloredStatus = getColoredHTTPStatus(c.res.status)(String(c.res.status).padEnd(4));
    const coloredTime = dim(`${duration}ms`.padStart(6));
    const coloredPath = white(c.req.path.padEnd(32));

    const coloredSearchParams = options.secure ? '' : dim(` (${searchParams})`);
    const coloredBody = options.secure ? '' : dim(` ${bodyPreview}`);

    log.info(
      `${coloredMethod} ${coloredStatus} ${coloredTime} ${coloredPath}${coloredSearchParams}${coloredBody}`,
      'hono'
    );
  };
}
