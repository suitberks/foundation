import { afterEach, describe, expect, setSystemTime, test } from 'bun:test';

import { enUS } from 'date-fns/locale';

import {
  type ReplaceDotsWithUnderscores,
  type ReplaceHyphensWithUnderscores,
  type Simplify,
  type StringEnumRecord,
  createStringEnumRecord,
  decodeBase64,
  encodeBase64,
  formatTime,
  generateRandomString,
  getFormattedDate,
  getFormattedTime,
  getUTCOffset,
  getZonedTime,
} from '@/index';

// =====================================================================================================================
// COMPILE-TIME CONTRACT SUPPORT
// =====================================================================================================================

/**
 * Compares two types in both directions, rather than accepting ordinary assignability.
 * This keeps public type regressions visible to the regular project typecheck.
 */
type IsExact<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2
    ? (<Value>() => Value extends Expected ? 1 : 2) extends <Value>() => Value extends Actual ? 1 : 2
      ? true
      : false
    : false;

/**
 * Produces a compiler error when a type-level proposition is not exactly true.
 * The underscore-prefixed aliases below are intentionally consumed only by TypeScript.
 */
type Assert<Condition extends true> = Condition;

type _ReplaceDotsContract = Assert<
  IsExact<ReplaceDotsWithUnderscores<'foundation.utilities.deep.value'>, 'foundation_utilities_deep_value'>
>;
type _ReplaceDotsWithoutDotsContract = Assert<IsExact<ReplaceDotsWithUnderscores<'unchanged'>, 'unchanged'>>;
type _ReplaceHyphensContract = Assert<
  IsExact<ReplaceHyphensWithUnderscores<'foundation-utilities-deep-value'>, 'foundation_utilities_deep_value'>
>;
type _ReplaceHyphensWithoutHyphensContract = Assert<IsExact<ReplaceHyphensWithUnderscores<'unchanged'>, 'unchanged'>>;
type _StringEnumRecordContract = Assert<
  IsExact<
    StringEnumRecord<readonly ['user.active', 'pending-review']>,
    Readonly<{ USER_ACTIVE: 'user.active'; PENDING_REVIEW: 'pending-review' }>
  >
>;
type _SimplifyContract = Assert<
  IsExact<Simplify<{ identifier: string } & { enabled?: boolean }>, { identifier: string; enabled?: boolean }>
>;

// =====================================================================================================================
// BINARY ENCODING UTILITIES
// =====================================================================================================================

describe('Base64 utilities', () => {
  test('round-trips arbitrary binary bytes without interpreting them as text', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 254, 255]);

    expect(encodeBase64(bytes)).toBe('AAF/gP7/');
    expect(decodeBase64('AAF/gP7/')).toEqual(bytes);
  });

  test('preserves empty input in both encoding directions', () => {
    expect(encodeBase64(new Uint8Array())).toBe('');
    expect(decodeBase64('')).toEqual(new Uint8Array());
  });

  test('encodes byte arrays larger than the function argument limit', () => {
    const bytes = Uint8Array.from({ length: 100_000 }, (_, index) => index % 256);

    expect(decodeBase64(encodeBase64(bytes))).toEqual(bytes);
  });

  test('preserves the native decoding failure for malformed Base64 input', () => {
    expect(() => decodeBase64('not base64')).toThrow();
  });
});

// =====================================================================================================================
// STRING ENUM UTILITIES
// =====================================================================================================================

describe('createStringEnumRecord', () => {
  test('normalizes dots and hyphens, uppercases keys, and preserves literal values', () => {
    const statuses = createStringEnumRecord(['draft', 'review.in.progress', 'published-value'] as const);

    // Dots and hyphens share separator semantics while source literals remain unchanged as record values.
    expect(statuses).toEqual({
      DRAFT: 'draft',
      REVIEW_IN_PROGRESS: 'review.in.progress',
      PUBLISHED_VALUE: 'published-value',
    });
  });

  test('returns a frozen record so runtime behavior matches its readonly type', () => {
    const statuses = createStringEnumRecord(['draft'] as const);

    expect(Object.isFrozen(statuses)).toBe(true);
    expect(() => Reflect.set(statuses, 'DRAFT', 'published')).not.toThrow();
    expect(statuses.DRAFT).toBe('draft');
  });

  test('supports an empty readonly source without adding synthetic members', () => {
    expect(createStringEnumRecord([] as const)).toEqual({});
  });
});

// =====================================================================================================================
// RANDOM STRING GENERATION
// =====================================================================================================================

describe('generateRandomString', () => {
  test('uses the documented default length and alphanumeric alphabet', () => {
    const value = generateRandomString();

    // Exact bytes are intentionally nondeterministic; shape and alphabet are the useful public guarantees.
    expect(value).toHaveLength(10);
    expect(value).toMatch(/^[A-Za-z0-9]+$/);
  });

  test.each([0, 1, 64])('honors an explicit length of %i', (length) => {
    const value = generateRandomString(length);

    expect(value).toHaveLength(length);
    expect(value).toMatch(length === 0 ? /^$/ : /^[A-Za-z0-9]+$/);
  });

  test('rejects negative lengths through the underlying typed-array boundary', () => {
    expect(() => generateRandomString(-1)).toThrow(RangeError);
  });
});

// =====================================================================================================================
// TIMEZONE-AWARE DATE AND TIME UTILITIES
// =====================================================================================================================

const FIXED_NOW = new Date('2024-01-02T00:04:05.678Z');

afterEach(() => {
  // Restoring the clock keeps these tests isolated from unrelated files in the same Bun process.
  setSystemTime();
});

describe('timezone utilities', () => {
  test('reports stable UTC offsets, including DST and fractional-hour zones', () => {
    expect(getUTCOffset(new Date('2024-01-15T12:00:00.000Z'), 'UTC')).toBe('(+0 UTC)');
    expect(getUTCOffset(new Date('2024-01-15T12:00:00.000Z'), 'America/New_York')).toBe('(-5 UTC)');
    expect(getUTCOffset(new Date('2024-07-15T12:00:00.000Z'), 'America/New_York')).toBe('(-4 UTC)');
    expect(getUTCOffset(new Date('2024-01-15T12:00:00.000Z'), 'Asia/Kathmandu')).toBe('(+5.75 UTC)');
  });

  test('projects the current instant into the requested timezone', () => {
    setSystemTime(FIXED_NOW);

    const utcNow = getZonedTime({ tz: 'UTC' });

    // toZonedTime intentionally encodes target-zone wall-clock fields in a Date value.
    expect([
      utcNow.getFullYear(),
      utcNow.getMonth(),
      utcNow.getDate(),
      utcNow.getHours(),
      utcNow.getMinutes(),
      utcNow.getSeconds(),
    ]).toEqual([2024, 0, 2, 0, 4, 5]);
  });

  test('formats the current time with its explicit timezone context', () => {
    setSystemTime(FIXED_NOW);

    expect(getFormattedTime({ tz: 'UTC' })).toBe('00:04:05 (+0 UTC)');
    expect(getFormattedTime({ tz: 'Europe/Moscow' })).toBe('03:04:05 (+3 UTC)');
  });

  test('formats the current date with optional time and offset components', () => {
    setSystemTime(FIXED_NOW);

    expect(getFormattedDate({ tz: 'UTC' })).toBe('02.01.2024 00:04:05 (+0 UTC)');
    expect(getFormattedDate({ tz: 'Europe/Moscow', withTime: false })).toBe('02.01.2024');
  });

  test('formats an explicit instant with the requested locale and timezone', () => {
    expect(formatTime(FIXED_NOW, { locale: enUS, tz: 'UTC' })).toBe('00:04:05, 2 January 2024 (+0 UTC)');
    expect(formatTime(FIXED_NOW, { locale: enUS, tz: 'Europe/Moscow' })).toBe('03:04:05, 2 January 2024 (+3 UTC)');
  });
});
