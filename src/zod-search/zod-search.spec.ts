import { describe, expect, test } from 'bun:test';
import { z } from 'zod';

import { type AtLeastOne, zodPaginationSchema, zodSearchSchema } from '@/index';

// =====================================================================================================================
// COMPILE-TIME CONTRACT SUPPORT
// =====================================================================================================================

/**
 * Shared compile-time helpers keep inferred public contracts visible beside runtime checks.
 * They intentionally disappear from emitted JavaScript and add no test-only runtime paths.
 */
type IsExact<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2
    ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends Actual ? 1 : 2
      ? true
      : false
    : false;
type Assert<Condition extends true> = Condition;

const filterFieldsSchema = z.object({
  status: z.enum(['active', 'paused']),
  ownerId: z.coerce.number().int().positive(),
  archived: z.boolean(),
});

const filtersSearchSchema = zodSearchSchema({ filters: filterFieldsSchema });

// This prepared pipeline owns both its accepted wire shape and its normalized domain output.
// Search composition must preserve the complete ZodPipe rather than rebuilding its object shape.
const preparedWhereSchema = z
  .object({ externalId: z.string().regex(/^\d+$/) })
  .transform(({ externalId }) => ({ id: Number(externalId) }))
  .pipe(z.object({ id: z.number().int().positive() }));
const preparedSearchSchema = zodSearchSchema({ whereSchema: preparedWhereSchema });

const flagsDisabledSearchSchema = zodSearchSchema({
  filters: z.object({ status: z.enum(['active', 'paused']) }),
  queryEnabled: false,
  paginationEnabled: false,
});

// =====================================================================================================================
// RUNTIME CONTRACTS
// =====================================================================================================================

describe('zodPaginationSchema runtime contracts', () => {
  test('applies defaults and coerces URL-style pagination values', () => {
    expect(zodPaginationSchema.parse({})).toEqual({ offset: 0, limit: 10 });
    expect(zodPaginationSchema.parse({ offset: '20', limit: '5' })).toEqual({ offset: 20, limit: 5 });
  });

  test('rejects negative, fractional, and non-positive pagination boundaries', () => {
    const invalidPaginationValues = [
      { offset: -1, limit: 10 },
      { offset: 1.5, limit: 10 },
      { offset: 0, limit: 0 },
      { offset: 0, limit: -1 },
    ] as const;

    for (const pagination of invalidPaginationValues) {
      expect(zodPaginationSchema.safeParse(pagination).success).toBe(false);
    }
  });
});

describe('zodSearchSchema filters mode runtime contracts', () => {
  test('parses partial filters, a trimmed query, and defaulted pagination', () => {
    expect(
      filtersSearchSchema.parse({
        where: { ownerId: '7' },
        query: '  quarterly report  ',
        pagination: {},
      })
    ).toEqual({
      where: { ownerId: 7 },
      query: 'quarterly report',
      pagination: { offset: 0, limit: 10 },
    });

    // The whole where object is optional, while supplied filters may use any single defined field.
    // This distinction supports unfiltered searches without accepting a meaningless empty object.
    expect(filtersSearchSchema.parse({ pagination: { offset: 10, limit: 20 } })).toEqual({
      pagination: { offset: 10, limit: 20 },
    });
  });

  test('requires at least one defined filter whenever where is supplied', () => {
    expect(filtersSearchSchema.safeParse({ where: {}, pagination: {} }).success).toBe(false);
    expect(
      filtersSearchSchema.safeParse({
        where: { status: undefined, ownerId: undefined, archived: undefined },
        pagination: {},
      }).success
    ).toBe(false);
  });

  test('keeps pagination required and query optional but non-empty', () => {
    expect(filtersSearchSchema.safeParse({ where: { status: 'active' } }).success).toBe(false);
    expect(filtersSearchSchema.safeParse({ query: '   ', pagination: {} }).success).toBe(false);
    expect(filtersSearchSchema.safeParse({ query: '', pagination: {} }).success).toBe(false);
    expect(filtersSearchSchema.safeParse({ query: 'visible', pagination: {} }).success).toBe(true);
  });
});

describe('zodSearchSchema prepared whereSchema runtime contracts', () => {
  test('preserves ZodPipe validation and transformed output', () => {
    expect(preparedWhereSchema).toBeInstanceOf(z.ZodPipe);
    expect(
      preparedSearchSchema.parse({
        where: { externalId: '42' },
        pagination: { offset: '5', limit: '15' },
      })
    ).toEqual({
      where: { id: 42 },
      pagination: { offset: 5, limit: 15 },
    });

    expect(preparedSearchSchema.safeParse({ where: { externalId: 'not-a-number' }, pagination: {} }).success).toBe(
      false
    );
    expect(preparedSearchSchema.safeParse({ where: { externalId: '0' }, pagination: {} }).success).toBe(false);
  });
});

describe('zodSearchSchema flags and strictness runtime contracts', () => {
  test('removes disabled query and pagination fields from runtime and output', () => {
    expect(flagsDisabledSearchSchema.parse({})).toEqual({});
    expect(flagsDisabledSearchSchema.parse({ where: { status: 'active' } })).toEqual({
      where: { status: 'active' },
    });

    // Disabled features are absent keys in a strict schema, not accepted values that are later discarded.
    // Consequently, stale clients receive a validation failure instead of silently changing semantics.
    expect(flagsDisabledSearchSchema.safeParse({ query: 'hidden' }).success).toBe(false);
    expect(flagsDisabledSearchSchema.safeParse({ pagination: {} }).success).toBe(false);
  });

  test('rejects unknown top-level fields in every composition mode', () => {
    expect(filtersSearchSchema.safeParse({ pagination: {}, unexpected: true }).success).toBe(false);
    expect(preparedSearchSchema.safeParse({ pagination: {}, unexpected: true }).success).toBe(false);
    expect(flagsDisabledSearchSchema.safeParse({ unexpected: true }).success).toBe(false);
  });
});

// =====================================================================================================================
// COMPILE-TIME CONTRACTS
// =====================================================================================================================

type ExpectedFilterWhere = AtLeastOne<{
  status?: 'active' | 'paused';
  ownerId?: number;
  archived?: boolean;
}>;

/**
 * Exact output assertions protect defaults, optional fields, feature flags, and ZodPipe transforms.
 * Negative assignments also prove unsupported option combinations remain compile-time failures.
 */
type _PaginationOutputIsExact = Assert<IsExact<z.infer<typeof zodPaginationSchema>, { offset: number; limit: number }>>;
type _FiltersOutputIsExact = Assert<
  IsExact<
    z.infer<typeof filtersSearchSchema>,
    {
      where?: ExpectedFilterWhere;
      query?: string;
      pagination: { offset: number; limit: number };
    }
  >
>;
type _PreparedOutputIsExact = Assert<
  IsExact<
    z.infer<typeof preparedSearchSchema>,
    {
      where?: { id: number };
      query?: string;
      pagination: { offset: number; limit: number };
    }
  >
>;
type _DisabledOutputIsExact = Assert<
  IsExact<
    z.infer<typeof flagsDisabledSearchSchema>,
    {
      where?: AtLeastOne<{ status?: 'active' | 'paused' }>;
    }
  >
>;

// @ts-expect-error Default search output always contains required pagination.
const _missingPagination: z.infer<typeof filtersSearchSchema> = {};

// @ts-expect-error Filters-mode output requires at least one field when where is present.
const _emptyFilterOutput: z.infer<typeof filtersSearchSchema> = { where: {}, pagination: { offset: 0, limit: 10 } };

const _untransformedPreparedOutput: z.infer<typeof preparedSearchSchema> = {
  // @ts-expect-error Prepared output exposes the transformed id, not the pipeline input field.
  where: { externalId: '42' },
  pagination: { offset: 0, limit: 10 },
};

// @ts-expect-error Literal false flags remove query and pagination from the inferred output.
const _disabledFeatureOutput: z.infer<typeof flagsDisabledSearchSchema> = { query: 'not available' };

const _assertInvalidSearchOptions = () => {
  // Keeping invalid factory calls inside an uninvoked function gives TypeScript real expressions to check.
  // It also prevents intentionally malformed options from throwing while Bun evaluates this test module.

  // @ts-expect-error Search composition requires exactly one where source.
  zodSearchSchema({});

  // @ts-expect-error Automatic filters and a prepared whereSchema are mutually exclusive.
  zodSearchSchema({ filters: filterFieldsSchema, whereSchema: preparedWhereSchema });
};
