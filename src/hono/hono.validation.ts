import { zValidator as zv } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ZodType } from 'zod';

/** Wrapper around the standard hono/zod-validator, throws HTTPException on validation failure. */
export const zQuery = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) => {
  return zv(target, schema, (result, _c) => {
    if (result.success) return;
    throw new HTTPException(400, { message: result.error.message });
  });
};
