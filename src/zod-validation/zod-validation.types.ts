import type { Simplify } from '@/utilities/type.utilities';

// A union type representing all primitive types that can be directly serialized to query parameters.
type QueryPrimitive = string | number | boolean | bigint | Date | null | undefined;

/**
 * Type utility that recursively transforms all fields to string, as well as handling arrays and objects.
 * This is useful for serializing complex data structures into query parameters, which must be strings.
 */
export type AsQuery<T> = T extends QueryPrimitive
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
