import z from 'zod';

import { AT_LEAST_ONE_DEFINED_ERROR } from './validation.messages';
import type { AtLeastOne } from './validation.types';

/**
 * Refines a Zod object schema to ensure that at least one of its keys is defined.
 * This is useful for validating objects where at least one property must be present.
 *
 * ```ts
 * const mySchema = z.object({
 *   a: z.string()
 *   b: z.number()
 * }).refine(atLeastOneDefined);
 * ```
 */
export const atLeastOneDefined = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodType<AtLeastOne<z.infer<z.ZodObject<T>>>> => {
  const keys = Object.keys(schema.shape) as (keyof T)[];

  return schema
    .partial()
    .refine((value) => keys.some((key) => (value as Record<string, unknown>)[key as string] != null), {
      message: AT_LEAST_ONE_DEFINED_ERROR(keys),
    }) as unknown as z.ZodType<AtLeastOne<z.infer<z.ZodObject<T>>>>;
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
