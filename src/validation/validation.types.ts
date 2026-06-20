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
