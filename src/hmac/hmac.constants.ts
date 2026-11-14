import type { Base64Options } from '@/base64';
import { base64Alphabet } from '@/base64';

import type { HMACEncoding } from './hmac.enums';
import { hmacAlgorithm, hmacEncoding } from './hmac.enums';

/**
 * Default digest algorithm used by `HMACService` when none is configured.
 * SHA-256 provides broad Web Crypto support and a 256-bit authentication tag.
 */
export const DEFAULT_HMAC_ALGORITHM = hmacAlgorithm.SHA_256;

/**
 * Default textual encoding used for every signature returned by `HMACService`.
 * Hex output remains deterministic, portable, and independent of padding rules.
 */
export const DEFAULT_HMAC_ENCODING = hmacEncoding.HEX;

/**
 * Matches hexadecimal signature digits in either letter case before decoding.
 * Odd lengths are rejected separately because every byte needs two digits.
 */
export const HMAC_HEX_SIGNATURE_PATTERN = /^[0-9a-f]*$/i;

/**
 * Canonical Base64 representations assigned to Base64-based signature encodings.
 * URL-safe signatures omit padding while standard signatures keep their padding.
 */
export const HMAC_BASE64_OPTIONS = {
  [hmacEncoding.BASE64]: { alphabet: base64Alphabet.BASE64 },
  [hmacEncoding.BASE64URL]: { alphabet: base64Alphabet.BASE64URL, omitPadding: true },
} as const satisfies Record<Exclude<HMACEncoding, typeof hmacEncoding.HEX>, Base64Options>;
