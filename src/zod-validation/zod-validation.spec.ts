import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { type AsQuery, type AtLeastOne, asQuery, isPlainObject, parseQueryValue, zodAtLeastOne } from '@/index';

// =====================================================================================================================
// COMPILE-TIME CONTRACT SUPPORT
// =====================================================================================================================

/**
 * Compares public types in both assignability directions for exactness.
 * These assertions run during typecheck while remaining beside runtime behavior tests.
 */
type IsExact<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2
    ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends Actual ? 1 : 2
      ? true
      : false
    : false;

/**
 * Constrains a compile-time proposition to true and fails typecheck otherwise.
 * Underscore-prefixed aliases document intentional type-only test declarations.
 */
type Assert<Condition extends true> = Condition;

type QuerySource = {
  page: number;
  enabled: boolean;
  createdAt: Date;
  identifiers: readonly bigint[];
  nested?: { label: string | null; score: number };
};

type _AsQueryContract = Assert<
  IsExact<
    AsQuery<QuerySource>,
    {
      page: string;
      enabled: string;
      createdAt: string;
      identifiers: string[];
      nested?: { label: string | null; score: string };
    }
  >
>;
type _AsQueryPrimitiveContract = Assert<IsExact<AsQuery<symbol>, string>>;

type Patch = { name?: string; count?: number; enabled?: boolean };

const _patchByName = { name: 'foundation' } satisfies AtLeastOne<Patch>;
const _patchByCountAndFlag = { count: 0, enabled: false } satisfies AtLeastOne<Patch>;

// Presence must be semantic: an empty object does not satisfy an update requiring at least one value.
// @ts-expect-error -- AtLeastOne requires one selected property to be present with a defined value.
const _emptyPatch: AtLeastOne<Patch> = {};

// Optional properties include undefined at input sites, but selecting one must make its value concrete.
// @ts-expect-error -- An explicitly undefined member does not satisfy the selected required branch.
const _undefinedPatch: AtLeastOne<Patch> = { name: undefined };

const _queryContractSchema = asQuery(z.object({ page: z.number(), enabled: z.boolean() }));
type _AsQueryOutputContract = Assert<
  IsExact<z.output<typeof _queryContractSchema>, { page: number; enabled: boolean }>
>;
type _AsQueryInputContract = Assert<IsExact<z.input<typeof _queryContractSchema>, unknown>>;

const _patchContractSchema = zodAtLeastOne(
  z.object({ name: z.string().optional(), count: z.number().optional(), enabled: z.boolean().optional() })
);
type _AtLeastOneSchemaOutputContract = Assert<IsExact<z.output<typeof _patchContractSchema>, AtLeastOne<Patch>>>;

// =====================================================================================================================
// PLAIN-OBJECT RECOGNITION
// =====================================================================================================================

describe('isPlainObject', () => {
  test('accepts ordinary records regardless of whether they are empty', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ nested: { value: 1 } })).toBe(true);
  });

  test.each([[null], [undefined], ['value'], [42], [true], [[]], [new Date()], [/pattern/], [new Map()]] as const)(
    'rejects non-record input %#',
    (value) => {
      // Native object instances carry behavior and must not be traversed as query dictionaries.
      expect(isPlainObject(value)).toBe(false);
    }
  );
});

// =====================================================================================================================
// RECURSIVE QUERY VALUE PARSING
// =====================================================================================================================

describe('parseQueryValue', () => {
  test.each([
    ['true', true],
    [' TRUE ', true],
    ['false', false],
    [' FaLsE ', false],
  ] as const)('coerces the unambiguous boolean query value %p', (input, expected) => {
    expect(parseQueryValue(input)).toBe(expected);
  });

  test.each([
    ['0', 0],
    ['-42', -42],
    ['+3.5', 3.5],
    ['.75', 0.75],
    ['5.', 5],
    ['1e3', 1000],
    [' -2.5E-2 ', -0.025],
  ] as const)('coerces the complete decimal numeric query value %p', (input, expected) => {
    expect(parseQueryValue(input)).toBe(expected);
  });

  test.each(['', '   ', 'null', 'undefined', 'yes', '0x10', '1_000', '1.2.3', '12px', '+', 'Infinity', 'NaN'])(
    'preserves ambiguous or malformed string input %p',
    (input) => {
      // Preserving the original string lets the downstream Zod schema decide whether it is valid.
      expect(parseQueryValue(input)).toBe(input);
    }
  );

  test('recursively parses nested records and arrays without mutating the source', () => {
    const source = {
      page: ' 002 ',
      enabled: 'FALSE',
      nested: { ratio: '.5', label: '  Keep Me  ' },
      values: ['1', 'true', '1e3', ''],
    };

    expect(parseQueryValue(source)).toEqual({
      page: 2,
      enabled: false,
      nested: { ratio: 0.5, label: '  Keep Me  ' },
      values: [1, true, 1000, ''],
    });
    expect(source).toEqual({
      page: ' 002 ',
      enabled: 'FALSE',
      nested: { ratio: '.5', label: '  Keep Me  ' },
      values: ['1', 'true', '1e3', ''],
    });
  });

  test('preserves non-string primitives and native object instances by identity', () => {
    const date = new Date('2024-01-02T00:00:00.000Z');
    const values = [null, undefined, 12, false, 10n, date] as const;

    for (const value of values) expect(parseQueryValue(value)).toBe(value);
  });
});

// =====================================================================================================================
// ZOD QUERY PREPROCESSING
// =====================================================================================================================

describe('asQuery', () => {
  const schema = asQuery(
    z
      .object({
        page: z.number().int().positive(),
        enabled: z.boolean(),
        filters: z.object({ minimum: z.number(), exact: z.boolean() }),
        values: z.array(z.number()),
        label: z.string(),
      })
      .strict()
  );

  test('preprocesses a complete nested query payload before ordinary Zod validation', () => {
    expect(
      schema.parse({
        page: '2',
        enabled: 'true',
        filters: { minimum: '-3.5', exact: 'false' },
        values: ['1', '2.5'],
        label: 'foundation',
      })
    ).toEqual({
      page: 2,
      enabled: true,
      filters: { minimum: -3.5, exact: false },
      values: [1, 2.5],
      label: 'foundation',
    });
  });

  test('leaves downstream schemas responsible for malformed and domain-invalid input', () => {
    expect(
      schema.safeParse({
        page: '0',
        enabled: 'yes',
        filters: { minimum: 'not-a-number', exact: 'false' },
        values: ['1'],
        label: 'foundation',
      }).success
    ).toBe(false);
  });

  test('does not coerce numeric-looking text when the target contract requires a string', () => {
    const identifierSchema = asQuery(z.object({ identifier: z.string() }));

    // Global preprocessing intentionally treats a purely numeric token as a number, so Zod rejects it as a string ID.
    expect(identifierSchema.safeParse({ identifier: '007' }).success).toBe(false);
    expect(identifierSchema.parse({ identifier: 'user-007' })).toEqual({ identifier: 'user-007' });
  });

  test('preserves Date values for schemas that intentionally accept dates', () => {
    const date = new Date('2024-01-02T00:00:00.000Z');

    expect(asQuery(z.date()).parse(date)).toBe(date);
  });
});

// =====================================================================================================================
// AT-LEAST-ONE OBJECT VALIDATION
// =====================================================================================================================

describe('zodAtLeastOne', () => {
  const schema = zodAtLeastOne(
    z
      .object({
        name: z.string().optional(),
        count: z.number().optional(),
        enabled: z.boolean().optional(),
        nullable: z.string().nullable().optional(),
      })
      .strict()
  );

  test.each([{ name: '' }, { count: 0 }, { enabled: false }, { nullable: null }, { name: 'value', count: 2 }])(
    'accepts any defined field value, including falsy and null values: %o',
    (value) => {
      // The contract is presence, not truthiness; valid falsy domain values must survive unchanged.
      expect(schema.parse(value)).toEqual(value);
    }
  );

  test.each([{}, { name: undefined }, { count: undefined, enabled: undefined }])(
    'rejects objects with no semantically provided field: %o',
    (value) => {
      const result = schema.safeParse(value);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual({
          code: 'custom',
          message: 'Invalid input. At least one field must be provided.',
          path: [],
        });
      }
    }
  );

  test('retains the wrapped schema validation before applying the presence contract', () => {
    const result = schema.safeParse({ count: 'not-a-number' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe('invalid_type');
    }
  });

  test('retains strict unknown-key behavior from the wrapped object schema', () => {
    const result = schema.safeParse({ name: 'valid', unexpected: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe('unrecognized_keys');
    }
  });
});
