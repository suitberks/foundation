import z from 'zod';

export const parseQueryValue = (value: unknown): unknown => {
  // Converts only unambiguous primitive values before Zod validation, so
  // schemas like z.number() and z.boolean() сan correctly parse the values.

  if (Array.isArray(value)) return value.map(parseQueryValue);
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();

  if (normalized === '') return value;
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return Number(normalized);

  return value;
};

/**
 * Query parameters always arrive as strings, even when they semantically represent numbers
 * or booleans, so we preprocess them to convert to the appropriate types before validation.
 *
 * ```ts
 * const schema = z.object({
 *   page: z.number().int().positive(),
 *   isActive: z.boolean(),
 * });
 *
 * const queryParams = { page: '2', isActive: 'true' };
 * const result = schema.parse(queryParams); // { page: 2, isActive: true }
 * ```
 *
 * @param schema - The Zod schema to validate the query parameters against.
 * @returns A new Zod schema that preprocesses query parameter values before validation.
 */
export const asQuery = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(parseQueryValue, schema);
