import { isString } from '@/guard';

import { BASE64_PADDED_PATTERNS, BASE64_UNPADDED_PATTERNS, DEFAULT_BASE64_ALPHABET } from './base64.constants';
import { base64Errors } from './base64.errors';
import type { Base64Options } from './base64.types';
import { assertBase64Options } from './base64.validation';

/**
 * Encodes arbitrary binary bytes into one canonical Base64 text representation.
 * The standard padded alphabet applies unless the options select another form.
 *
 * @example
 * encodeBase64(bytes, { alphabet: 'base64url', omitPadding: true }); // ← `AAF_gP7_`
 */
export function encodeBase64(bytes: Uint8Array, options: Base64Options = {}): string {
  const { alphabet = DEFAULT_BASE64_ALPHABET, omitPadding = false } = options;

  assertBase64Options(alphabet, omitPadding);

  return bytes.toBase64({ alphabet, omitPadding });
}

/**
 * Decodes one canonical Base64 text representation into its original binary bytes.
 * Whitespace, foreign alphabets, wrong padding, and stray bits reject the input.
 */
export function decodeBase64(value: string, options: Base64Options = {}): Uint8Array<ArrayBuffer> {
  const { alphabet = DEFAULT_BASE64_ALPHABET, omitPadding = false } = options;

  assertBase64Options(alphabet, omitPadding);

  // ↓ Reject non-canonical shapes before native decoding can tolerate them.

  const pattern = omitPadding ? BASE64_UNPADDED_PATTERNS[alphabet] : BASE64_PADDED_PATTERNS[alphabet];
  const hasCanonicalShape = isString(value) && pattern.test(value);

  if (hasCanonicalShape === false) {
    throw base64Errors.invalidBase64Value();
  }

  // Restore omitted padding so strict native decoding also rejects non-zero trailing bits.
  const paddedValue = value.padEnd(Math.ceil(value.length / 4) * 4, '=');

  try {
    return Uint8Array.fromBase64(paddedValue, { alphabet, lastChunkHandling: 'strict' });
  } catch {
    throw base64Errors.invalidBase64Value();
  }
}
