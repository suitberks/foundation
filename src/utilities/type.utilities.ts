/**
 * Utility type that simplifies a given type T by flattening its structure.
 * This is particularly useful for improving the readability of complex types.
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};
