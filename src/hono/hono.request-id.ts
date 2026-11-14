import type { Context, MiddlewareHandler } from 'hono';

import { isString } from '@/guard';

import { HONO_REQUEST_ID_HEADER, HONO_REQUEST_ID_PATTERN } from './hono.constants';
import { honoErrors } from './hono.errors';
import type { HonoRequestIdMiddlewareOptions } from './hono.types';

/**
 * Determines whether a trimmed value satisfies the request correlation contract.
 * Missing, oversized, and control-bearing identifiers remain outside the result.
 */
export function isHonoRequestId(value: string | undefined): value is string {
  return value !== undefined && HONO_REQUEST_ID_PATTERN.test(value);
}

/**
 * Resolves a request identifier from response metadata before its incoming header.
 * Malformed values resolve to `undefined` so untrusted headers never reach logs.
 */
export function getHonoRequestId(context: Context, header: string = HONO_REQUEST_ID_HEADER): string | undefined {
  const requestId = context.res.headers.get(header) ?? context.req.header(header);
  const normalizedRequestId = requestId?.trim();

  return isHonoRequestId(normalizedRequestId) ? normalizedRequestId : undefined;
}

/**
 * Creates middleware that preserves a valid request identifier or generates one.
 * The resolved value is returned on the response and stays available to adapters.
 */
export function createRequestIdMiddleware(options: HonoRequestIdMiddlewareOptions = {}): MiddlewareHandler {
  const header = options.header ?? HONO_REQUEST_ID_HEADER;
  const createRequestId = options.createRequestId ?? (() => crypto.randomUUID());

  return async (context, next) => {
    const incomingRequestId = context.req.header(header)?.trim();
    const generatedRequestId = isHonoRequestId(incomingRequestId) ? undefined : createRequestId();
    const requestId = isString(generatedRequestId) ? generatedRequestId.trim() : incomingRequestId;

    // ↓ Reject generated identifiers that violate the same correlation contract.

    if (isHonoRequestId(requestId) === false) {
      throw honoErrors.invalidRequestId();
    }

    context.header(header, requestId);
    await next();
    context.header(header, requestId);
  };
}

/**
 * Ready-to-use request identifier middleware backed by the shared default policy.
 * Applications may use the factory when a custom header or generator is required.
 */
export const requestIdMiddleware = createRequestIdMiddleware();
