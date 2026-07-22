/**
 * Recursively replaces dots in a string literal with underscores.
 * Every other character remains unchanged in the resulting type.
 *
 * @example
 * type Key = ReplaceDotsWithUnderscores<'foo.bar.baz'>; // `foo_bar_baz`
 */
export type ReplaceDotsWithUnderscores<TValue extends string> = TValue extends `${infer Head}.${infer Tail}`
  ? `${Head}_${ReplaceDotsWithUnderscores<Tail>}`
  : TValue;

/**
 * Maps string literals to immutable uppercase enum-like keys.
 * Dots become underscores while every value preserves its original literal.
 *
 * @example
 * type Statuses = StringEnumRecord<readonly ['review.pending', 'published']>;
 */
export type StringEnumRecord<TValues extends readonly string[]> = Readonly<{
  [Value in TValues[number] as Uppercase<ReplaceDotsWithUnderscores<Value>>]: Value;
}>;

/**
 * Creates an immutable enum-like record from a readonly string array.
 * Keys are uppercased and every dot is replaced with an underscore.
 *
 * @example
 * createStringEnumRecord(['foo.s', 'baz'] as const); // `{ FOO_S: 'foo.s', BAZ: 'baz' }`
 */
export function createStringEnumRecord<const T extends readonly string[]>(values: T): StringEnumRecord<T> {
  return Object.freeze(
    Object.fromEntries(values.map((value) => [value.replace(/\./g, '_').toUpperCase(), value]))
  ) as StringEnumRecord<T>;
}
