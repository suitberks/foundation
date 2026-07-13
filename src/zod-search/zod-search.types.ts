import type z from 'zod';

import type { zodPaginationSchema } from './zod-search.pagination.schemas';

/**
 * TypeScript output produced after successful pagination validation.
 * Defaulted fields are represented as required numeric properties.
 */
export type ZodPaginationOptions = z.infer<typeof zodPaginationSchema>;

/**
 * Feature flags shared by both supported search schema composition modes.
 * Literal values are preserved in the resulting runtime and static shapes.
 */
type ZodSearchFeatureOptions<TQueryEnabled extends boolean, TPaginationEnabled extends boolean> = {
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

/**
 * Configuration used to compose a reusable search request schema.
 * Exactly one source must be provided for the resulting `where` field.
 *
 * `filters` is the concise mode that applies partial and non-empty rules.
 * `whereSchema` accepts a fully prepared schema with custom Zod effects.
 */
export type ZodSearchSchemaOptions<
  TShape extends z.ZodRawShape = never,
  TWhereSchema extends z.ZodType<Record<string, unknown>> = never,
  TQueryEnabled extends boolean = true,
  TPaginationEnabled extends boolean = true,
> = ZodSearchFeatureOptions<TQueryEnabled, TPaginationEnabled> &
  (
    | {
        /**
         * Object schema whose fields become optional filters inside `where`.
         * The factory requires one defined value whenever `where` is present.
         */
        filters: z.ZodObject<TShape>;

        /** Prevents combining automatic filters with a prepared schema. */
        whereSchema?: never;
      }
    | {
        /** Prevents combining a prepared schema with automatic filters. */
        filters?: never;

        /**
         * Prepared schema used directly to validate the `where` object.
         * Its refinements, transforms, and inferred output are preserved.
         */
        whereSchema: TWhereSchema;
      }
  );
