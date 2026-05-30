import { type ZodNumber, z } from 'zod';

/**
 * Type utility that recursively transforms all Date fields to string, as well as handling arrays and objects.
 * This is necessary for proper typing when working with RPC, as JSON does not support the Date type directly.
 * Example usage: `SerializeDates<{ createdAt: Date; nested: { updatedAt: Date }; tags: Date[] }>` \
 * = `{ createdAt: string; nested: { updatedAt: string }; tags: string[] }`
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

// A union type representing all primitive types that can be directly serialized to query parameters.
type QueryPrimitive = string | number | boolean | bigint | Date | null | undefined;

/**
 * Type utility that recursively transforms all fields to string, as well as handling arrays and objects.
 * This is useful for serializing complex data structures into query parameters, which must be strings.
 * Example usage: `AsQuery<{ id: number; name: string; tags: string[] }>` = `{ id: string; name: string; tags: string[] }`
 */
export type AsQuery<T> = T extends QueryPrimitive
  ? string
  : T extends readonly (infer Item)[]
    ? AsQuery<Item>[]
    : T extends object
      ? { [Key in keyof T]: AsQuery<T[Key]> }
      : string;

/**
 * Transforms a string to a number (when passing query parameters).
 * Example usage: `asQueryNumber(z.number())('123') = 123`
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
