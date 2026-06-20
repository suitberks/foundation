import z from 'zod';

import { asQueryNumber } from '@/validation/validation.refiners';

/**
 * A Zod schema for validating pagination options, specifically the `offset` and `limit` parameters.
 * - `offset`: An optional non-negative integer representing the starting point for pagination.
 * - `limit`: An optional positive integer representing the maximum number of items to return.
 *
 * This schema can be used to inject in other Zod schemas for validating pagination options:
 *
 * ```ts
 * const mySchema = paginationSchema.extend({
 *   // other fields here
 * });
 * ```
 */
export const paginationSchema = z.object({
  offset: asQueryNumber(z.number().int().nonnegative()).optional(),
  limit: asQueryNumber(z.number().int().positive()).optional(),
});

/**
 * A TypeScript type representing the pagination options validated by the `paginationSchema`.
 * Read documentation for `paginationSchema` for more details on the structure and usage of this type.
 */
export type PaginationOptions = z.infer<typeof paginationSchema>;
