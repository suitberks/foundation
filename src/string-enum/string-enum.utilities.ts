import type { StringEnumRecord } from './string-enum.types';

/**
 * Creates an immutable enum-like record from a readonly string formatted array.
 * Keys become upper snake case across camelCase, dotted, and hyphenated values.
 *
 * @example
 * createStringEnumRecord(['foo-bar.s', 'baz'] as const); // `{ FOO_BAR_S: 'foo-bar.s', BAZ: 'baz' }`
 */
export function createStringEnumRecord<const TValues extends readonly string[]>(
  values: TValues
): StringEnumRecord<TValues> {
  // ↓ `Object.fromEntries` cannot retain the mapped relationship represented by `StringEnumRecord`.
  // ↓ Every runtime key and value still derives from the same source tuple before the record is frozen.

  return Object.freeze(
    Object.fromEntries(
      values.map((value) => [
        value
          .replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2')
          .replaceAll(/[.-]/g, '_')
          .toUpperCase(),
        value,
      ])
    )
  ) as StringEnumRecord<TValues>;
}
