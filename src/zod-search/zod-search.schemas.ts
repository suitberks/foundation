import z from 'zod';

import { zodAtLeastOne } from '@/zod-validation/zod-validation.refiners';

import { zodPaginationSchema } from './zod-search.pagination.schemas';
import type { ZodSearchSchemaOptions } from './zod-search.types';

/**
 * Optional text query shared by search request contracts.
 * Provided values are trimmed and must contain visible text.
 */
const zodSearchQuerySchema = z.string().trim().min(1).optional();

/**
 * Makes every supplied filter optional while requiring one defined value.
 * The wrapper itself stays optional because searches may omit filtering.
 */
const createZodSearchWhereSchema = <TShape extends z.ZodRawShape>(filters: z.ZodObject<TShape>) =>
  zodAtLeastOne(filters.partial()).optional();

/**
 * Empty schema shape used when a search feature is explicitly disabled.
 * Intersections remove disabled fields without widening enabled branches.
 */
type ZodDisabledSearchShape = Record<never, never>;

/**
 * Schema-level shape assembled from filter fields and literal feature flags.
 * Keeping Zod schemas here makes runtime composition the contract source.
 */
type ZodSearchShape<TShape extends z.ZodRawShape, TQueryEnabled extends boolean, TPaginationEnabled extends boolean> = {
  where: ReturnType<typeof createZodSearchWhereSchema<TShape>>;
} & (TQueryEnabled extends false ? ZodDisabledSearchShape : { query: typeof zodSearchQuerySchema }) &
  (TPaginationEnabled extends false ? ZodDisabledSearchShape : { pagination: typeof zodPaginationSchema });

/**
 * Builds a strict schema for reusable search request contracts.
 * The optional `where` object must contain one defined filter.
 *
 * Query is optional and non-empty; pagination is required by default.
 * Literal feature flags update both runtime and inferred static shapes.
 *
 * @example
 * const assetSearchSchema = zodSearchSchema({
 *   filters: assetSchema.pick({ status: true }),
 * });
 *
 * type AssetSearch = z.infer<typeof assetSearchSchema>;
 */
export const zodSearchSchema = <
  const TShape extends z.ZodRawShape,
  const TQueryEnabled extends boolean = true,
  const TPaginationEnabled extends boolean = true,
>({
  filters,
  queryEnabled,
  paginationEnabled,
}: ZodSearchSchemaOptions<TShape, TQueryEnabled, TPaginationEnabled>) => {
  // TypeScript cannot connect generic conditional types with the matching runtime branches.
  // This schema-level assertion preserves literal flags without asserting the parsed output.

  const shape = {
    where: createZodSearchWhereSchema(filters),
    ...(queryEnabled !== false ? { query: zodSearchQuerySchema } : {}),
    ...(paginationEnabled !== false ? { pagination: zodPaginationSchema } : {}),
  } as ZodSearchShape<TShape, TQueryEnabled, TPaginationEnabled>;

  return z.object(shape).strict();
};
