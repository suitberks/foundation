/**
 * A utility type that represents a value that can be of type T or null.
 * Commonly used for optional fields in data models or function return types.
 *
 * ```
 * export type ObjectSelect = XOR<
 *   Pick<Object, 'id'>,
 *   Pick<Object, 'anotherUniqueField'>
 * >;
 */
export type XOR<T, U> = (T & { [K in keyof U]?: never }) | (U & { [K in keyof T]?: never });
