import type { Context, ValidationTargets } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod';

import { safeExecute } from '@/utilities/execution.utilities';

/** The subset of Hono validation targets supported for payload extraction. */
type PayloadTarget = Extract<keyof ValidationTargets, 'json' | 'query' | 'param'>;

/** Fallback error message when payload reading/parsing fails without a specific error. */
const FALLBACK_ERROR_MESSAGE = 'Failed to read payload';

/** Raw payload readers for each supported target, keyed by {@link PayloadTarget}. */
export const requestReaders = {
  json: async (c: Context): Promise<unknown> => c.req.json(),
  query: (c: Context): unknown => c.req.query(),
  param: (c: Context): unknown => c.req.param(),
} satisfies Record<PayloadTarget, (c: Context) => unknown>;

/**
 * Reads the raw payload from the request and validates it against the provided Zod schema.
 * Throws an `HTTPException(400)` when validation fails or when the payload cannot be read.
 */
export async function requirePayload<TSchema extends z.ZodTypeAny>(
  c: Context,
  target: PayloadTarget,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  return safeExecute(
    async () => {
      const rawPayload = await requestReaders[target](c);
      const parsedPayload = await schema.safeParseAsync(rawPayload);

      if (parsedPayload.success) return parsedPayload.data;
      throw new HTTPException(400, { message: parsedPayload.error.message });
    },
    () => {
      throw new HTTPException(400, { message: FALLBACK_ERROR_MESSAGE });
    }
  );
}
