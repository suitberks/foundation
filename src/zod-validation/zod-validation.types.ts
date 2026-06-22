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
