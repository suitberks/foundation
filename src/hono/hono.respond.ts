import type { Context, TypedResponse } from 'hono';

import { createSuccessResponse } from '@/response';
import type { SuccessResponse, SuccessResponseStatus } from '@/response';

import type { HonoFileRespondOptions, HonoRespondOptions } from './hono.types';

/**
 * Wraps `c.json` in the shared success envelope while preserving its literal status.
 * Missing response data is represented by an empty object for contract consistency.
 */
export function respond<
  TData extends object = Record<string, never>,
  TStatus extends SuccessResponseStatus = SuccessResponseStatus,
>(
  c: Context,
  options: HonoRespondOptions<TData, TStatus>
): Response & TypedResponse<SuccessResponse<TData>, TStatus, 'json'> {
  const response = createSuccessResponse(options.status, (options.data ?? {}) as TData);

  // Hono cannot preserve an unconstrained generic object through its recursive `JSONParsed` type.
  return c.json(response, options.status) as unknown as Response &
    TypedResponse<SuccessResponse<TData>, TStatus, 'json'>;
}

/**
 * Responds with downloadable binary content and its attachment headers.
 * Unknown/undefined content types default to `application/octet-stream`.
 */
export function fileRespond<TStatus extends SuccessResponseStatus>(
  c: Context,
  options: HonoFileRespondOptions<TStatus>
): Response {
  c.header('Content-Disposition', `attachment; filename="${options.filename}"`);
  c.header('Content-Type', options.contentType ?? 'application/octet-stream');

  return c.body(options.content, options.status);
}
