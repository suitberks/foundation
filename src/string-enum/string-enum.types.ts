/**
 * Recursively replaces every dot in one string literal with an underscore.
 * Every other character remains unchanged in the resulting literal type.
 *
 * @example
 * type Key = ReplaceDotsWithUnderscores<'foo.bar.baz'>; // ← `foo_bar_baz`
 */
export type ReplaceDotsWithUnderscores<TValue extends string> = TValue extends `${infer THead}.${infer TTail}`
  ? `${ReplaceDotsWithUnderscores<THead>}_${ReplaceDotsWithUnderscores<TTail>}`
  : TValue;

/**
 * Recursively replaces hyphens in a string literal with underscores.
 * Every other character remains unchanged in the resulting literal type.
 *
 * @example
 * type Key = ReplaceHyphensWithUnderscores<'foo-bar-baz'>; // ← `foo_bar_baz`
 */
export type ReplaceHyphensWithUnderscores<TValue extends string> = TValue extends `${infer THead}-${infer TTail}`
  ? `${ReplaceHyphensWithUnderscores<THead>}_${ReplaceHyphensWithUnderscores<TTail>}`
  : TValue;

/**
 * Determines whether one character may precede an inserted camelCase separator.
 * Lowercase letters and digits qualify while capitals and symbols never do.
 *
 * @example
 * type Prefix = IsCamelCaseBoundaryPrefix<'a'>; // ← `true`
 */
export type IsCamelCaseBoundaryPrefix<TCharacter extends string> =
  TCharacter extends Uppercase<TCharacter>
    ? '0123456789' extends `${string}${TCharacter}${string}`
      ? true
      : false
    : true;

/**
 * Inserts underscores where a lowercase letter or digit precedes a capital letter.
 * Consecutive capitals stay grouped while all other characters remain unchanged.
 */
export type SeparateCamelCase<
  TValue extends string,
  TPreviousIsBoundaryPrefix extends boolean = false,
> = TValue extends `${infer TCharacter}${infer TRest}`
  ? TCharacter extends Lowercase<TCharacter>
    ? `${TCharacter}${SeparateCamelCase<TRest, IsCamelCaseBoundaryPrefix<TCharacter>>}`
    : TPreviousIsBoundaryPrefix extends true
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
