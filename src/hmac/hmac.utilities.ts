import type { HMACEncoding } from './hmac.enums';
import { hmacErrors } from './hmac.errors';
import type { HMACInput } from './hmac.types';

const textEncoder = new TextEncoder(); // ← Shared stateless UTF-8 encoder.

/**
 * Converts an HMAC payload or secret into an isolated byte array representation.
 * Strings use UTF-8 while supplied bytes are copied to prevent later mutation.
 */
export function toHMACBytes(input: HMACInput): Uint8Array<ArrayBuffer> {
  if (typeof input === 'string') return textEncoder.encode(input);

  // ↓ Copy bytes into an isolated `ArrayBuffer`-backed view accepted by Web Crypto.

  const bytes = new Uint8Array(input.length);
  bytes.set(input);

  return bytes;
}

/**
 * Encodes binary HMAC output with one supported transport-safe representation.
 * Hex output remains lowercase while Base64 URL output omits conventional padding.
 */
export function encodeHMACSignature(signature: Uint8Array, encoding: HMACEncoding): string {
  if (encoding === 'hex') return signature.toHex();
  if (encoding === 'base64') return signature.toBase64();

  return signature.toBase64({ alphabet: 'base64url', omitPadding: true });
}

/**
 * Decodes a textual HMAC signature into bytes for cryptographic verification.
 * Malformed alphabets, lengths, or padding combinations reject with `TypeError`.
 */
export function decodeHMACSignature(signature: string, encoding: HMACEncoding): Uint8Array<ArrayBuffer> {
  if (encoding === 'hex') {
    // ↓ Reject odd-length or non-hexadecimal signatures before native decoding.

    if (signature.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(signature)) {
      throw hmacErrors.invalidHexSignature();
    }

    return Uint8Array.fromHex(signature);
  }

  if (encoding === 'base64') {
    // ↓ Require canonical Base64 groups and padding before native decoding.

    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(signature)) {
      throw hmacErrors.invalidBase64Signature();
    }

    return Uint8Array.fromBase64(signature, { lastChunkHandling: 'strict' });
  }

  // ↓ Accept unpadded URL-safe signatures while rejecting impossible lengths.

  if (!/^[A-Za-z0-9_-]*$/.test(signature) || signature.length % 4 === 1) {
    throw hmacErrors.invalidBase64UrlSignature();
  }

  return Uint8Array.fromBase64(signature, { alphabet: 'base64url' });
}
