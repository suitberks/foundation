import { describe, expect, test } from 'bun:test';

import { z } from 'zod';

import { zodAtLeastOne, zodErrors } from '@/index';
import type { AtLeastOne, ZodErrorCode } from '@/index';

// These tests describe the public behavior covered by the Zod module specification;
// They preserve exact refinement types and stable validation failures for object schemas;

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;
type Assert<TCondition extends true> = TCondition;

type Patch = { name?: string; count?: number; enabled?: boolean; nullable?: string | null };

const patchSchema = zodAtLeastOne(
  z
    .object({
      name: z.string().optional(),
      count: z.number().optional(),
      enabled: z.boolean().optional(),
      nullable: z.string().nullable().optional(),
    })
    .strict()
);

type _AtLeastOneOutputContract = Assert<IsExact<z.output<typeof patchSchema>, AtLeastOne<Patch>>>;
type _ErrorCodeContract = Assert<IsExact<ZodErrorCode, 'atLeastOneRequired'>>;

// == Validation ========================================================

describe('zodAtLeastOne', () => {
  test.each([{ name: '' }, { count: 0 }, { enabled: false }, { nullable: null }, { name: 'value', count: 2 }])(
    'accepts any defined property value, including falsy and null values: %o',
    (value) => {
      expect(patchSchema.parse(value)).toEqual(value);
    }
  );

  test.each([{}, { name: undefined }, { count: undefined, enabled: undefined }])(
    'rejects objects without a defined property using one stable error code: %o',
    (value) => {
      const result = patchSchema.safeParse(value);

      expect(result.success).toBe(false);
      if (result.success === false) {
        expect(result.error.issues).toContainEqual({
          ...zodErrors.atLeastOneRequired(),
          path: [],
        });
      }
    }
  );

  test('retains wrapped schema validation before applying presence refinement', () => {
    const result = patchSchema.safeParse({ count: 'not-a-number' });

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.issues[0]?.code).toBe('invalid_type');
    }
  });

  test('retains strict unknown-key behavior from the wrapped object schema', () => {
    const result = patchSchema.safeParse({ name: 'valid', unexpected: true });

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.issues[0]?.code).toBe('unrecognized_keys');
    }
  });
});
