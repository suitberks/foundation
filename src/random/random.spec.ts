import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_RANDOM_STRING_LENGTH,
  RANDOM_ALPHANUMERIC_CHARACTERS,
  RANDOM_BYTE_BATCH_SIZE,
  type RandomErrorCode,
  generateRandomString,
  randomErrors,
} from '@/index';

// == CompileTimeContracts =============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _RandomErrorCodeContract = Assert<IsExact<RandomErrorCode, 'invalidRandomStringLength'>>;

// == RandomPolicies ===================================================

describe('random policies', () => {
  test('publishes the default alphabet, output length, and Web Crypto batch boundary', () => {
    expect(RANDOM_ALPHANUMERIC_CHARACTERS).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
    expect(DEFAULT_RANDOM_STRING_LENGTH).toBe(10);
    expect(RANDOM_BYTE_BATCH_SIZE).toBe(65_536);
  });

  test('creates typed policy failures with stable camelCase codes', () => {
    expect(randomErrors.invalidRandomStringLength()).toEqual(new RangeError('invalidRandomStringLength'));
  });
});

// == RandomStringGeneration ===========================================

describe('generateRandomString', () => {
  test('uses the documented default length and alphanumeric collection', () => {
    const value = generateRandomString();

    expect(value).toHaveLength(DEFAULT_RANDOM_STRING_LENGTH);
    expect(value).toMatch(/^[A-Za-z0-9]+$/);
  });

  test.each([0, 1, 64, 100_000])('honors an explicit length of %i', (length) => {
    const value = generateRandomString(length);

    expect(value).toHaveLength(length);
    expect(value).toMatch(length === 0 ? /^$/ : /^[A-Za-z0-9]+$/);
  });

  test.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid output length %p with one stable error',
    (length) => {
      expect(() => generateRandomString(length)).toThrow('invalidRandomStringLength');
    }
  );
});
