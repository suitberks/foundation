/**
 * Recursively replaces dots in a string literal with underscores.
 * Every other character remains unchanged in the resulting literal type.
 *
 * @example
 * type Key = ReplaceDotsWithUnderscores<'foo.bar.baz'>; // `foo_bar_baz`
 */
export type ReplaceDotsWithUnderscores<TValue extends string> = TValue extends `${infer THead}.${infer TTail}`
  ? `${ReplaceDotsWithUnderscores<THead>}_${ReplaceDotsWithUnderscores<TTail>}`
  : TValue;

/**
 * Recursively replaces hyphens in a string literal with underscores.
 * Every other character remains unchanged in the resulting literal type.
 *
 * @example
 * type Key = ReplaceHyphensWithUnderscores<'foo-bar-baz'>; // `foo_bar_baz`
 */
export type ReplaceHyphensWithUnderscores<TValue extends string> = TValue extends `${infer THead}-${infer TTail}`
  ? `${ReplaceHyphensWithUnderscores<THead>}_${ReplaceHyphensWithUnderscores<TTail>}`
  : TValue;

/**
 * Inserts underscores at lowercase-to-uppercase boundaries in a string literal.
 * Existing separators reset boundary tracking while consecutive capitals remain grouped.
 */
export type SeparateCamelCase<
  TValue extends string,
  TPreviousWasLowercase extends boolean = false,
> = TValue extends `${infer TCharacter}${infer TRest}`
  ? TCharacter extends '.' | '-'
    ? `${TCharacter}${SeparateCamelCase<TRest>}`
    : TCharacter extends Lowercase<TCharacter>
      ? `${TCharacter}${SeparateCamelCase<TRest, true>}`
      : TPreviousWasLowercase extends true
        ? `_${TCharacter}${SeparateCamelCase<TRest>}`
        : `${TCharacter}${SeparateCamelCase<TRest>}`
  : TValue;

/**
 * Converts one supported string literal into its uppercase enum-record key.
 * CamelCase boundaries, dots, and hyphens consistently become underscores.
 */
export type StringEnumKey<TValue extends string> = Uppercase<
  ReplaceHyphensWithUnderscores<ReplaceDotsWithUnderscores<SeparateCamelCase<TValue>>>
>;

/**
 * Maps a readonly string-literal collection into an immutable enum-like record.
 * Normalized uppercase keys retain their original source literals as record values.
 *
 * @example
 * type Statuses = StringEnumRecord<readonly ['review.pending', 'published']>;
 */
export type StringEnumRecord<TValues extends readonly string[]> = Readonly<{
  [TValue in TValues[number] as StringEnumKey<TValue>]: TValue;
}>;
