import z from 'zod';

import type { FlattenZodShape, ZodShape } from './zod-flatten.types';
import { isZodObject, isZodOptional, unwrapOptional } from './zod-flatten.utilities';

/**
 * Recursively lifts all nested `z.ZodObject` fields to the top level of the shape.
 * Primitive fields are preserved as-is. If the parent field was optional, all promoted
 * inner keys become optional to avoid requiring fields that were previously nested under an optional object.
 *
 * ```ts
 * const flat = flattenZodShape({
 *   name: z.string(),
 *   address: z.object({ city: z.string(), zip: z.string() }).optional(),
 * });
 * // { name: z.string(), city: z.string().optional(), zip: z.string().optional() }
 * ```
 */
export const flattenZodShape = <TShape extends ZodShape>(shape: TShape): FlattenZodShape<TShape> => {
  const flat: ZodShape = {};

  for (const [key, schema] of Object.entries(shape)) {
    const unwrappedSchema = unwrapOptional(schema);

    if (isZodObject(unwrappedSchema) === false) {
      flat[key] = schema;
      continue;
    }

    // Lift each inner field; wrap as optional if the parent field was optional.
    for (const [innerKey, innerSchema] of Object.entries(unwrappedSchema.shape)) {
      flat[innerKey] = isZodOptional(schema) ? innerSchema.optional() : innerSchema;
    }
  }

  return flat as FlattenZodShape<TShape>;
};

/**
 * Builds a strict flat query schema from a nested `z.ZodObject`.
 * All nested object fields are lifted to the top level while preserving optionality,
 * making the result suitable for validating flat query parameter objects.
 *
 * ```ts
 * const schema = asQuerySchema(
 *   z.object({
 *     search: z.string().optional(),
 *     sort: z.object({ field: z.string(), order: z.enum(['asc', 'desc']) }).optional(),
 *   })
 * );
 *
 * schema.parse({ search: 'foo', field: 'name', order: 'asc' });
 * // { search: 'foo', field: 'name', order: 'asc' }
 * ```
 */
export const asQuerySchema = <TShape extends ZodShape>(schema: z.ZodObject<TShape>) => {
  return z.object(flattenZodShape(schema.shape)).strict();
};
