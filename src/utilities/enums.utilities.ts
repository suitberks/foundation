/**
 * Recursively replaces dots in a string with underscores in a type-safe manner.
 * Example: `ReplaceDotsWithUnderscores<'foo.bar.baz.ok'>` → `'foo_bar_baz_ok'`.
 */
export type ReplaceDotsWithUnderscores<T extends string> = T extends `${infer A}.${infer B}`
  ? `${A}_${ReplaceDotsWithUnderscores<B>}`
  : T;

/**
 * Type-safe record mapping string values to ergonomic enum-like keys.
 * Keys are uppercased and dots are replaced with underscores.
 */
export type StringEnumRecord<T extends readonly string[]> = Readonly<{
  [Value in T[number] as Uppercase<ReplaceDotsWithUnderscores<Value>>]: Value;
}>;

/**
 * Creates an immutable enum-like record from a readonly string array.
 * Example: `['foo.s', 'baz'] as const` → `{ FOO_S: 'foo.s', BAZ: 'baz' }`.
 */
export function createStringEnumRecord<const T extends readonly string[]>(values: T): StringEnumRecord<T> {
  return Object.freeze(
    Object.fromEntries(values.map((value) => [value.replace(/\./g, '_').toUpperCase(), value]))
  ) as StringEnumRecord<T>;
}
