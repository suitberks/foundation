import { z } from 'zod';

// Default error message for the "selection identifiers required" validation.
const DEFAULT_ERROR_MESSAGE = 'Selection identifiers must be provided.';

/**
 * Builds a strict selection contract for bulk operations across paginated data.
 * The identifier schema is shared by explicit and all-matching selection modes.
 *
 * `include` targets only identifiers listed by the client. `exclude` targets every
 * item matching the accompanying search snapshot except excluded identifiers.
 *
 * @example
 * const assetBulkSelectionSchema = zodBulkSelectionSchema({
 *   identifierSchema: z.string().min(1),
 * });
 */
export const zodBulkSelectionSchema = <const TIdentifierSchema extends z.ZodType<string | number>>({
  identifierSchema,
}: {
  /**
   * Schema used to validate every included or excluded entity identifier.
   * Its transforms and exact inferred output are preserved in both branches.
   */
  identifierSchema: TIdentifierSchema;
}) => {
  // Selection identifiers represent mathematical sets, so duplicate values are invalid.
  // Validation happens after identifier parsing to catch equal coerced or transformed values.

  const identifiersSchema = z
    .array(identifierSchema)
    .refine((identifiers) => new Set(identifiers).size === identifiers.length, {
      message: DEFAULT_ERROR_MESSAGE,
    });

  return z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('include'), identifiers: identifiersSchema }).strict(),
    z.object({ mode: z.literal('exclude'), excludedIdentifiers: identifiersSchema }).strict(),
  ]);
};
