import { describe, expect, test } from 'bun:test';

import {
  type Base64Alphabet,
  type Base64ErrorCode,
  type Base64Options,
  DEFAULT_BASE64_ALPHABET,
  base64Alphabet,
  base64AlphabetsArray,
  base64Errors,
  decodeBase64,
  encodeBase64,
} from '@/index';

// These tests describe canonical Base64 encoding, decoding, and option validation.
// They preserve byte identity and reject every representation encoding cannot produce.

// == CompileTimeContracts =============================================

type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

type Assert<TCondition extends true> = TCondition;

type _Base64AlphabetContract = Assert<IsExact<Base64Alphabet, 'base64' | 'base64url'>>;
type _Base64OptionsContract = Assert<
  IsExact<Base64Options, Readonly<{ alphabet?: Base64Alphabet; omitPadding?: boolean }>>
>;
type _Base64ErrorCodeContract = Assert<
  IsExact<Base64ErrorCode, 'invalidBase64Alphabet' | 'invalidBase64PaddingPolicy' | 'invalidBase64Value'>
>;

const bytes = new Uint8Array([0, 1, 127, 128, 254, 255]);

// == Base64Catalogs ===================================================

describe('Base64 catalogs', () => {
  test('keeps literal collections, aliases, and defaults synchronized', () => {
    expect(base64AlphabetsArray).toEqual(['base64', 'base64url']);
    expect(base64Alphabet.BASE64URL).toBe('base64url');
    expect(DEFAULT_BASE64_ALPHABET).toBe(base64Alphabet.BASE64);
  });

  test('creates typed failures with stable camelCase codes', () => {
    expect(base64Errors.invalidBase64Alphabet()).toEqual(new TypeError('invalidBase64Alphabet'));
    expect(base64Errors.invalidBase64PaddingPolicy()).toEqual(new TypeError('invalidBase64PaddingPolicy'));
    expect(base64Errors.invalidBase64Value()).toEqual(new TypeError('invalidBase64Value'));
  });
});

// == Base64Encoding ===================================================

describe('Base64 utilities', () => {
  test.each([
    [{}, 'AAF/gP7/'],
    [{ omitPadding: true }, 'AAF/gP7/'],
    [{ alphabet: base64Alphabet.BASE64URL }, 'AAF_gP7_'],
  ] as const)('round-trips arbitrary binary bytes with %o', (options, encoded) => {
    expect(encodeBase64(bytes, options)).toBe(encoded);
    expect(decodeBase64(encoded, options)).toEqual(bytes);
  });

  test.each([
    [{}, 'AAE='],
    [{ omitPadding: true }, 'AAE'],
    [{ alphabet: base64Alphabet.BASE64URL, omitPadding: true }, 'AAE'],
  ] as const)('applies the selected padding policy to incomplete groups: %o', (options, encoded) => {
    const shortBytes = new Uint8Array([0, 1]);

    expect(encodeBase64(shortBytes, options)).toBe(encoded);
    expect(decodeBase64(encoded, options)).toEqual(shortBytes);
  });

  test('preserves empty input in both encoding directions', () => {
    expect(encodeBase64(new Uint8Array())).toBe('');
    expect(decodeBase64('')).toEqual(new Uint8Array());
  });

  test('round-trips large byte arrays without argument-count limits', () => {
    const largeBytes = Uint8Array.from({ length: 100_000 }, (_, index) => index % 256);

    expect(decodeBase64(encodeBase64(largeBytes))).toEqual(largeBytes);
  });

  test.each([
    ['not base64', {}],
    ['AAE', {}],
    ['AAE=', { omitPadding: true }],
    ['AAF_gP7_', {}],
    ['AAF/gP7/', { alphabet: base64Alphabet.BASE64URL }],
    ['A', { omitPadding: true }],
    ['AB==', {}],
  ] as const)('rejects non-canonical input %p with %o using one stable error code', (value, options) => {
    expect(() => decodeBase64(value, options)).toThrow('invalidBase64Value');
  });

  test('rejects unsupported runtime options before processing data', () => {
    expect(() => encodeBase64(bytes, { alphabet: 'base32' as Base64Alphabet })).toThrow('invalidBase64Alphabet');
    expect(() => decodeBase64('', { omitPadding: 'yes' as unknown as boolean })).toThrow('invalidBase64PaddingPolicy');
  });
});
