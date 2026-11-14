import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import { MAX_TIMER_DELAY_MILLISECONDS } from '@/execution';

import { honoErrors } from './hono.errors';

/**
 * Creates middleware that simulates latency by delaying downstream request handling.
 * Construction rejects negative, non-finite, or overflowing durations before mounting.
 */
export function createDelayMiddleware(delayMilliseconds: number): MiddlewareHandler {
  // ↓ Reject invalid static policy before constructing the reusable middleware.

  const hasValidDelay =
    Number.isFinite(delayMilliseconds) && delayMilliseconds >= 0 && delayMilliseconds <= MAX_TIMER_DELAY_MILLISECONDS;

  if (hasValidDelay === false) {
    throw honoErrors.invalidDelayMilliseconds();
  }

  return createMiddleware(async (_context, next) => {
    // Avoid allocating a timer when latency simulation is explicitly disabled.
    if (delayMilliseconds === 0) return next();

    await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
    await next();
  });
}
