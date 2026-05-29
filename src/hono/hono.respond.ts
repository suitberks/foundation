import type { Context, TypedResponse } from 'hono';

import { success } from '@/http/http.factory';
import type { APIError, APISuccess, SuccessStatusCode } from '@/http/http.schemas';
import type { SerializeDates } from '@/utilities/serialization.utilities';

/**
 * Wraps c.json with a typed success payload / (or void data) & possible APIError response.
 * When no data is provided, responds with an empty object {} (purely for type consistency).
 */
export function respond<T extends object = Record<string, never>, S extends SuccessStatusCode = SuccessStatusCode>(
  c: Context,
  options: { status: S; data?: T }
): Response & TypedResponse<APISuccess<SerializeDates<T>> | APIError, S, 'json'> {
  return c.json(success({ status: options.status, data: (options.data ?? {}) as T }), options.status) as never;
}
