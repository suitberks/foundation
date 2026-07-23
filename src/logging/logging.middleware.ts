import type { MiddlewareHandler } from 'hono';
import { blue, bold, dim, white } from 'kleur/colors';

import { redactSensitiveJSON, redactSensitiveSearchParams } from './logging.security';
import { log } from './logging.services';
import { getColoredHTTPStatus } from './logging.utilities';

/**
 * Logs Hono request metadata with query parameters and a normalized body preview.
 * Sensitive values are redacted by partial key match before output is written.
 */
export const loggingMiddleware: MiddlewareHandler = async (c, next) => {
  const contentType = c.req.header('content-type');
  const searchParams = redactSensitiveSearchParams(new URL(c.req.url).searchParams).toString();

  // Multipart bodies stay unread because cloning file uploads can retain large binary payloads;
  // Text bodies use a request clone so downstream consumers keep the original readable stream;

  const body = contentType?.includes('multipart/form-data')
    ? '[multipart]'
    : redactSensitiveJSON((await c.req.raw.clone().text()).replaceAll(/\s+/g, ' ').trim());

  // Long bodies retain both boundaries because identifiers and closing JSON fields are often useful;
  // The centered ellipsis makes truncation explicit without allowing one request to dominate output;

  const bodyPreview = body.length > 60 ? `${body.slice(0, 30)}…${body.slice(-30)}` : body;

  // The response status is final only after downstream middleware and the route complete;
  // The same boundary defines the request-processing duration reported in the log line;

  const startTime = performance.now();
  await next();
  const duration = Math.round(performance.now() - startTime);

  const coloredMethod = bold(blue(c.req.method.padEnd(4)));
  const coloredStatus = getColoredHTTPStatus(c.res.status)(String(c.res.status).padEnd(4));
  const coloredTime = dim(`${duration}ms`.padStart(6));
  const coloredPath = white(c.req.path.padEnd(32));
  const coloredSearchParams = searchParams ? dim(` (${searchParams})`) : '';
  const coloredBody = bodyPreview ? dim(` ${bodyPreview}`) : '';

  // One composed call preserves the logger's stable service column and prevents interleaved fragments;
  // Optional query and body suffixes disappear naturally when their normalized values are empty;

  log.info(
    `${coloredMethod} ${coloredStatus} ${coloredTime} ${coloredPath}${coloredSearchParams}${coloredBody}`,
    'hono'
  );
};
