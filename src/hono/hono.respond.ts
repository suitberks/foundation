import type { Context, TypedResponse } from 'hono';

import { success } from '@/http/http.factory';
import type { APIError, APISuccess, SuccessStatusCode } from '@/http/http.schemas';

/**
 * Wraps c.json with a typed success payload / (or void data) & possible APIError response.
 * When no data is provided, responds with an empty object {} (purely for type consistency).
 */
export function respond<T extends object = Record<string, never>, S extends SuccessStatusCode = SuccessStatusCode>(
  c: Context,
  options: { status: S; data?: T }
): Response & TypedResponse<APISuccess<T> | APIError, S, 'json'> {
  return c.json(success({ status: options.status, data: (options.data ?? {}) as T }), options.status) as never;
}

/**
 * Responds with a file download, setting the appropriate headers for content disposition and type.
 * Supports specifying a filename and optional content type, defaulting to 'application/octet-stream'.
 */
export function fileRespond<S extends SuccessStatusCode>(
  c: Context,
  options: { status: S; content: ArrayBuffer; filename: string; contentType?: string }
): Response {
  c.header('Content-Disposition', `attachment; filename="${options.filename}"`);
  c.header('Content-Type', options.contentType ?? 'application/octet-stream');

  return c.body(options.content, options.status);
}
