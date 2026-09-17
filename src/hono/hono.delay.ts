import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import { honoErrors } from './hono.errors';

/**
 * Creates middleware that simulates latency by delaying downstream request handling.
 * Construction rejects negative or non-finite durations before mounting the handler.
 */
export function createDelayMiddleware(delayMilliseconds: number): MiddlewareHandler {
  const isInvalidDelay = Number.isFinite(delayMilliseconds) === false || delayMilliseconds < 0;

  // ↓ Reject invalid static policy before constructing the reusable middleware.

  if (isInvalidDelay) {
    throw honoErrors.invalidDelayMilliseconds();
  }

  return createMiddleware(async (_context, next) => {
    // Avoid allocating a timer when latency simulation is explicitly disabled.
    if (delayMilliseconds === 0) return next();

    await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
    await next();
  });
}
