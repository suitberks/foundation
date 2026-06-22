import { describe, expect, it } from 'bun:test';
import z from 'zod';

import { asQuerySchema, flattenZodShape } from './zod-flatten.schemas';
import { isZodObject, isZodOptional, unwrapOptional } from './zod-flatten.utilities';

// Type equality helpers for compile-time type assertions (no runtime cost).
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// ---------------------------------------------------------------------------
// flattenZodShape — primitives
// ---------------------------------------------------------------------------

describe('flattenZodShape — primitives', () => {
  it('preserves flat string, number, and boolean fields unchanged', () => {
    const shape = { name: z.string(), age: z.number(), active: z.boolean() };
    expect(flattenZodShape(shape)).toEqual(shape);
  });

  it('preserves enum, literal, date, and union fields unchanged', () => {
    const shape = {
      role: z.enum(['admin', 'user']),
      code: z.literal('active'),
      createdAt: z.date(),
      value: z.union([z.string(), z.number()]),
    };
    expect(flattenZodShape(shape)).toEqual(shape);
  });
});

// ---------------------------------------------------------------------------
// flattenZodShape — required nested objects
// ---------------------------------------------------------------------------

describe('flattenZodShape — required nested objects', () => {
  it('removes the parent key and lifts inner fields to the top level', () => {
    const flat = flattenZodShape({ where: z.object({ id: z.string(), active: z.boolean() }) });

    expect(flat).not.toHaveProperty('where');
    expect(flat).toHaveProperty('id');
    expect(flat).toHaveProperty('active');
  });

  it('keeps required inner fields required when parent is required', () => {
    const flat = flattenZodShape({ sort: z.object({ field: z.string(), order: z.string() }) });

    expect(isZodOptional(flat.field)).toBe(false);
    expect(isZodOptional(flat.order)).toBe(false);
  });

  it('keeps already-optional inner fields optional when parent is required', () => {
    const flat = flattenZodShape({
      filter: z.object({ status: z.string(), tag: z.string().optional() }),
    });

    expect(isZodOptional(flat.status)).toBe(false);
    expect(isZodOptional(flat.tag)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// flattenZodShape — optional nested objects
// ---------------------------------------------------------------------------

describe('flattenZodShape — optional nested objects', () => {
  it('removes the parent key and lifts inner fields to the top level', () => {
    const flat = flattenZodShape({ where: z.object({ isAdmin: z.boolean() }).optional() });

    expect(flat).not.toHaveProperty('where');
    expect(flat).toHaveProperty('isAdmin');
  });

  it('wraps all promoted fields in optional when parent is optional', () => {
    const flat = flattenZodShape({
      sort: z.object({ field: z.string(), order: z.string() }).optional(),
    });

    expect(isZodOptional(flat.field)).toBe(true);
    expect(isZodOptional(flat.order)).toBe(true);
  });

  it('keeps already-optional inner fields optional when parent is optional', () => {
    const flat = flattenZodShape({
      filter: z.object({ status: z.string().optional() }).optional(),
    });

    expect(isZodOptional(flat.status)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// flattenZodShape — multiple nested objects
// ---------------------------------------------------------------------------

describe('flattenZodShape — multiple nested objects', () => {
  it('merges fields from several nested objects into one flat shape', () => {
    const flat = flattenZodShape({
      where: z.object({ id: z.string() }),
      sort: z.object({ field: z.string() }),
      limit: z.number().optional(),
    });

    expect(flat).not.toHaveProperty('where');
    expect(flat).not.toHaveProperty('sort');
    expect(flat).toHaveProperty('id');
    expect(flat).toHaveProperty('field');
    expect(flat).toHaveProperty('limit');
  });

  it('documents key collision: the last nested object with the key wins', () => {
    // When two objects share a key, iteration order (insertion) determines the winner.
    // 'b' is processed after 'a', so z.number() overwrites z.string() for 'field'.
    const schema = z.object(
      flattenZodShape({
        a: z.object({ field: z.string() }),
        b: z.object({ field: z.number() }),
      })
    );

    expect(schema.safeParse({ field: 42 }).success).toBe(true);
    expect(schema.safeParse({ field: 'hello' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// flattenZodShape — schemas that should not be flattened
// ---------------------------------------------------------------------------

describe('flattenZodShape — non-flattenable schemas', () => {
  it('does not flatten arrays of objects', () => {
    const flat = flattenZodShape({ tags: z.array(z.object({ id: z.string() })) });

    expect(flat).toHaveProperty('tags');
    expect(flat).not.toHaveProperty('id');
  });

  it('does not flatten nullable object fields (ZodNullable ≠ ZodOptional)', () => {
    const flat = flattenZodShape({ filter: z.object({ active: z.boolean() }).nullable() });

    expect(flat).toHaveProperty('filter');
    expect(flat).not.toHaveProperty('active');
  });

  it('does not flatten preprocessed/effect schemas', () => {
    const flat = flattenZodShape({ count: z.preprocess((v) => Number(v), z.number()) });

    expect(flat).toHaveProperty('count');
  });
});

// ---------------------------------------------------------------------------
// asQuerySchema
// ---------------------------------------------------------------------------

describe('asQuerySchema', () => {
  const nested = z.object({
    search: z.string().optional(),
    sort: z.object({ field: z.string(), order: z.enum(['asc', 'desc']) }).optional(),
  });

  it('parses a valid flat input', () => {
    const result = asQuerySchema(nested).safeParse({ search: 'foo', field: 'name', order: 'asc' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ search: 'foo', field: 'name', order: 'asc' });
  });

  it('parses successfully when all optional fields are omitted', () => {
    expect(asQuerySchema(nested).safeParse({}).success).toBe(true);
  });

  it('rejects the original nested input shape', () => {
    expect(asQuerySchema(nested).safeParse({ sort: { field: 'name', order: 'asc' } }).success).toBe(false);
  });

  it('rejects unknown keys because the schema is strict', () => {
    expect(asQuerySchema(nested).safeParse({ field: 'name', order: 'asc', extra: 1 }).success).toBe(false);
  });

  it('rejects invalid values for promoted enum fields', () => {
    expect(asQuerySchema(nested).safeParse({ order: 'invalid' }).success).toBe(false);
  });

  it('requires promoted fields from a required nested object', () => {
    const schema = asQuerySchema(z.object({ pagination: z.object({ offset: z.number(), limit: z.number() }) }));

    expect(schema.safeParse({ offset: 0, limit: 10 }).success).toBe(true);
    expect(schema.safeParse({ pagination: { offset: 0, limit: 10 } }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isZodObject
// ---------------------------------------------------------------------------

describe('isZodObject', () => {
  it('returns true for a ZodObject', () => {
    expect(isZodObject(z.object({}))).toBe(true);
    expect(isZodObject(z.object({ id: z.string() }))).toBe(true);
  });

  it('returns false for primitive schemas', () => {
    expect(isZodObject(z.string())).toBe(false);
    expect(isZodObject(z.number())).toBe(false);
    expect(isZodObject(z.boolean())).toBe(false);
  });

  it('returns false for a ZodOptional wrapping a ZodObject', () => {
    expect(isZodObject(z.object({}).optional())).toBe(false);
  });

  it('returns false for ZodArray, ZodEnum, and ZodNullable', () => {
    expect(isZodObject(z.array(z.string()))).toBe(false);
    expect(isZodObject(z.enum(['a', 'b']))).toBe(false);
    expect(isZodObject(z.object({}).nullable())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isZodOptional
// ---------------------------------------------------------------------------

describe('isZodOptional', () => {
  it('returns true for a ZodOptional', () => {
    expect(isZodOptional(z.string().optional())).toBe(true);
    expect(isZodOptional(z.object({}).optional())).toBe(true);
  });

  it('returns false for non-optional schemas', () => {
    expect(isZodOptional(z.string())).toBe(false);
    expect(isZodOptional(z.object({}))).toBe(false);
  });

  it('returns false for ZodNullable (distinct from ZodOptional)', () => {
    expect(isZodOptional(z.string().nullable())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unwrapOptional
// ---------------------------------------------------------------------------

describe('unwrapOptional', () => {
  it('returns the inner schema from a ZodOptional', () => {
    const inner = z.string();
    expect(unwrapOptional(inner.optional())).toBe(inner);
  });

  it('returns the schema unchanged when it is not optional', () => {
    const schema = z.string();
    expect(unwrapOptional(schema)).toBe(schema);
  });

  it('returns the schema unchanged for ZodNullable', () => {
    const schema = z.string().nullable();
    expect(unwrapOptional(schema)).toBe(schema);
  });

  it('unwraps an optional ZodObject and returns the inner ZodObject', () => {
    const inner = z.object({ id: z.string() });
    expect(unwrapOptional(inner.optional())).toBe(inner);
  });
});

// ---------------------------------------------------------------------------
// Type inference (compile-time assertions, no runtime behavior)
// ---------------------------------------------------------------------------

// required nested object → flat required fields
{
  const _schema = asQuerySchema(z.object({ where: z.object({ id: z.string(), active: z.boolean() }) }));
  type _T = z.infer<typeof _schema>;
  type _Check = Expect<Equal<_T, { id: string; active: boolean }>>;
}

// optional nested object → all promoted fields become optional
{
  const _schema = asQuerySchema(z.object({ sort: z.object({ field: z.string(), order: z.string() }).optional() }));
  type _T = z.infer<typeof _schema>;
  type _Check = Expect<Equal<_T, { field?: string; order?: string }>>;
}

// .partial() on parent → all nested fields optional
{
  const _schema = asQuerySchema(
    z
      .object({
        where: z.object({ isAdmin: z.boolean() }),
        offset: z.number().optional(),
        limit: z.number().optional(),
      })
      .partial()
  );
  type _T = z.infer<typeof _schema>;
  type _Check = Expect<Equal<_T, { isAdmin?: boolean; offset?: number; limit?: number }>>;
}

// flat primitives preserved as-is
{
  const _schema = asQuerySchema(z.object({ name: z.string(), count: z.number(), active: z.boolean() }));
  type _T = z.infer<typeof _schema>;
  type _Check = Expect<Equal<_T, { name: string; count: number; active: boolean }>>;
}

// mixed: flat optional primitive + promoted fields from optional nested object
{
  const _schema = asQuerySchema(
    z.object({
      search: z.string().optional(),
      sort: z.object({ field: z.string(), order: z.enum(['asc', 'desc']) }).optional(),
    })
  );
  type _T = z.infer<typeof _schema>;
  type _Check = Expect<Equal<_T, { search?: string; field?: string; order?: 'asc' | 'desc' }>>;
}
