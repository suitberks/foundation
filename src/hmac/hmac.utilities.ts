import { decodeBase64, encodeBase64 } from '@/base64';
import { isString } from '@/guard';

import { HMAC_BASE64_OPTIONS, HMAC_HEX_SIGNATURE_PATTERN } from './hmac.constants';
import type { HMACEncoding } from './hmac.enums';
import { hmacEncoding } from './hmac.enums';
import { hmacErrors } from './hmac.errors';
import type { HMACInput } from './hmac.types';
import { validateHMACEncoding } from './hmac.validation';

/**
 * Shared UTF-8 encoder reused by every HMAC input conversion in this module.
 * The encoder holds no per-call state, so one instance serves every caller.
 */
const textEncoder = new TextEncoder();

/**
 * Converts an HMAC payload or secret into an isolated byte array representation.
 * Strings use UTF-8 while supplied bytes are copied to prevent later mutation.
 */
export function toHMACBytes(input: HMACInput): Uint8Array<ArrayBuffer> {
  if (isString(input)) {
    return textEncoder.encode(input);
  }

  const bytes = new Uint8Array(input.length);
  bytes.set(input);

  return bytes;
}

/**
 * Encodes binary HMAC output with one supported transport-safe representation.
 * Hex output remains lowercase while Base64 URL output omits conventional padding.
 */
export function encodeHMACSignature(signature: Uint8Array, encoding: HMACEncoding): string {
  validateHMACEncoding(encoding);

  if (encoding === hmacEncoding.HEX) {
    return signature.toHex();
  }

  return encodeBase64(signature, HMAC_BASE64_OPTIONS[encoding]);
}

/**
 * Decodes a textual HMAC signature into bytes for cryptographic verification.
 * Malformed alphabets, lengths, or padding combinations reject with `TypeError`.
 */
export function decodeHMACSignature(signature: string, encoding: HMACEncoding): Uint8Array<ArrayBuffer> {
  validateHMACEncoding(encoding);

  if (encoding === hmacEncoding.HEX) {
    const hasValidHexSignature = signature.length % 2 === 0 && HMAC_HEX_SIGNATURE_PATTERN.test(signature);

    if (hasValidHexSignature === false) {
      throw hmacErrors.invalidHexSignature();
    }

    return Uint8Array.fromHex(signature);
  }

  try {
    return decodeBase64(signature, HMAC_BASE64_OPTIONS[encoding]);
  } catch {
    throw encoding === hmacEncoding.BASE64
      ? hmacErrors.invalidBase64Signature()
      : hmacErrors.invalidBase64UrlSignature();
  }
}
