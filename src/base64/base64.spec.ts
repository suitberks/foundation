import { describe, expect, test } from 'bun:test';

import { decodeBase64, encodeBase64 } from '@/index';

// These tests describe binary Base64 encoding, decoding, and native failure behavior;
// They preserve byte identity across empty, ordinary, malformed, and large payloads;

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

  test('encodes byte arrays larger than one bounded conversion chunk', () => {
    const bytes = Uint8Array.from({ length: 100_000 }, (_, index) => index % 256);

    expect(decodeBase64(encodeBase64(bytes))).toEqual(bytes);
  });

  test('preserves the native decoding failure for malformed Base64 input', () => {
    expect(() => decodeBase64('not base64')).toThrow();
  });
});
