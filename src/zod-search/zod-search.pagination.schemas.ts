import { z } from 'zod';

/**
 * Validates offset-based pagination shared by search request contracts.
 * Missing fields inside the required object receive predictable defaults.
 */
export const zodPaginationSchema = z.object({
  /**
   * Zero-based number of records skipped before collecting a result page.
   * String values are coerced to support validation of URL query input.
   */
  offset: z.coerce.number().int().nonnegative().default(0),

  /**
   * Positive maximum number of records returned in a single result page.
   * String values are coerced to support validation of URL query input.
   */
  limit: z.coerce.number().int().positive().default(10),
});

/**
 * Exposes pagination fields for composition into other object schemas.
 * The shape stays derived from the schema to prevent contract divergence.
 */
export const zodPaginationShape = zodPaginationSchema.shape;
