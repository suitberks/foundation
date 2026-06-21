import z from 'zod';

import { asQuery } from '@/zod-validation/zod-validation.refiners';

export const zodPaginationSchema = z.object({
  /** Integer representing the starting point for pagination. */
  offset: asQuery(z.number().int().nonnegative()).optional(),
  /** Integer representing the maximum number of items to return. */
  limit: asQuery(z.number().int().positive()).optional(),
});

/**
 * Reusable pagination fields for flat query schemas, allowing for
 * consistent validation of pagination parameters across different endpoints.
 *
 * Spread into another `z.object(...)` when composing a larger query schema,
 * or use `zodPaginationSchema.extend(...)` when building directly from the schema.
 */
export const zodPaginationShape = zodPaginationSchema.shape;

/**
 * TypeScript type representing the pagination options validated by the `zodPaginationSchema`.
 * Read documentation for `zodPaginationSchema` for more details on the structure and usage of this type.
 */
export type ZodPaginationOptions = z.infer<typeof zodPaginationSchema>;
