import type { Context, TypedResponse } from 'hono';

import { success } from '@/http/http.factory';
import type { APISuccess, SuccessStatusCode } from '@/http/http.types';

import type { HonoFileRespondOptions, HonoRespondOptions } from './hono.types';

/**
 * Wraps `c.json` in the shared success envelope while preserving its literal status.
 * Missing response data is represented by an empty object for contract consistency.
 */
export function respond<
  TData extends object = Record<string, never>,
  TStatus extends SuccessStatusCode = SuccessStatusCode,
>(
  c: Context,
  options: HonoRespondOptions<TData, TStatus>
): Response & TypedResponse<APISuccess<TData>, TStatus, 'json'> {
  const response = success({ status: options.status, data: (options.data ?? {}) as TData });

  // Hono cannot preserve an unconstrained generic object through its recursive `JSONParsed` type.
  return c.json(response, options.status) as unknown as Response & TypedResponse<APISuccess<TData>, TStatus, 'json'>;
}

/**
 * Responds with downloadable binary content and its attachment headers.
 * Unknown/undefined content types default to `application/octet-stream`.
 */
export function fileRespond<TStatus extends SuccessStatusCode>(
  c: Context,
  options: HonoFileRespondOptions<TStatus>
): Response {
  c.header('Content-Disposition', `attachment; filename="${options.filename}"`);
  c.header('Content-Type', options.contentType ?? 'application/octet-stream');

  return c.body(options.content, options.status);
}
