import { describe, expect, test } from 'bun:test';

import { isPlainObject } from '@/index';

// These tests describe the public behavior covered by the object module specification.
// They preserve ordinary-record recognition across native and custom object boundaries.

describe('isPlainObject', () => {
  test('accepts ordinary records regardless of whether they are empty', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ nested: { value: 1 } })).toBe(true);
  });

  test.each([[null], [undefined], ['value'], [42], [true], [[]], [new Date()], [/pattern/], [new Map()]] as const)(
    'rejects non-record input %#',
    (value) => {
      expect(isPlainObject(value)).toBe(false);
    }
  );

  test('rejects instances backed by custom prototypes', () => {
    class Example {
      public readonly value = true;
    }

    expect(isPlainObject(new Example())).toBe(false);
    expect(isPlainObject(Object.create(null))).toBe(false);
  });
});
