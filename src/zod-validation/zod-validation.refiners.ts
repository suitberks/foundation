import type { AtLeastOne } from '@kalutskii/foundation';
import type { z } from 'zod';
import type { ZodObject, ZodRawShape } from 'zod';

// Default error message for the "at least one field required" validation.
const DEFAULT_ERROR_MESSAGE = 'Invalid input. At least one field must be provided.';

/**
 * Wraps a partial Zod object schema with:
 * 1. A runtime check ensuring at least one field is non-undefined.
 * 2. A `.transform()` that narrows the output type to `AtLeastOne<T>`,
 *    making it directly assignable to domain `*Select` and `*Update` types without casting.
 *
 * ```ts
 * zQuery(zodAtLeastOne(userSelectSchema)) // result: UserSelect ✓
 * ```
 */
export const zodAtLeastOne = <T extends ZodObject<ZodRawShape>>(schema: T) =>
  schema
    .superRefine((val, ctx) => {
      const hasValue = Object.values(val).some((v) => v !== undefined);
      if (!hasValue) ctx.addIssue({ code: 'custom', message: DEFAULT_ERROR_MESSAGE });
    })
    .transform((val) => val as AtLeastOne<z.infer<T>>);
