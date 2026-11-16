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
 * Builds an attachment disposition carrying both ASCII and exact UTF-8 file names.
 * Quotes, control characters, and non-ASCII text cannot corrupt the header value.
 */
export function createAttachmentDisposition(filename: string): string {
  // ↓ Pair a sanitized quoted fallback with the RFC 8187 extended parameter.

  const wellFormedFilename = filename.toWellFormed();
  const fallbackFilename = wellFormedFilename.replaceAll(/[^\x20-\x7e]|["\\]/g, '_');
  const encodedFilename = encodeURIComponent(wellFormedFilename).replaceAll(/['()*]/g, (character) => {
    return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
  });

  return `attachment; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`;
}

/**
 * Responds with downloadable binary content and its complete attachment headers.
 * Omitted content types fall back to the generic `application/octet-stream` type.
 */
export function fileRespond<TStatus extends SuccessResponseStatus>(
  c: Context,
  options: HonoFileRespondOptions<TStatus>
): Response {
  c.header('Content-Disposition', createAttachmentDisposition(options.filename));
  c.header('Content-Type', options.contentType ?? 'application/octet-stream');

  return c.body(options.content, options.status);
}
