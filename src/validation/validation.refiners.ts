import z from 'zod';

// Default error message about at least one key being required.
const AT_LEAST_ONE_DEFINED_ERROR = (keys: (string | number | symbol)[]) =>
  `At least one of the specified keys must be defined: ${keys.join(', ')}`;

/**
 * A Zod refinement function that ensures at least one of the specified keys in a Zod object schema is defined.
 * This is useful for validating input where at least one of several optional fields must be provided.
 *
 * ```ts
 * const mySchema = atLeastOneDefined(
 *   z.object({
 *     name: z.string().optional(),
 *     email: z.string().email().optional(),
 *     phone: z.string().optional(),
 *   })
 * );
 *
 * // Valid: { name: "Alice" }, { email: "alice@example.com" }, { phone: "123-456-7890" }
 * // Invalid: {}, { name: undefined, email: undefined, phone: undefined }
 * ```
 */
export const atLeastOneDefined = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  const keys = Object.keys(schema.shape) as (keyof T)[];

  return schema.refine(
    (value) =>
      keys.some(
        (key) =>
          (value as Record<keyof T, unknown>)[key] !== undefined && (value as Record<keyof T, unknown>)[key] !== null
      ),
    { message: AT_LEAST_ONE_DEFINED_ERROR(keys) }
  );
};

/**
 * Transforms a string to a number (when passing query parameters).
 * Example usage: `asQueryNumber(z.number())('123') = 123`
 */
export const asQueryNumber = <T extends z.ZodNumber>(schema: T) =>
  z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), schema);

/**
 * Transforms various string representations of boolean values into actual booleans.
 * See POSITIVE_VALUES and NEGATIVE_VALUES arrays below for supported inputs.
 */
export const asQueryBoolean = <T extends z.ZodTypeAny>(schema: T) => {
  const POSITIVE_VALUES = ['1', 'true', 'yes', 'y', 'on'];
  const NEGATIVE_VALUES = ['0', 'false', 'no', 'n', 'off'];

  return z.preprocess((value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (POSITIVE_VALUES.includes(normalized)) return true;
      if (NEGATIVE_VALUES.includes(normalized)) return false;
    }
    return value;
  }, schema);
};
