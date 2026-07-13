import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import {
  type ZodBulkExcludeSelection,
  type ZodBulkIncludeSelection,
  type ZodBulkSelection,
  zodBulkSelectionSchema,
} from '@/index';

/**
 * Shared compile-time helpers keep inferred public contracts visible beside runtime checks.
 * They intentionally disappear from emitted JavaScript and add no test-only runtime paths.
 */
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Expect<Value extends true> = Value;

const stringSelectionSchema = zodBulkSelectionSchema({ identifierSchema: z.string().min(1) });
const coercedSelectionSchema = zodBulkSelectionSchema({ identifierSchema: z.coerce.number().int().positive() });

// The transform deliberately canonicalizes several valid wire representations into one identifier.
// Besides proving output preservation, this lets duplicate checks exercise post-transform equality.
const canonicalSelectionSchema = zodBulkSelectionSchema({
  identifierSchema: z
    .string()
    .trim()
    .regex(/^asset-\d+$/)
    .transform((identifier): `asset:${number}` => `asset:${Number(identifier.slice('asset-'.length))}`),
});

// Runtime contracts ------------------------------------------------------------

describe('zodBulkSelectionSchema runtime contracts', () => {
  test('parses include and exclude branches without leaking fields between them', () => {
    expect(stringSelectionSchema.parse({ mode: 'include', identifiers: ['asset-1', 'asset-2'] })).toEqual({
      mode: 'include',
      identifiers: ['asset-1', 'asset-2'],
    });

    expect(stringSelectionSchema.parse({ mode: 'exclude', excludedIdentifiers: ['asset-3'] })).toEqual({
      mode: 'exclude',
      excludedIdentifiers: ['asset-3'],
    });
  });

  test('keeps each discriminated branch strict', () => {
    // Cross-branch fields must not be silently stripped: accepting them would make client intent ambiguous.
    // The same strictness also rejects unrelated keys instead of allowing payload drift over time.
    const invalidSelections = [
      { mode: 'include', identifiers: ['asset-1'], excludedIdentifiers: [] },
      { mode: 'exclude', excludedIdentifiers: ['asset-1'], identifiers: [] },
      { mode: 'include', identifiers: ['asset-1'], unexpected: true },
      { mode: 'exclude', excludedIdentifiers: [], unexpected: true },
    ] as const;

    for (const selection of invalidSelections) {
      expect(stringSelectionSchema.safeParse(selection).success).toBe(false);
    }
  });

  test('rejects duplicate identifiers in both branches', () => {
    const duplicateInclude = stringSelectionSchema.safeParse({
      mode: 'include',
      identifiers: ['asset-1', 'asset-1'],
    });
    const duplicateExclude = stringSelectionSchema.safeParse({
      mode: 'exclude',
      excludedIdentifiers: ['asset-2', 'asset-2'],
    });

    expect(duplicateInclude.success).toBe(false);
    expect(duplicateExclude.success).toBe(false);

    if (!duplicateInclude.success && !duplicateExclude.success) {
      expect(duplicateInclude.error.issues[0]).toMatchObject({
        message: 'Selection identifiers must be provided.',
        path: ['identifiers'],
      });
      expect(duplicateExclude.error.issues[0]).toMatchObject({
        message: 'Selection identifiers must be provided.',
        path: ['excludedIdentifiers'],
      });
    }
  });

  test('preserves custom and coerced identifier outputs', () => {
    expect(
      canonicalSelectionSchema.parse({
        mode: 'include',
        identifiers: [' asset-7 ', 'asset-42'],
      })
    ).toEqual({ mode: 'include', identifiers: ['asset:7', 'asset:42'] });

    expect(
      coercedSelectionSchema.parse({
        mode: 'exclude',
        excludedIdentifiers: ['7', 42],
      })
    ).toEqual({ mode: 'exclude', excludedIdentifiers: [7, 42] });
  });

  test('detects duplicates after custom transforms and coercion', () => {
    // Raw inputs differ in each assertion, so a pre-parse Set check would incorrectly accept both payloads.
    // Canonical outputs are equal, which is the identity actually consumed by bulk-operation handlers.
    expect(
      canonicalSelectionSchema.safeParse({
        mode: 'include',
        identifiers: ['asset-7', 'asset-07'],
      }).success
    ).toBe(false);

    expect(
      coercedSelectionSchema.safeParse({
        mode: 'exclude',
        excludedIdentifiers: ['7', 7],
      }).success
    ).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// Compile-time contracts -------------------------------------------------------

/**
 * Public aliases must remain exact discriminated unions for safe exhaustive handler branches.
 * Factory inference must also retain transformed outputs instead of widening them to primitives.
 */
type _StringSelectionIsExact = Expect<
  Equal<
    z.infer<typeof stringSelectionSchema>,
    { mode: 'include'; identifiers: string[] } | { mode: 'exclude'; excludedIdentifiers: string[] }
  >
>;
type _StringSelectionMatchesPublicAlias = Expect<
  Equal<z.infer<typeof stringSelectionSchema>, ZodBulkSelection<string>>
>;
type _CoercedSelectionIsExact = Expect<
  Equal<
    z.infer<typeof coercedSelectionSchema>,
    { mode: 'include'; identifiers: number[] } | { mode: 'exclude'; excludedIdentifiers: number[] }
  >
>;
type _CanonicalSelectionIsExact = Expect<
  Equal<
    z.infer<typeof canonicalSelectionSchema>,
    | { mode: 'include'; identifiers: `asset:${number}`[] }
    | { mode: 'exclude'; excludedIdentifiers: `asset:${number}`[] }
  >
>;
type _IncludeAliasIsExact = Expect<Equal<ZodBulkIncludeSelection<number>, { mode: 'include'; identifiers: number[] }>>;
type _ExcludeAliasIsExact = Expect<
  Equal<ZodBulkExcludeSelection<number>, { mode: 'exclude'; excludedIdentifiers: number[] }>
>;

// @ts-expect-error Include selections cannot carry the exclude-branch payload.
const _invalidIncludeSelection: ZodBulkIncludeSelection<number> = { mode: 'include', excludedIdentifiers: [1] };

// @ts-expect-error Exclude selections cannot carry the include-branch payload.
const _invalidExcludeSelection: ZodBulkExcludeSelection<string> = { mode: 'exclude', identifiers: ['asset-1'] };

// @ts-expect-error Identifier schemas must produce a public string-or-number identifier.
const _invalidIdentifierSchema = zodBulkSelectionSchema({ identifierSchema: z.boolean() });

// -----------------------------------------------------------------------------
