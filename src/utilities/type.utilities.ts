/**
 * Utility type that simplifies a given type T by flattening its structure.
 * This is particularly useful for improving the readability of complex types.
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

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
