import type z from 'zod';

import type { zodPaginationSchema } from './zod-search.pagination.schemas';

/**
 * TypeScript output produced after successful pagination validation.
 * Defaulted fields are represented as required numeric properties.
 */
export type ZodPaginationOptions = z.infer<typeof zodPaginationSchema>;

/**
 * Configuration used to compose a reusable search request schema.
 * Literal feature flags are preserved in the resulting static shape.
 */
export type ZodSearchSchemaOptions<
  TShape extends z.ZodRawShape,
  TQueryEnabled extends boolean = true,
  TPaginationEnabled extends boolean = true,
> = {
  /**
   * Object schema whose fields become available inside the `where` object.
   * Every resulting field is optional, but one value must be defined.
   */
  filters: z.ZodObject<TShape>;

  /**
   * Controls whether an optional non-empty `query` field is generated.
   * The field is enabled when this option is omitted from the call.
   */
  queryEnabled?: TQueryEnabled;

  /**
   * Controls whether a required `pagination` object is generated.
   * The field is enabled when this option is omitted from the call.
   */
  paginationEnabled?: TPaginationEnabled;
};
