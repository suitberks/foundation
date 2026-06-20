import type { Simplify } from '@/utilities/type.utilities';

/**
 * A utility type that represents a value that can be of type T or null.
 * Commonly used for optional fields in data models or function return types.
 *
 * ```ts
 * export type ObjectSelect = XOR<
 *   Pick<Object, 'id'>,
 *   Pick<Object, 'anotherUniqueField'>
 * >;
 */
export type XOR<T, U> = Simplify<T & { [K in keyof U]?: never }> | Simplify<U & { [K in keyof T]?: never }>;

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
