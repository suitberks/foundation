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

// These helpers separate lowercase-to-uppercase boundaries while preserving acronym runs;
// Separator characters reset the boundary so dotted and hyphenated values remain stable;

type SeparateCamelCase<
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

type StringEnumKey<TValue extends string> = Uppercase<
  ReplaceHyphensWithUnderscores<ReplaceDotsWithUnderscores<SeparateCamelCase<TValue>>>
>;

/**
 * Maps string literals to immutable uppercase enum-like keys.
 * CamelCase boundaries, dots, and hyphens become underscores while values remain unchanged.
 *
 * @example
 * type Statuses = StringEnumRecord<readonly ['review.pending', 'published']>;
 */
export type StringEnumRecord<TValues extends readonly string[]> = Readonly<{
  [TValue in TValues[number] as StringEnumKey<TValue>]: TValue;
}>;
