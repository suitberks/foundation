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
