import type { StringEnumRecord } from './string-enum.types';

/**
 * Creates an immutable enum-like record from one readonly string literal array.
 * Keys become upper snake case across camelCase, dotted, and hyphenated values.
 *
 * @example
 * createStringEnumRecord(['foo-bar.s', 'baz'] as const);
 * // ↑ `{ FOO_BAR_S: 'foo-bar.s', BAZ: 'baz' }`
 */
export function createStringEnumRecord<const TValues extends readonly string[]>(
  values: TValues
): StringEnumRecord<TValues> {
  // ↓ `Object.fromEntries` cannot retain the mapped key relation described by `StringEnumRecord`.
  // ↓ Every runtime key and value still derives from one source tuple before the record freezes.

  return Object.freeze(
    Object.fromEntries(
      values.map((value) => [
        value
          .replaceAll(/([\p{Ll}\d])(\p{Lu})/gu, '$1_$2')
          .replaceAll(/[.-]/g, '_')
          .toUpperCase(),
        value,
      ])
    )
  ) as StringEnumRecord<TValues>;
}
