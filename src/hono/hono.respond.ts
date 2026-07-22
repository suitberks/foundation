import type { Context, TypedResponse } from 'hono';

import { success } from '@/http/http.factory';
import type { APIError, APISuccess, SuccessStatusCode } from '@/http/http.types';

import type { HonoFileRespondOptions, HonoRespondOptions } from './hono.types';

/**
 * Wraps `c.json` in the shared success envelope while preserving its literal status.
 * Missing response data is represented by an empty object for contract consistency.
 */
export function respond<T extends object = Record<string, never>, S extends SuccessStatusCode = SuccessStatusCode>(
  c: Context,
  options: HonoRespondOptions<T, S>
): Response & TypedResponse<APISuccess<T> | APIError, S, 'json'> {
  return c.json(success({ status: options.status, data: (options.data ?? {}) as T }), options.status) as never;
}

/**
 * Responds with downloadable binary content and its attachment headers.
 * Unknown/undefined content types default to `application/octet-stream`.
 */
export function fileRespond<S extends SuccessStatusCode>(c: Context, options: HonoFileRespondOptions<S>): Response {
  c.header('Content-Disposition', `attachment; filename="${options.filename}"`);
  c.header('Content-Type', options.contentType ?? 'application/octet-stream');

  return c.body(options.content, options.status);
}
