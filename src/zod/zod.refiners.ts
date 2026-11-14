import { z } from 'zod';

import type { AtLeastOne } from '@/type';

import { zodErrors } from './zod.errors';

/**
 * Requires one defined property while preserving the supplied Zod object validation.
 * The output type reflects semantic presence and retains valid falsy or nullable values.
 *
 * @example
 * const patchSchema = zodAtLeastOne(z.object({ name: z.string().optional() }));
 */
export function zodAtLeastOne<TSchema extends z.ZodObject<z.ZodRawShape>>(schema: TSchema) {
  return schema
    .superRefine((value, context) => {
      const hasDefinedValue = Object.values(value).some((property) => property !== undefined);

      if (hasDefinedValue) {
        return;
      }

      context.addIssue(zodErrors.atLeastOneRequired());
    })
    .transform((value) => {
      // TypeScript cannot connect the runtime presence refinement with its mapped output type.
      return value as AtLeastOne<z.infer<TSchema>>;
    });
}

/**
 * Builds an ordinary update payload schema from writable fields and identifiers.
 * Writable fields become optional while every identifier field remains required.
 *
 * @example
 * const updateSchema = zodUpdatePayload(userWritableFields, { userId: userFields.id }).omit({ role: true });
 */
export function zodUpdatePayload<TFields extends z.ZodRawShape, TIdentifiers extends z.ZodRawShape>(
  fields: TFields,
  identifiers: TIdentifiers
) {
  return z.object(fields).partial().extend(identifiers);
}
