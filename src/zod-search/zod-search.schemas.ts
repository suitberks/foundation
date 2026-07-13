import { z } from 'zod';

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
 * Top-level optionality is added later for both composition modes equally.
 */
const createZodSearchWhereSchema = <TShape extends z.ZodRawShape>(filters: z.ZodObject<TShape>) =>
  zodAtLeastOne(filters.partial());

/**
 * Empty schema shape used when a search feature is explicitly disabled.
 * Intersections remove disabled fields without widening enabled branches.
 */
type ZodDisabledSearchShape = Record<never, never>;

/**
 * Resolves the schema used by `where` from the selected composition mode.
 * Prepared schemas remain untouched, including their effects and output.
 */
type ZodSearchWhereSchema<TShape extends z.ZodRawShape, TWhereSchema extends z.ZodType<Record<string, unknown>>> = [
  TWhereSchema,
] extends [never]
  ? ReturnType<typeof createZodSearchWhereSchema<TShape>>
  : TWhereSchema;

/**
 * Schema-level shape assembled from the selected source and feature flags.
 * Keeping Zod schemas here makes runtime composition the contract source.
 */
type ZodSearchShape<
  TShape extends z.ZodRawShape,
  TWhereSchema extends z.ZodType<Record<string, unknown>>,
  TQueryEnabled extends boolean,
  TPaginationEnabled extends boolean,
> = {
  where: z.ZodOptional<ZodSearchWhereSchema<TShape, TWhereSchema>>;
} & (TQueryEnabled extends false ? ZodDisabledSearchShape : { query: typeof zodSearchQuerySchema }) &
  (TPaginationEnabled extends false ? ZodDisabledSearchShape : { pagination: typeof zodPaginationSchema });

/**
 * Builds a strict schema for reusable search request contracts.
 * The optional `where` object must contain one defined filter.
 *
 * Query is optional and non-empty; pagination is required by default.
 * Literal feature flags update both runtime and inferred static shapes.
 *
 * Pass `filters` for automatic partial and non-empty validation, or use
 * `whereSchema` to preserve a prepared schema with custom Zod effects.
 *
 * @example
 * const assetSearchSchema = zodSearchSchema({
 *   filters: assetSchema.pick({ status: true }),
 * });
 *
 * const refinedAssetSearchSchema = zodSearchSchema({
 *   whereSchema: zodAtLeastOne(assetSchema.pick({ status: true }).partial()),
 * });
 */
export const zodSearchSchema = <
  const TShape extends z.ZodRawShape = never,
  const TWhereSchema extends z.ZodType<Record<string, unknown>> = never,
  const TQueryEnabled extends boolean = true,
  const TPaginationEnabled extends boolean = true,
>(
  options: ZodSearchSchemaOptions<TShape, TWhereSchema, TQueryEnabled, TPaginationEnabled>
) => {
  // The mutually exclusive options guarantee one source, while this runtime branch resolves it.
  // Optionality belongs to the search contract and is therefore applied after source selection.

  const whereSchema = options.filters !== undefined ? createZodSearchWhereSchema(options.filters) : options.whereSchema;

  // TypeScript cannot connect generic conditional types with the matching runtime branches.
  // This schema-level assertion preserves both source inference and literal feature flags.

  const shape = {
    where: whereSchema.optional(),
    ...(options.queryEnabled !== false ? { query: zodSearchQuerySchema } : {}),
    ...(options.paginationEnabled !== false ? { pagination: zodPaginationSchema } : {}),
  } as ZodSearchShape<TShape, TWhereSchema, TQueryEnabled, TPaginationEnabled>;

  return z.object(shape).strict();
};
