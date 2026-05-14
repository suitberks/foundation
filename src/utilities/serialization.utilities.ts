import { type ZodNumber, z } from 'zod';

/**
 * Type utility that recursively transforms all Date fields to string, as well as handling arrays and objects.
 * This is necessary for proper typing when working with RPC, as JSON does not support the Date type directly.
 * Example: SerializeDates<{ createdAt: Date; nested: { updatedAt: Date }; tags: Date[] }> \
 * = { createdAt: string; nested: { updatedAt: string }; tags: string[] }
 */
export type SerializeDates<T> = T extends Date
  ? string
  : T extends (infer U)[] // Arrays
    ? SerializeDates<U>[]
    : T extends readonly (infer U)[]
      ? readonly SerializeDates<U>[]
      : T extends object // Object
        ? { [K in keyof T]: SerializeDates<T[K]> }
        : T;

/**
 * Transforms a string to a number (when passing query parameters).
 * Example: asQueryNumber(z.number())('123') = 123
 */
export const asQueryNumber = <T extends ZodNumber>(schema: T) =>
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
