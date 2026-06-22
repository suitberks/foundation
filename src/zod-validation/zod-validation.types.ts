import type { Simplify } from '../../dist';

// All primitive types that can be directly serialized to query parameters.
type QueryPrimitive = string | number | boolean | bigint | Date;

/**
 * Recursively transforms all fields of T to `string`, matching how query parameters are serialized.
 * Handles nested objects, arrays, and primitive values (including null and undefined as optional).
 */
export type AsQuery<T> = T extends null | undefined
  ? T
  : T extends QueryPrimitive
    ? string
    : T extends readonly (infer Item)[]
      ? AsQuery<Item>[]
      : T extends object
        ? { [Key in keyof T]: AsQuery<T[Key]> }
        : string;

/**
 * Utility type that ensures at least one property from the specified
 * keys of a given type T is required, while the rest remain optional.
 *
 * This is useful for scenarios where you want to enforce that at least one
 * of several optional (nullable) properties must be provided in an object.
 *
 * ```ts
 * type Example = AtLeastOne<{ a?: string; b?: number; c?: boolean }>;
 * // Valid: { a: "hello" }, { b: 42 }, { c: true }, { a: "hello", b: 42 }
 * // Invalid: {}, { a: undefined, b: undefined, c: undefined }
 * ```
 */
export type AtLeastOne<T, Keys extends keyof T = keyof T> = Keys extends keyof T
  ? Simplify<Required<Pick<T, Keys>> & Partial<Omit<T, Keys>>>
  : never;
