import z from 'zod';

/**
 * Transforms a string to a number (when passing query parameters).
 * Example usage: `asQueryNumber(z.number())('123') = 123`
 */
export const asQueryNumber = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    if (value.trim() === '') return value;

    return Number(value);
  }, schema);

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
